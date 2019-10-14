const WebSocket = require('ws');
const Network = require('./Network.js');
const wrtc = getWRTC();

const signalServerHttp = 'https://signal.intention.tech:8086';
const signalServerSocket = 'wss://signal.intention.tech:8086';

const gConfig = {
    iceServers: []
};

function getWRTC() {
    try {
        return {
            RTCPeerConnection: window.RTCPeerConnection
        }
    } catch (e) {
        return require('wrtc');
    }
}

const gTranslationTable = {
    getAnswer
};

function getTranslation(socket, data) {
    if (data.command == null) throw new Error('command field expected');
    const command = gTranslationTable[data.command];
    if (command == null) throw new Error(`command ${data.command} is not found`);
    try {
        command(socket, data);
    } catch (e) {
        console.log(e);
    }
}

function getSDPMaxMessage(sdp) {
    const match = sdp.match(/a=max-message-size:\s*(\d+)/);
    if (match == null || match.length < 1) return;
    return parseInt(match[1]);

}

function getMaxMessage(offer, answer) {
    const oSize = getSDPMaxMessage(offer);
    const aSize = getSDPMaxMessage(answer);
    let mSize = (oSize < aSize) ? oSize : aSize;
    if (mSize == null) mSize = 65535;
    return mSize;
}


function connectSignalSocket(webRTC, label) {
    const socket = new WebSocket(webRTC.signalServer);
    socket.webRTC = webRTC;
    socket.onopen = function () {
        sendData(socket, {
            command: 'setDescription',
            label: label
        });
    };
    socket.onmessage = function (event) {
        try {
            const data = JSON.parse(event.data);
            getTranslation(this, data);
        } catch (e) {
            console.log(e);
        }
    };
    return socket;
}

function createSignalSocket(webRTC, label) {
    function restart() {
        setTimeout(function () {
            createSignalSocket(webRTC, label);
        }, 5000);
    }
    return new Promise((resolve) => {
        try {
            webRTC.signalSocket = connectSignalSocket(webRTC, label);
            webRTC.signalSocket.onclose = function () {
                restart();
            };
            return resolve(webRTC);
        } catch (e) {
            restart();
        }
    });
}

function sendData(socket, data) {
    const str = JSON.stringify(data);
    socket.send(str);
}

async function getAnswer(socket, data) {
    if (data.offer == null) throw new Error('offer expected');
    const peer = new wrtc.RTCPeerConnection();
    peer.webRTC = socket.webRTC;
    await setOffer(socket, peer, data.offer);
    sendData(socket, { command: 'setAnswer', answer: peer.localDescription.sdp });
}

async function sendOffer(address, sdp) {
    return await Network.json(`${signalServerHttp}/api/offers`, {
        method: 'POST',
        data: {
            offer: sdp,
            label: address
        }
    });
}

function getAddressFromOffer(offer) {
    const reg = new RegExp('IN IP4 (.*)\r', 'im');
    const match = reg.exec(offer);
    if (match == null) return undefined;
    return match[1];
}

async function setOffer(socket, peer, offer) {
    let link = null;
    peer.oniceconnectionstatechange = function () {
        console.log(this.iceConnectionState);
        if ((link != null) && (this.iceConnectionState == 'disconnected') && (this.iceConnectionState == 'failed'))
            peer.webRTC.storage.deleteStorage(link);
    };

    peer.ondatachannel = function ({ channel }) {
        const webRTC = socket.webRTC;
        if (webRTC == null) throw new Error('webRTC is not defined');
        const storage = webRTC.storage;
        if (storage == null) throw new Error('webRTC storage is not defined');
        const address = getAddressFromOffer(offer);
        link = storage.addStorage({ channel: channel, handling: 'auto', origin: address });
        storage.translateIntentionsToLink(link);
        channel.maxMessageSize = peer.maxMessageSize;

        channel.onclose = function() {
            if (link == null)
                throw new Error('Link is not defined');
            storage.deleteStorage(link);
        }
    };

    await peer.setRemoteDescription({type: "offer", sdp: offer});
    await peer.setLocalDescription(await peer.createAnswer());
    peer.maxMessageSize = getMaxMessage(offer, peer.localDescription.sdp);
    await waitForCandidates(peer);
}

function waitForCandidates(peer, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(function () {
            reject({ message: 'Wait for candidate time is out'});
        }, timeout);
        peer.onicecandidate = async ({candidate}) => {
            if (!candidate) {
                clearTimeout(timer);
                return resolve(null);
            }
        };
    });
}

module.exports = class WebRTC {
    constructor ({ storage, key }) {
        this._peer = new wrtc.RTCPeerConnection(gConfig);

        this._signalServer = signalServerSocket;
        if (storage == null) throw new Error('Storage is not defined');
        this._storage = storage;
        this._key = key;
    }

    get peer() {
        return this._peer;
    }

    async connectToSignal(address) {
        if (address == null) throw new Error('Address must be defined');
        await createSignalSocket(this, address);
    };

    waitForDataChannel({channelName, channel, timeout = 5000}) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(function () {
                reject({ message: 'Data channel time is out'});
            }, timeout);

            if (channel == null)
                channel = this.peer.createDataChannel(channelName);

            channel.onopen = function () {
                clearTimeout(timer);
                return resolve(channel);
            };

            channel.onerror = function (e) {
                clearTimeout(timer);
                return reject(e);
            }
        });
    }


    async sendOffer(label, channelName) {
        const dc = this.peer.createDataChannel(channelName);
        await this.peer.setLocalDescription(await this.peer.createOffer());
        await waitForCandidates(this.peer);
        const data = await sendOffer(label, this.peer.localDescription.sdp);
        await this.peer.setRemoteDescription({type: "answer", sdp: data.answer});
        this.peer.maxMessageSize = getMaxMessage(this.peer.localDescription.sdp, this.peer.remoteDescription.sdp);
        dc.maxMessageSize = this.peer.maxMessageSize;
        dc.onclose = function () {
            console.log('channel closed');
        };
        return { channel: dc };
    };

    get signalServer() {
        return this._signalServer;
    }

    get storage() {
        return this._storage;
    }

    get key() {
        return this._key;
    }
};

