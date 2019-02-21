const NetworkIntention = require('./NetworkIntention.js');

const gCommandTable = {
    '1:translate':  async function (storageLink, message){
        if (message.intention == null) throw new Error('intention object expected');
        const textIntention = message.intention;
        if (textIntention.type != 'intention') throw new Error('type of object must be intention');
        textIntention.storageLink = storageLink;
        const intention = new NetworkIntention(textIntention);
        return await storageLink._storage.addNetworkIntention(intention);
    }
};


module.exports = class LinkedStorageAbstract {
    constructor({storage, port = 10010 }) {
        this._storage = storage;
        this._port = port;
    }

    async dispatchMessage(data) {
        const key = `${data.version}:${data.command}`;
        const func = gCommandTable[key];
        if (func == null) throw new Error('command is not supported');
        return await func(this, data);
    }

    async sendObject(obj) {
        await this._createSocketPromise;
        if (this._socket == null) return false;
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
                    this.sendError(e)
                });
            } catch (e) {
                this.sendError(e);
            }
        };
    }
    get socket() {
        return this._socket;
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