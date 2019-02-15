let WebSocket;
try {
    WebSocket = window.WebSocket;
} catch (e) {
    WebSocket = require('ws');
}

module.exports = WebSocket;