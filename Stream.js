function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getID() {
    return new Uint32Array([getRandomInt(0, 0xFFFFFFFF), getRandomInt(0, 0xFFFFFFFF), getRandomInt(0, 0xFFFFFFFF), getRandomInt(0, 0xFFFFFFFF)]);
}

function getEffectiveChunkSize(stream) {
    return stream._chunkSize - (stream._id.byteLength + 12);
}

function allocateBuffer(stream) {
    return new Uint8Array(stream._chunkSize);
}

function setHeader(stream, buffer) {
    try {
        const header = new Uint8Array(stream._id.buffer);
        buffer.set(header, 0);
        return stream._id.byteLength;
    } catch (e) {
        console.log(e);
    }

}

function getChunkSize(stream, data, offset) {
    const left = data.byteLength - offset;
    const eChunkSize = getEffectiveChunkSize(stream);
    return (left > eChunkSize) ? eChunkSize : left;
}

const gMsgHash = {};

function renewCancelTimeout(msgData) {
    if (msgData.cancelTimeout != null) clearTimeout(msgData.cancelTimeout);
    msgData.cancelTimeout = setTimeout(function () {
        msgData.reject(new Error('Time is out'));
    }, 5000);
}

function checkMessage(msgData) {
    let oldOffset;
    for (const offset of msgData.offsets) {
        if ((oldOffset != null) && (oldOffset[1] != offset[0])) return false;
        if (offset[1] == msgData.length) {
            msgData.resolve();
            return true;
        }
        if (offset[1] > msgData.length) {
            msgData.reject(new Error('The offset of message bigger than message length'));
            return false;
        }
        oldOffset = offset;
    }
}

function addOffset(msg, start, end) {
    const elemIndex = msg.offsets.findIndex(([tStart]) => tStart == start);
    if (elemIndex != -1) {
        const [, tEnd] = msg.offsets[elemIndex];
        if (tEnd != end)
            msg.reject(new Error('Invalid chunk'));
        return;
    }
    msg.offsets.push([start, end]);
    msg.offsets.sort((a, b) => {
       const aStart = a[0];
       const bStart = a[1];
       if (aStart < bStart) return -1;
       if (aStart > bStart) return 1;
       return 0;
    });
}

function getMessage(stream, id, buffer, length, start, end) {
    if (gMsgHash[id] == null) {
        const mData = {
            length: length,
            offsets: [],
            buffer: new Uint8Array(length)
        };
        gMsgHash[id] = mData;
        mData.ready = new Promise((resolve, reject) => {
            mData.reject = reject;
            mData.resolve = resolve;
        }).then(() => {
            delete gMsgHash[id];
            if (stream.onmessage != null)
                stream.onmessage(mData.buffer);
        }).catch(() => {
            delete gMsgHash[id];
        });
    }
    const msg = gMsgHash[id];
    const b8 = new Uint8Array(buffer);
    msg.buffer.set(b8, start);
    renewCancelTimeout(msg);
    addOffset(msg, start, end);
    return msg;
}

function isBlob(message) {
    try {
        return message instanceof Blob;
    } catch (e) {
        return false;
    }
}

function getArrayFromBlob(blob) {
    return blob.arrayBuffer();
}

function parseStructure(stream, message) {
    const data = new Uint8Array(message);
    const idA = new Uint32Array(data.buffer, 0, 4);
    const id = idA.join('-');
    const start = new Uint32Array(data.buffer, 16, 1)[0];
    const end = new Uint32Array(data.buffer, 20, 1)[0];
    const length = new Uint32Array(data.buffer, 24, 1)[0];
    const buffer = new Uint8Array(data.buffer, 28, end - start);
    const msg = getMessage(stream, id, buffer, length, start, end);
    checkMessage(msg);
}
module.exports = class Stream {
    constructor(data, chunkSize) {
        this._data = data;
        this._chunkSize = chunkSize;
        this._id = getID();
        this.onmessage = null;
    }

    send(channel) {
        const enc = new TextEncoder();
        const data = enc.encode(this._data);
        let index = 0;
        const buffer = allocateBuffer(this);
        const offset = setHeader(this, buffer);
        while (index < data.byteLength) {
            const cs = getChunkSize(this, data, index);
            const dw = new Uint8Array(data.buffer, index, cs);
            const position = new Uint32Array([index, index + cs, data.byteLength]);
            buffer.set(new Uint8Array(position.buffer), offset);
            const pOffset = offset + position.byteLength;
            buffer.set(dw, pOffset);
            index += dw.byteLength;
            const eLength = pOffset + dw.byteLength;
            const bw = new Uint8Array(buffer.buffer, 0, eLength);
            channel.send(bw);
        }
    }
    static from(channel) {
        const stream = new Stream(null, channel.maxMessageSize);
        channel.onmessage = async function (event) {
            let data = event.data;
            if (isBlob(data))
                data = await getArrayFromBlob(data);
            parseStructure(stream, data);
        };
        return stream;
    }
};
