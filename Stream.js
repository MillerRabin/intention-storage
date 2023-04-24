import coreModule from './core.js';

const core = await coreModule.getModule();

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

async function receive(data) {
    if (isBlob(data))
        data = getArrayFromBlob(data);
    return await core.parse(data);
}

export default class Stream {
    #data;
    #chunkSize;

    constructor(data, chunkSize) {
        this.#data = data;
        this.#chunkSize = chunkSize;
    }

    send(channel, mode = 'json') {        
        return core.send({ channel, message: this.#data, mode, chunkSize: this.#chunkSize });
    }

    get chunkSize() { return this.#chunkSize; }
    get data() { return this.#data; }

    static from(channel) {
        const stream = new Stream(null, channel.maxMessageSize);
        channel.onmessage = async function (event) {                                    
            const data = event.data;
            const message = await receive(data);
            stream.onmessage(message);
        };
        return stream;
    }
};
