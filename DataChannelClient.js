let WebSocket;
if ((window == null) || (window.WebSocket == null)) {
    WebSocket = require('ws');
} else {
    WebSocket = window.WebSocket;
}

function createSocket(channel, url) {
    const socket = new WebSocket(url);
    socket.onopen = function (event) {
        console.log('opened');
    };

    socket.onmessage = function (event) {
        console.log(event.data);
    };
    return socket;
}

function getSocket(channel, url) {
    if (channel._sessions[url] != null)
        return channel._sessions[url];
    channel._sessions[url] = createSocket(channel, url);
    return channel._sessions[url];
}


module.exports = class DataChannelClient {
    constructor() {
        this._sessions = {};
    }

    send(url, data) {
        const socket = getSocket(url);
        socket.send(data);
    }
};