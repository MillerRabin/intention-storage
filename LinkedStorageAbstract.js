const NetworkIntention = require('./NetworkIntention.js');

const gCommandTable = {
    '1:translate':  async function (storageLink, message){
        if (message.intention == null) throw new Error('intention object expected');
        const textIntention = message.intention;
        if ((textIntention.type != 'Intention') && (textIntention.type != 'NetworkIntention'))
            throw new Error('type of object must be NetworkIntention');
        textIntention.storageLink = storageLink;
        const intention = new NetworkIntention(textIntention);
        return await storageLink._storage.addNetworkIntention(intention);
    },
    '1:message':  async function (storageLink, message){
        if (message.status == null) throw new Error('message status is expected');
        const id = message.id;
        if (id == null) throw new Error('Intention id must exists');
        const intention = storageLink._storage.queryIntentions({ id: id });
        if (intention == null) throw new Error('Intention not found at origin');
        if (message.intention == null) throw new Error('Intention expected');
        if (intention.type == 'Intention') {
            intention.send(message.status, message.intention, message.data);
        }
    }
};


module.exports = class LinkedStorageAbstract {
    constructor({ storage, port = 10010, type, socket }) {
        if (storage == null) throw new Error('Storage must be exists');
        if (type == null) throw new Error('Type must be defined');
        this._storage = storage;
        this._port = port;
        this._type = type;
        this.socket = socket;
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
        try {
            if (this._socket == null) return false;
            return this._socket.send(JSON.stringify(obj));
        } catch (e) {
            console.log(e);
        }
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
                    console.log(data);
                    console.log(e);
                    if (data.command != 'error')
                        this.sendError(e)
                });
            } catch (e) {
                if (data.command != 'error')
                    this.sendError(e)
            }
        };
    }
    get socket() {
        return this._socket;
    }

    get type() {
        return this._type;
    }

    get port() {
        return this._port;
    }
    offline() {
        this._socket = null;
    }

    async sendError(error) {
        return await this.sendObject({
            command: 'error',
            version: 1,
            error: error.message
        });
    }
};