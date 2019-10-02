const WebSocket = require('ws');
const translations = require('./translations.js');
const Network = require('../Network.js');
const WebRtc = require('./webRtc.js');

const gTranslationTable = {
    getAnswer
};


function connectSocket(signal, label) {
    const socket = new WebSocket(signal.signalServer);
    socket.onopen = function () {
        signal.sendData(socket, {
            command: 'setDescription',
            label: label
        });
    };
    socket.onmessage = function (event) {
        try {
            const data = JSON.parse(event.data);
            translations.get(this, data);
        } catch (e) {
            console.log(e);
        }
    };
    return socket;
}

function create(signal, label) {
    function restart() {
        setTimeout(function () {
            create(signal, label);
        }, 5000);
    }
    return new Promise((resolve) => {
        try {
            signal.socket = connectSocket(signal, label);
            signal.socket.onclose = function () {
                restart();
            };
            return resolve(signal);
        } catch (e) {
            restart();
        }
    });
}

async function getAnswer(socket, data) {
    if (data.offer == null) throw new Error('offer expected');
    const peer = new WebRtc();
    await peer.setOffer(data.offer);
    Signal.sendData(socket, { command: 'setAnswer', answer: peer.localDescription.sdp });
}

exports.get = (socket, data) => {
    if (data.command == null) throw new Error('command field expected');
    const command = gTranslationTable[data.command];
    if (command == null) throw new Error(`command ${data.command} is not found`);
    try {
        command(socket, data);
    } catch (e) {
        console.log(e);
    }
};

module.exports = class Signal {
    constructor () {
        this._signalServer = 'wss://signal.intention.tech:8086';
    }

    async connect(address) {
        if (address == null) throw new Error('Address must be defined');
        await create(this, address);
    };

    static async sendOffer(address, sdp) {
        return await Network.json('https://signal.intention.tech:8086/api/offers', {
            method: 'POST',
            data: {
                offer: sdp,
                label: address
            }
        });
    };

    static sendData(socket, data) {
        const str = JSON.stringify(data);
        socket.send(str);
    }

    get signalServer() {
        return this._signalServer;
    }

};




