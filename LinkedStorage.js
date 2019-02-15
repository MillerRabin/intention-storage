const WebSocket = require('./WebSocket.js');


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

    socket.onmessage = function (event) {
        console.log(event.data);
    };

    return socket;
}

module.exports = class LinkedStorage {
    constructor({ storage, origin, port = 10010, schema }) {
        this._storage = storage;
        this._origin = origin;
        this._port =  port;
        this._schema = schema;
        createSocket(this).then((socket) => {
           this._socket = socket;
        }).catch(() => {
            this._socket = null;
        });
    }
    get origin() {
        return this._origin;
    }
    get key() {
        return `${this._origin}:${this._port}`;
    }
    get state() {
        if (this._socket == null) return -1;
        return this._socket.readyState;
    }
    offline() {
        if (this._socket != null)
            this._socket.close();
    }
    toObject() {
        return {
            origin: this._origin,
            port: this._port,
            key: `${this._origin}:${this._port}`
        }
    }
};