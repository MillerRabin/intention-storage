//${time}
const WebSocket = require('./WebSocket.js');
const LinkedStorageAbstract = require('./LinkedStorageAbstract.js');
const WebRTC = require('./WebRtc.js');

function addListeners(storageLink, socket, resolve, reject) {
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
        storageLink.startPinging();
        storageLink.setAlive();
        return resolve(socket);
    };
}

function connectSchemaSocket({ schema, storageLink }) {
    return new Promise((resolve, reject) => {
        const socket =  new WebSocket(`${schema}://${storageLink._origin}:${storageLink._port}`);
        addListeners(storageLink, socket, resolve, reject);
    });
}

function connectChannel(storageLink) {
    return new Promise(async (resolve, reject) => {
        if (storageLink.peer == null) return reject('Peer is not created');
        try {
            if ((storageLink.channel == null) || (storageLink.channel.readyState != 'connecting')) {
                storageLink.channel = await storageLink.peer.createChannel('intentions');
            }
            await storageLink.peer.sendOffer(storageLink.origin);
            storageLink.channel.maxMessageSize = storageLink.peer.maxMessageSize;
            addListeners(storageLink, storageLink.channel, resolve, reject);
        } catch (e) {
            reject(e);
        }
    });
}

async function selectSchemaSocket(storageLink) {
    let socket;
    let schema = 'wss';
    try {
        socket = await connectSchemaSocket({schema, storageLink });
        storageLink._schema = schema;
        return socket
    } catch (e) {}
    schema = 'ws';
    socket = await connectSchemaSocket({ schema, storageLink });
    storageLink._schema = schema;
    return socket;
}

async function connectSocket(storageLink) {
    let socket = null;
    if (storageLink._schema == null)
        socket = await selectSchemaSocket(storageLink);
    else
        socket = await connectSchemaSocket({ schema: storageLink._schema, storageLink });
    return socket;
}

async function tryConnectSocket(storageLink) {
    if (storageLink.useSocket == false) throw Error('Socket is disabled');
    return await connectSocket(storageLink);
}

async function tryConnectChannel(storageLink) {
    if (storageLink.useWebRTC == false) throw Error('WebRTC data channel is disabled');
    return await connectChannel(storageLink);
}

async function tryConnect(storageLink) {
    try {
        storageLink.socket = await tryConnectSocket(storageLink);
    } catch (e) {
        await tryConnectChannel(storageLink);
    }
    const channel = storageLink.getChannel();
    channel.onclose = function() {
        storageLink.close();
    };
}

function isChannelOpen(channel) {
    return (channel != null) && (channel.readyState == 'open')
}

module.exports = class LinkedStorageClient extends LinkedStorageAbstract {
    constructor({ storage, origin, port = 10010, schema, socket, channel, request, handling, useSocket = true, useWebRTC = true }) {
        if (request != null) {
            origin = request.connection.remoteAddress;
            port = request.connection.remotePort;
        }

        super({ storage, port, handling, socket, channel });
        this._origin = origin;
        this._schema = schema;
        this._type = 'LinkedStorageClient';
        this.waitForServerInterval = 15000;
        this._waitForServerTimeout = null;
        this._useSocket = useSocket;
        this._useWebRTC = useWebRTC;
        if (this._useWebRTC) {
            this._webRTCPeer = new WebRTC({ storage });
        }
    }

    async connect() {
        await tryConnect(this);
    }

    get origin() {
        return this._origin;
    }

    get port() {
        return this._port;
    }

    get storage() {
        return this._storage;
    }

    get key() {
        if (this._schema == null)
            return `${this._origin}:${this._port}`;
        return `${this._schema}://${this._origin}:${this._port}`;
    }

    static getKeys(origin, port = 10010) {
        return [
            `${origin}:${port}`
        ];
    }

    get status() {
        if ((this._socket == null) && !isChannelOpen(this._channel)) return -1;
        if (this._socket != null)
            return this._socket.readyState;
        if (isChannelOpen(this._channel))
            return this._channel.readyState;
        return -1;
    }

    get peer() {
        return this._webRTCPeer;
    }

    async translate(intention) {
        await this.sendObject({
            command: 'translate',
            version: 1,
            intention: intention.toObject()
        })
    }

    waitConnection() {
        const wait = async () => {
            if (this.disposed) return;
            if (this.socket != null) return;
            if ((this.channel != null) && (this.channel.readyState != 'connecting') && (this.channel.readyState != 'open')) return;
            try {
                await this.connect();
            } catch (e) {
                this._waitForServerTimeout = setTimeout(wait, this.waitForServerInterval);
            }
        };
        if (this.disposed) return;
        if (this.socket != null) return;
        clearTimeout(this._waitForServerTimeout);
        wait();
    }

    async waitForChannel(timeout) {
        await this._webRTCPeer.waitForDataChannel({channel: this._channel, timeout});
    }

    get useSocket() {
        return this._useSocket;
    }

    get useWebRTC() {
        return this._useWebRTC;
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
            origin: this._origin,
            port: this._port,
            key: `${this._origin}:${this._port}`,
            schema: this._schema,
            type: this._type,
            status: this.status
        }
    }
};
