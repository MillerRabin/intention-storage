const NetworkIntention = require('./NetworkIntention.js');

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
    '1:translate':  async function (storageLink, message){
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
    '1:message':  async function (storageLink, message){
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
    }
};

module.exports = class LinkedStorageAbstract {
    constructor({ storage, port = 10010, handling, socket }) {
        if (storage == null) throw new Error('Storage must be exists');
        if (handling == null) throw new Error('Manage type must be defined');
        this._intentions = new Map();
        this._storage = storage;
        this._port = port;
        this._handling = handling;
        this.socket = socket;
        this._disposed = false;
    }

    async dispatchMessage(data) {
        const key = `${data.version}:${data.command}`;
        const func = gCommandTable[key];
        if (func == null) {
            throw new Error('command is not supported');
        }
        return await func(this, data);
    }

    async sendObject(obj) {
        if ((this._socket == null) || (this._socket.readyState != 1)) {
            const err = new Error('Connection lost');
            err.dispose = true;
            throw err;
        }
        return this._socket.send(JSON.stringify(obj));
    }

    set socket(value) {
        if (this._socket != null)
            this._socket.close();

        this._socket = value;
        if (value == null) {
            return;
        }

        this._socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.dispatchMessage(data).catch((e) => {
                    const eobj = (e instanceof Error) ? { message: e.message } : e;
                    console.log(data);
                    console.log(e);
                    if (data.command != 'error')
                        this.sendError(eobj)
                });
            } catch (e) {
                const eobj = (e instanceof Error) ? { message: e.message } : e;
                if (data.command != 'error')
                    this.sendError(eobj)
            }
        };
    }

    addIntention(intention) {
        return this._intentions.set(intention.id, intention);
    }

    deleteIntention(intention) {
        return this._intentions.delete(intention.id);
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

    offline() {
        for(let [,intention] of this._intentions) {
            this._storage.deleteIntention(intention, 'Linked storage is offline');
        }
    }

    dispose() {
        this._disposed = true;
        this.offline();
        this.socket = null;
    }

    async sendError(error) {
        return await this.sendObject({
            command: 'error',
            version: 1,
            error: error.message
        });
    }
};