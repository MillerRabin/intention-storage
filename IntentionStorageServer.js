const WebSocket = require('./WebSocket.js');
const LinkedStorageAbstract = require('./LinkedStorageAbstract.js');
const fs = require('fs');
const path = require('path');
const https = require('https');

function createSimpleServer(storage, port) {
    storage._schema = 'ws';
    storage._listenSocket = new WebSocket.Server({ port });
}

function createSecureServer(storage, port, cert) {
    function createHttpsServer(cert, port) {
        const server = https.createServer(cert);
        server.listen(port);
        return server;
    }

    const server = createHttpsServer(cert, port);
    storage._schema = 'wss';
    storage._listenSocket = new WebSocket.Server({ server });
}

module.exports = class IntentionStorageServer extends LinkedStorageAbstract {
    constructor({ storage, address, port = 10010, options = {}}) {
        super({ storage, port, handling: 'manual' });
        if (address == null) throw new Error('address is not defined');
        if (options.cert == null)
            createSimpleServer(this, port);
        else
            createSecureServer(this, port, options.cert);

        this._listenSocket.on('connection', (ws, req) => {
            const link = this._storage.addStorage({ storage: this._storage, socket: ws, request: req, handling: 'auto' });
            this._storage.translateIntentionsToLink(link);
            ws.on('close', () => {
                this._storage.deleteStorage(link);
            });
        });
        this._type = 'IntentionStorageServer';
        this._address = address;
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
