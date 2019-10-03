const WebSocket = require('ws');
const Network = require('./Network.js');
const wrtc = getWRTC();

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


const WebRtc = require('./WebRtc.js');

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

function connectSignalSocket(webRTC, label) {
    const socket = new WebSocket(webRTC.signalServer);
    socket.onopen = function () {
        webRTC.sendSignal(socket, {
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
            webRTC.socket = connectSignalSocket(webRTC, label);
            webRTC.socket.onclose = function () {
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
    const peer = new WebRtc();
    await peer.setOffer(data.offer);
    sendData(socket, { command: 'setAnswer', answer: peer.localDescription.sdp });
}

async function sendOffer(address, sdp) {
    return await Network.json('https://signal.intention.tech:8086/api/offers', {
        method: 'POST',
        data: {
            offer: sdp,
            label: address
        }
    });
}


module.exports = class WebRTC {
    constructor () {
        this._peer = new wrtc.RTCPeerConnection(gConfig);
        this._dc = null;
        this._signalServer = 'wss://signal.intention.tech:8086';
    }

    get peer() {
        return this._peer;
    }

    get dataChannel() {
        return this._dc;
    }

    async connectToSignal(address) {
        if (address == null) throw new Error('Address must be defined');
        await createSignalSocket(this, address);
    };

    waitForDataChannel({channelName, channel, timeout = 5000}) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(function () {
                reject({ message: 'Time is out'});
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

    async setOffer(offer) {
        this.peer.onicecandidate = function ({candidate}) {
            console.log(candidate);
        };

        this.peer.oniceconnectionstatechange = function () {
            console.log(this.iceConnectionState);
        };

        this.peer.ondatachannel = function ({ channel }) {
            channel.onmessage = function (event) {
                console.log(event.data);
            }
        };

        await this.peer.setRemoteDescription({type: "offer", sdp: offer});
        await this.peer.setLocalDescription(await this.peer.createAnswer());
        await this.waitForCandidates(this.peer);
    };

    waitForCandidates(timeout = 5000) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(function () {
                reject({ message: 'time is out'});
            }, timeout);
            this.peer.onicecandidate = async ({candidate}) => {
                if (!candidate) {
                    clearTimeout(timer);
                    return resolve(null);
                }
            };
        });
    }

    async setAnswer(label, channelName) {
        this._dc = this.peer.createDataChannel(channelName);
        await this.peer.setLocalDescription(await this.peer.createOffer());
        await this.waitForCandidates(this.peer);
        const data = await sendOffer(label, this.peer.localDescription.sdp);
        await this.peer.setRemoteDescription({type: "answer", sdp: data.answer});
    };

    get signalServer() {
        return this._signalServer;
    }
};

