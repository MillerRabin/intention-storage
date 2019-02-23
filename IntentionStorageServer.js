const WebSocket = require('./WebSocket.js');
const LinkedStorageAbstract = require('./LinkedStorageAbstract.js');
const LinkedStorageClient = require('./LinkedStorageAbstract.js');

module.exports = class IntentionStorageServer extends LinkedStorageAbstract {
    constructor({ storage, port = 10010 }) {
        super({ storage, port, type: 'server' });
        this._listenSocket = new WebSocket.Server({ port: port });
        this._listenSocket.on('connection', (ws, req) => {
            this._storage.addStorage({ storage: this._storage, socket: ws, request: req, type: 'auto' });
        });
    }

    close() {
        this._listenSocket.close();
    }
};