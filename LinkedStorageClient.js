const WebSocket = require('./WebSocket.js');
const LinkedStorageAbstract = require('./LinkedStorageAbstract.js');

function connect({ schema, storageLink }) {
    return new Promise((resolve, reject) => {
        const socket =  new WebSocket(`${schema}://${storageLink._origin}:${storageLink._port}`);
        socket.onerror = function (error) {
            storageLink._storage._query.updateStorage(storageLink, 'error');
            return reject(error);
        };

        socket.onopen = function () {
            if (storageLink.disposed) {
                storageLink._storage._query.updateStorage(storageLink, 'error');
                socket.close();
                return reject(new Error('StorageLink is disposed'));
            }
            storageLink._storage._query.updateStorage(storageLink, 'connected');
            return resolve(socket);
        };

        socket.onclose = function() {
            storageLink._socket = null;
            storageLink.offline();
            storageLink._storage._query.updateStorage(storageLink, 'closed');
            if (storageLink.handling == 'manual') {
                storageLink.waitForServer();
            }
        };
    });
}

async function select(storageLink) {
    let socket;
    let schema = 'wss';
    try {
        socket = await connect({schema, storageLink });
        storageLink._schema = schema;
        return socket
    } catch (e) {}
    schema = 'ws';
    socket = await connect({ schema, storageLink });
    storageLink._schema = schema;
    return socket;
}

async function connectSocket(storageLink) {
    let socket = null;
    if (storageLink._schema == null)
        socket = await select(storageLink);
    else
        socket = await connect({ schema: storageLink._schema, storageLink });
    return socket;
}

module.exports = class LinkedStorageClient extends LinkedStorageAbstract {
    constructor({ storage, origin, port = 10010, schema = 'ws', socket, request, handling }) {
        if (request != null) {
            origin = request.connection.remoteAddress;
            port = request.connection.remotePort;
        }

        super({ storage, port, handling, socket });
        this._origin = origin;
        this._schema = schema;
        this._type = 'LinkedStorageClient';
        this.waitForServerInterval = 15000;
        this._waitForServerTimeout = null
    }

    async connect() {
        this.socket = await connectSocket(this);
    }

    get origin() {
        return this._origin;
    }

    get key() {
        return `${this._schema}://${this._origin}:${this._port}`;
    }

    get status() {
        if (this._socket == null) return -1;
        return this._socket.readyState;
    }

    async translate(intention) {
        await this.sendObject({
            command: 'translate',
            version: 1,
            intention: intention.toObject()
        })
    }

    waitForServer() {
        const wait = async () => {
            if (this.disposed) return;
            if (this.socket != null) return;
            try {
                this.socket = await connectSocket(this);
            } catch (e) {
                this._waitForServerTimeout = setTimeout(wait, this.waitForServerInterval);
            }
        };
        if (this.disposed) return;
        if (this.socket != null) return;
        clearTimeout(this._waitForServerTimeout);
        this._waitForServerTimeout = setTimeout(wait, this.waitForServerInterval);
    }

    toObject() {
        return {
            origin: this._origin,
            port: this._port,
            key: `${this._origin}:${this._port}`,
            schema: this._schema,
            type: this._type,
            status: this.status
        }
    }
};