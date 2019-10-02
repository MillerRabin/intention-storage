const Signal = require("./signal.js");
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

module.exports = class WebRTC {
    constructor () {
        this._peer = new wrtc.RTCPeerConnection(gConfig);
        this._dc = null;
    }

    get peer() {
        return this._peer;
    }

    get dataChannel() {
        return this._dc;
    }

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

        this.peer.oniceconnectionstatechange = function (event) {
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
        const data = await Signal.sendOffer(label, this.peer.localDescription.sdp);
        await this.peer.setRemoteDescription({type: "answer", sdp: data.answer});
    };
};

