const WebSocket = require('./WebSocket.js');
const LinkedStorageAbstract = require('./LinkedStorageAbstract.js');

module.exports = class IntentionStorageServer extends LinkedStorageAbstract {
    constructor({ storage, address, port = 10010 }) {
        super({ storage, port, handling: 'manual' });
        if (address == null) throw new Error('address is not defined');
        this._listenSocket = new WebSocket.Server({ port: port });
        this._listenSocket.on('connection', (ws, req) => {
            this._storage.addStorage({ storage: this._storage, socket: ws, request: req, handling: 'auto' });
        });
        this._type = 'IntentionStorageServer';
        this._address = address;
        this._schema = 'ws';
    }

    close() {
        this._listenSocket.close();
    }

    get key() {
        return `${this._schema}://${this._address}:${this._port}`;
    }

    toObject() {
        return {
            type: this._type,
            address: this.key
        }
    }
};