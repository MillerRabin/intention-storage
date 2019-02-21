const WebSocket = require('./WebSocket.js');
const LinkedStorageAbstract = require('./LinkedStorageAbstract.js');

function connect(schema, origin, port) {
    return new Promise((resolve, reject) => {
        const socket =  new WebSocket(`${schema}${origin}:${port}`);
        socket.onerror = function (error) {
            return reject(error);
        };

        socket.onopen = function () {
            return resolve(socket);
        }
    });
}

async function select(storageLink) {
    let socket;
    let schema = 'wss://';
    try {
        socket = await connect(schema, storageLink._origin, storageLink._port);
        storageLink._schema = schema;
        return socket
    } catch (e) {}
    schema = 'ws://';
    socket = await connect(schema, storageLink._origin, storageLink._port);
    storageLink._schema = schema;
    return socket;
}

async function createSocket(storageLink) {
    let socket = null;
    if (storageLink._schema == null)
        socket = await select(storageLink);
    else
        socket = await connect(storageLink._schema, storageLink._origin, storageLink._port);
    return socket;
}

module.exports = class LinkedStorageClient extends LinkedStorageAbstract {
    constructor({ storage, origin, port = 10010, schema }) {
        super({ storage, port });
        this._origin = origin;
        this._schema = schema;
        this._createSocketPromise = createSocket(this).then((socket) => {
           this.socket = socket;
        }).catch(() => {
            this.socket = null;
        });
    }
    get origin() {
        return this._origin;
    }
    get key() {
        return `${this._origin}:${this._port}`;
    }
    async translate(intention) {
        return this.sendObject({
            command: 'translate',
            version: 1,
            intention: intention.toObject()
        })
    }
    toObject() {
        return {
            origin: this._origin,
            port: this._port,
            key: `${this._origin}:${this._port}`
        }
    }
};