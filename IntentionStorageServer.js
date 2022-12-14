import WebSocket  from "./WebSocket.js";
import LinkedStorageAbstract  from "./LinkedStorageAbstract.js";


function createSimpleServer(storage, port) {
    storage._schema = 'ws';
    storage._listenSocket = new WebSocket.WebSocketServer({ port });
}

function createSecureServer(storage, port, cert) {
    function createHttpsServer(cert, port) {
        const server = https.createServer(cert);
        server.listen(port);
        return server;
    }

    const server = createHttpsServer(cert, port);
    storage._schema = 'wss';
    storage._listenSocket = new WebSocket.WebSocketServer({ server });
}

export default class IntentionStorageServer extends LinkedStorageAbstract {
    constructor({ storage, address, port = 10010, sslCert}) {
        super({ storage, port, handling: 'manual' });
        if (address == null) throw new Error('address is not defined');
        if (sslCert == null)
            createSimpleServer(this, port);
        else
            createSecureServer(this, port, sslCert);

        this._listenSocket.on('connection', (ws, req) => {
            const link = this._storage.addStorage({ storage: this._storage, socket: ws, request: req, handling: 'auto' });
            this._storage.broadcastIntentionsToLink(link);
            ws.on('close', () => {
                this._storage.deleteStorage(link);
            });
            link.startPinging();
            link.setAlive();
        });
        this._type = 'IntentionStorageServer';
        this._address = address;
        this._port = port;
    }

    close() {
        this._listenSocket.close();
    }

    get key() {
        return `${this._schema}://${this._address}:${this._port}`;
    }

    get port() {
        return this._port;
    }

    toObject() {
        return {
            type: this._type,
            address: this.key,
            port: this._port
        }
    }
};
