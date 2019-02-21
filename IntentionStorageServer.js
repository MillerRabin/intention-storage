const WebSocket = require('./WebSocket.js');
const LinkedStorageAbstract = require('./LinkedStorageAbstract.js');

module.exports = class IntentionStorageServer extends LinkedStorageAbstract {
    constructor({ storage, port = 10010 }) {
        super({ storage, port });
        this._listenSocket = new WebSocket.Server({ port: port });
        this._listenSocket.on('connection', (ws) => {
            this.socket = ws;
        });
    }

    close() {
        this._listenSocket.close();
    }
};