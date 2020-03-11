const NetworkIntention = require('./NetworkIntention.js');
const Stream = require('./Stream.js');

const gCommandTable = {
    '1:broadcast':  async function (storageLink, message) {
        if (message.intention == null) throw new Error('intention object expected');
        const textIntention = message.intention;
        if ((textIntention.type != 'Intention') && (textIntention.type != 'NetworkIntention'))
            throw new Error('type of object must be Intention or NetworkIntention');
        try {
            return await broadcast(storageLink, textIntention);
        } catch (e) {
            return null;
        }
    },
    '1:message':  async function (storageLink, message) {
        try {
            const mData = await parseMessage(storageLink, message);
            const result = await mData.intention.send(message.status, mData.target, message.data);
            await sendStatus({storageLink, status: 'OK', requestId: mData.result.requestId, result});
        } catch (e) {
            if (e instanceof Error) return;
            sendStatus({storageLink, status: 'FAILED', requestId: e.requestId, result: e});
        }
    },
    '1:ping': async function (storageLink) {
        storageLink.sendObject({
            command: 'pong',
            version: 1
        });
    },
    '1:pong': async function (storageLink) {
        storageLink.setAlive();
    },
    '1:requestStatus':  async function (storageLink, message) {
       try {
            NetworkIntention.updateRequestObject(message);
       } catch (e) {}
    },
    '1:getAccepted':  async function (storageLink, message) {
        try {
            const mData = parseStatusMessage(storageLink, message);
            const accepted = mData.intention.accepted;
            await sendStatus({storageLink, status: 'OK', requestId: mData.result.requestId, result: accepted.toObject() });
        } catch (e) {
            parseError(storageLink, e);
        }
    },
    '1:setAccepted':  async function (storageLink, message) {
        try {
            const mData = await parseMessage(storageLink, message);
            mData.intention.accepted.set(mData.target);
            await sendStatus({storageLink, status: 'OK', requestId: mData.result.requestId });
        } catch (e) {
            parseError(storageLink, e);
        }
    },
    '1:deleteAccepted':  async function (storageLink, message) {
        try {
            const mData = parseStatusMessage(storageLink, message);
            mData.target = storageLink._storage.intentions.byId(message.intention);
            if (mData.target == null) throwObject(mData.result, 'Target intention is not found');
            mData.intention.accepted.delete(message.data);
            mData.intention.send('close', mData.target, message.data);
            await sendStatus({storageLink, status: 'OK', requestId: mData.result.requestId });
        } catch (e) {
            parseError(storageLink, e);
        }
    },
};

function parseError(storageLink, e) {
    if (e instanceof Error) return;
    sendStatus({storageLink, status: 'FAILED', requestId: e.requestId, result: e}).catch(() => {});
}

function parseUrl(url) {
    const reg = /(.+):\/\/(.+):(.+)/;
    const match = reg.exec(url);
    if (match == null) throw new Error('Wrong url');
    return { scheme: match[1], origin: match[2], port: match[3] };
}

async function getStorageLink(textIntention, storageLink) {
    const tUrl = textIntention.origin;
    const sUrl = storageLink.key;
    if ((storageLink.socket == null) || (tUrl == null) || (tUrl == sUrl)) return storageLink;
    const params = parseUrl(tUrl);
    const link = storageLink._storage.addStorage({ ...params, handling: 'auto' });
    try {
        await link.waitConnection(10000);
        return link;
    } catch (e) {
        storageLink._storage.deleteStorage(link);
        throw new Error(`Connection with ${tUrl} cat't be established`);
    }
}

async function broadcast(storageLink, textIntention) {
    if (textIntention.id == null) throw new Error('Intention id must exists');
    const target =  storageLink._storage.intentions.byId(textIntention.id);
    if (target != null) return target;
    textIntention.storageLink = await getStorageLink(textIntention, storageLink);
    const intention = new NetworkIntention(textIntention);
    storageLink._storage.addNetworkIntention(intention);
    return intention;
}

async function sendStatus({storageLink, status, requestId, result}) {
    if (requestId == null) throw new Error({ message: 'requestId is null', ...result});
    await storageLink.sendObject({
        command: 'requestStatus',
        version: 1,
        status,
        requestId,
        result
    });
}

function throwObject(rObj, message) {
    rObj.messages.push(message);
    throw rObj;
}

function parseStatusMessage(storageLink, message) {
    const rObj = { messages: [] };
    rObj.requestId = message.requestId;
    if (rObj.requestId == null) rObj.messages.push('requestId field must exists');
    rObj.id = message.id;
    if (rObj.id == null) throwObject(rObj, 'Intention id field must exists');
    const intention = storageLink._storage.intentions.byId(rObj.id);
    if (intention == null) {
        rObj.operation = 'delete';
        throwObject(rObj, 'The Intention is not found at the origin')
    }
    if (intention.type != 'Intention')
        throwObject(rObj, 'Intention must be of type Intention');
    return { message, intention, result: rObj };
}


async function parseMessage(storageLink, message) {
    const pStatus = parseStatusMessage(storageLink, message);
    if (message.status == null) pStatus.result.messages.push('message status field must exists');
    if (message.intention == null)
        throwObject(pStatus.result, 'intention field must exists');
    pStatus.target = await broadcast(storageLink, message.intention);
    if (pStatus.target == null)
        throwObject(pStatus.result, 'Intention is not found');
    return pStatus;
}

async function dispatchMessage(linkedStorage, data) {
    try {
        const dec = new TextDecoder();
        const message = dec.decode(data);
        const obj = JSON.parse(message);
        await linkedStorage.dispatchMessage(obj);
    } catch (e) {}
}

function send(channel, obj) {
    const maxLength = (channel.maxMessageSize == undefined) ? 65535 : channel.maxMessageSize;
    const msg = JSON.stringify(obj);
    const stream = new Stream(msg, maxLength);
    stream.send(channel);
}

module.exports = class LinkedStorageAbstract {
    constructor({ storage, port = 10010, handling, socket, channel }) {
        if (storage == null) throw new Error('Storage must be exists');
        if (handling == null) throw new Error('Manage type must be defined');
        this._intentions = new Map();
        this._storage = storage;
        this._port = port;
        this._handling = handling;
        this.socket = socket;
        this._disposed = false;
        this.channel = channel;
        this._lifeTimeout = null;
        this._lifeTime = storage.lifeTime;
        this._pingTimeout = null;
    }

    async dispatchMessage(data) {
        const key = `${data.version}:${data.command}`;
        const func = gCommandTable[key];
        if (func == null) {
            throw new Error(`${key} command is not supported`);
        }
        return await func(this, data);
    }

    sendObject(obj) {
        const channel = this.getChannel();
        return send(channel, obj);
    }

    set socket(value) {
        if (this._socket != null)
            this._socket.close();

        this._socket = value;
        if (value == null) {
            return;
        }

        const stream = Stream.from(value);
        stream.onmessage = (data) => {
            dispatchMessage(this, data);
        };
    }

    set channel(value) {
        if (this._channel != null)
            this._channel.close();

        this._channel = value;
        if (value == null) {
            return;
        }

        const stream = Stream.from(value);
        stream.onmessage = (message) => {
            dispatchMessage(this, message);
        };
    }

    addIntention(intention) {
        return this._intentions.set(intention.id, intention);
    }

    deleteIntention(intention) {
        return this._intentions.delete(intention.id);
    }

    getChannel() {
        if (this.channel != null) return this.channel;
        if ((this.socket == null) || (this.socket.readyState != 1)) {
            throw new Error('Connection lost');
        }
        return this.socket;
    }

    setAlive() {
        if (this._lifeTimeout != null)
            clearTimeout(this._lifeTimeout);
        this._lifeTimeout = setTimeout(() => {
            this.close();
        }, this._lifeTime + 1000);
    }

    get socket() {
        return this._socket;
    }

    get type() {
        return this._type;
    }

    get handling() {
        return this._handling;
    }

    get port() {
        return this._port;
    }

    get disposed() {
        return this._disposed;
    }

    get channel() {
        return this._channel;
    }

    get lifeTime() {
        return this._lifeTime;
    }

    set lifeTime(value) {
        this._lifeTime = value;
        this.setAlive();
    }

    offline() {
        for(let [,intention] of this._intentions) {
            this._storage.deleteIntention(intention, 'Linked storage is offline');
        }
    }

    close() {
        this._storage._query.updateStorage(this, 'closed');
        if (this._lifeTimeout != null)
            clearTimeout(this._lifeTimeout);
        this.offline();
        this.socket = null;
        this.channel = null;
    }

    dispose() {
        this._disposed = true;
    }

    sendError(error) {
        const eobj = (error instanceof Error) ? { message: error.message } : error;
        return this.sendObject({
            command: 'error',
            version: 1,
            error: eobj
        });
    }


    startPinging() {
        if (this._pingTimeout != null) clearTimeout(this._pingTimeout);
        this._pingTimeout = setTimeout(() => {
            try {
                this.sendObject({
                    command: 'ping',
                    version: '1'
                });
                this.startPinging(this);
            } catch (e) {
                this.close();
            }
        }, this.lifeTime);
    }
};
