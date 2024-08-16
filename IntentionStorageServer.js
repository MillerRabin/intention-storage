import WebSocket from "./WebSocket.js";
import LinkedStorageAbstract from "./LinkedStorageAbstract.js";
const https = await getHTTPS();


async function getHTTPS() {
    try {
        return window.onlyinnodejs;
    } catch (e) {
        return (await import('https')).default;
    }
}

export default class IntentionStorageServer extends LinkedStorageAbstract {
  #type = 'IntentionStorageServer';
  #schema;
  #listenSocket;
  #address;

  constructor({ storage, address, port = 10010, sslCert }) {
    super({ storage, port, handling: 'manual' });
    if (address == null) throw new Error('address is not defined');
    if (sslCert == null)
      this.#createSimpleServer(port);
    else
      this.#createSecureServer(port, sslCert);

    this.#listenSocket.on('connection', (ws, req) => {
      const link = this.storage.addStorage({ socket: ws, request: req, origin: req.client.remoteAddress, port: req.client.remotePort, handling: 'auto' });
      this.storage.broadcastIntentionsToLink(link);
      ws.on('close', () => {
        this.storage.deleteStorage(link);
      });
      link.startPinging();
      link.setAlive();
    });
    this.#address = address;
  }

  #createSimpleServer(port) {
    this.#schema = 'ws';
    this.#listenSocket = new WebSocket.WebSocketServer({ port });
  }

  #createSecureServer(port, cert) {
    function createHttpsServer(cert, port) {
      const server = https.createServer(cert);
      server.listen(port);
      return server;
    }

    const server = createHttpsServer(cert, port);
    this.#schema = 'wss';
    this.#listenSocket = new WebSocket.WebSocketServer({ server });
  }

  close() {
    this.#listenSocket.close();
  }

  get key() {
    return `${this.#schema}://${this.#address}:${this.port}`;
  }

  get type() {
    return this.#type;
  }

  toObject() {
    return {
      type: this.#type,
      address: this.key,
      port: this.port
    }
  }
};
