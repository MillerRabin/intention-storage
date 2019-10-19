const NetworkIntention = require('./NetworkIntention.js');
const Stream = require('./Stream.js');

async function translate(storageLink, textIntention) {
    if (textIntention.id == null) throw new Error('Intention id must exists');
    const target =  storageLink._storage.intentions.byId(textIntention.id);
    if (target != null) return target;
    textIntention.storageLink = storageLink;
    const intention = new NetworkIntention(textIntention);
    await storageLink._storage.addNetworkIntention(intention);
    return intention;
}

const gCommandTable = {
    '1:translate':  async function (storageLink, message) {
        if (message.intention == null) throw new Error('intention object expected');
        const textIntention = message.intention;
        if ((textIntention.type != 'Intention') && (textIntention.type != 'NetworkIntention'))
            throw new Error('type of object must be Intention or NetworkIntention');
        try {
            return await translate(storageLink, textIntention);
        } catch (e) {
            return null;
        }
    },
    '1:message':  async function (storageLink, message) {
        if (message.status == null) throw new Error('message status is expected');
        const id = message.id;
        if (id == null) throw new Error('Intention id must exists');
        const intention = storageLink._storage.intentions.byId(id);
        if (intention == null) throw { message: `The Intention is not found at the origin`, operation: 'delete', id: id };
        if (message.intention == null) throw new Error('Intention expected');
        const target = await translate(storageLink, message.intention);
        if (target == null) throw new Error('Intention is not found');
        if (intention.type == 'Intention') {
            intention.send(message.status, target, message.data);
        }
    },
    '1:error': async function (storageLink, message) {
        const error = message.error;
        if (error == null) {
            console.log(message);
            throw new Error('message error is expected');
        }
        const id = error.id;
        const operation = error.operation;
        if ((id == null) || (operation == null)) {
            console.log(message);
            return;
        }

        if (operation == 'delete') {
            const intention = storageLink._storage.intentions.byId(id);
            if (intention == null) return;
            storageLink._storage.deleteIntention(intention);
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
    }
};


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
            throw new Error('command is not supported');
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
            let obj = null;
            try {
                const dec = new TextDecoder();
                const message = dec.decode(data);
                obj = JSON.parse(message);
                this.dispatchMessage(obj).catch((e) => {
                    if (obj.command != 'error')
                        this.sendError(e)
                });
            } catch (e) {
                if ((obj != null) && (obj.command != 'error'))
                    this.sendError(e);
            }
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
            let data = null;
            try {
                const dec = new TextDecoder();
                const text = dec.decode(message);
                data = JSON.parse(text);
                this.dispatchMessage(data).catch((e) => {
                    if (data.command != 'error')
                        this.sendError(e)
                });
            } catch (e) {
                if ((data != null) && (data.command != 'error'))
                    this.sendError(e);
            }
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
            const err = new Error('Connection lost');
            err.dispose = true;
            throw err;
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
