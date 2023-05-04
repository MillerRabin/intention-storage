import WebSocket from "./WebSocket.js";
import LinkedStorageAbstract from "./LinkedStorageAbstract.js";
import WebRTC from "./WebRtc.js";
import uuid from "./core/uuid.js";


function isChannelOpen(channel) {
  return (channel != null) && (channel.readyState == 'open')
}

export default class LinkedStorageClient extends LinkedStorageAbstract {
  #origin;
  #schema;
  #type = 'LinkedStorageClient';
  #waitForServerInterval = 3000;
  #waitForServerTimeout = null;
  #waitConnectionInterval = null;
  #waitConnectionTimeout = 20000;
  #useSocket = true;
  #useWebRTC = true;
  #webRTCPeer;
  #waitP;
  #id = uuid.generate();
  #allowNotEncrypted = true;
  
  constructor({ storage, origin, port = 10010, schema,
                socket, channel, request, handling, 
                useSocket = true, useWebRTC = true, 
                allowNotEncrypted = true,
                waitForServerInterval = 3000,
                socketSendMode = 'json' }) {
    if (request != null) {
      origin = request.connection.remoteAddress;
      port = request.connection.remotePort;
    }

    super({ storage, port, handling, socket, channel, socketSendMode });
    this.#origin = origin;
    this.#schema = schema;
    this.#type = 'LinkedStorageClient';
    this.#waitForServerInterval = waitForServerInterval ?? this.#waitForServerInterval;
    this.#waitForServerTimeout = null;
    this.#useSocket = useSocket;
    this.#useWebRTC = useWebRTC;
    this.#allowNotEncrypted = allowNotEncrypted;
    if (this.#useWebRTC) {
      this.#webRTCPeer = new WebRTC({ storage });
    }
  }

  #connectSchemaSocket(schema) {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket.WebSocket(`${schema}://${this.#origin}:${this.port}`);
      this.#addListeners(socket, resolve, reject);
    });
  }

  #connectChannel() {
    return new Promise(async (resolve, reject) => {
      if (this.peer == null) return reject('Peer is not created');
      try {
        if ((this.channel == null) || (this.channel.readyState != 'connecting')) {
          this.channel = await this.peer.createChannel('intentions');
        }
        await this.peer.sendOffer(this.origin);
        this.channel.maxMessageSize = this.peer.maxMessageSize;
        this.#addListeners(this.channel, resolve, reject);
      } catch (e) {
        reject(e);
      }
    });
  }

  #addListeners(socket, resolve, reject) {
    console.log('connecting');
    if (this.#waitConnectionInterval != null)
      clearTimeout(this.#waitConnectionInterval);

    this.#waitConnectionInterval = setTimeout(() => {
      this.storage.query.updateStorage(this, 'error');
      socket.close();
      return reject(new Error('Connection timeout'));
    }, this.#waitConnectionTimeout);

    socket.onerror = (error) => {
      console.log('connection error', error);
      clearTimeout(this.#waitConnectionInterval);
      this.storage.query.updateStorage(this, 'error');
      return reject(error);
    };

    socket.onopen = () => {
      clearTimeout(this.#waitConnectionInterval);
      console.log('connected');
      if (this.disposed) {
        this.storage.query.updateStorage(this, 'error');
        socket.close();
        return reject(new Error('StorageLink is disposed'));
      }

      this.storage.query.updateStorage(this, 'connected');
      this.startPinging();
      this.setAlive();
      return resolve(socket);
    };
  }


  async #selectSchemaSocket() {
    let socket;
    let schema = 'wss';
    try {
      socket = await this.#connectSchemaSocket(schema);
      this.#schema = schema;
      return socket
    } catch (e) { }
    if (!this.#allowNotEncrypted) throw new Error('wss schema connection failed ws connection is disabled');
    schema = 'ws';
    socket = await this.#connectSchemaSocket(schema);
    this.#schema = schema;
    return socket;
  }


  async #tryConnect() {
    try {
      this.socket = await this.#tryConnectSocket();
    } catch (e) {
      await this.#tryConnectChannel();
    }
    const channel = this.getChannel();
    channel.onclose = () => {
      this.close();
    };
  }

  async #tryConnectSocket() {
    if (this.useSocket == false) throw Error('Socket is disabled');
    return await this.#connectSocket();
  }

  async #tryConnectChannel() {
    if (this.useWebRTC == false) throw Error('WebRTC data channel is disabled');
    return await this.#connectChannel();
  }

  async #connectSocket() {
    let socket;
    if (this.#schema == null)
      socket = await this.#selectSchemaSocket();
    else
      socket = await this.#connectSchemaSocket(this.#schema);
    return socket;
  }

  async connect() {
    await this.#tryConnect();
  }

  get origin() {
    return this.#origin;
  }

  get key() {
    if (this.#schema == null)
      return `${this.#origin}:${this.port}`;
    return `${this.#schema}://${this.#origin}:${this.port}`;
  }

  static getKeys(origin, port = 10010) {
    return [
      `${origin}:${port}`
    ];
  }

  get status() {
    if ((this.socket == null) && !isChannelOpen(this.channel)) return -1;
    if (this.socket != null)
      return this.socket.readyState;
    if (isChannelOpen(this.channel))
      return this.channel.readyState;
    return -1;
  }

  get peer() {
    return this.#webRTCPeer;
  }

  get id() {
    return this.#id;
  }

  async broadcast(intention) {
    await this.sendObject({
      command: 'broadcast',
      version: 1,
      intention: intention.toObject()
    })
  }

  waitConnection(timeout) {
    if (this.#waitP != null) return this.#waitP;
    this.#waitP = new Promise((resolve, reject) => {
      const resolvePromise = () => {
        resolve(this);
        clearTimeout(rejectTimeout);
        this.#waitP = null;
      };

      let rejectTimeout = null;
      if (timeout != null)
        rejectTimeout = setTimeout(() => {
          clearTimeout(this.#waitForServerTimeout);
          this.#waitP = null;
          return reject(new Error('The connection time is out'));
        }, timeout);

      const wait = async () => {
        if ((this.disposed) || (this.socket != null)) {
          resolvePromise();
          return;
        }
        if ((this.channel != null) && (this.channel.readyState != 'connecting')) {
          this.startPinging();
          resolvePromise();
          return;
        }
        try {
          await this.connect();
          resolvePromise();
        } catch (e) {
          this.#waitForServerTimeout = setTimeout(wait, this.#waitForServerInterval);
        }
      };
      if ((this.disposed) || (this.socket != null)) {
        resolvePromise();
        return;
      }
      clearTimeout(this.#waitForServerTimeout);
      wait();
    });
    return this.#waitP;
  }

  async waitForChannel(timeout) {
    await this.#webRTCPeer.waitForDataChannel({ channel: this.channel, timeout });
  }

  get useSocket() {
    return this.#useSocket;
  }

  get useWebRTC() {
    return this.#useWebRTC;
  }

  close() {
    super.close();
    if (this.handling != 'manual')
      this.dispose();
    else
      this.waitConnection();
  }

  toObject() {
    return {
      origin: this.#origin,
      port: this.port,
      key: `${this.#origin}:${this.port}`,
      schema: this.#schema,
      type: this.#type,
      status: this.status
    }
  }
};
