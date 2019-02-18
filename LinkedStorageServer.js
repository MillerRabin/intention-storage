const WebSocket = require('./WebSocket.js');
const LinkedStorageAbstract = require('./LinkedStorageAbstract.js');

module.exports = class LinkedStorageServer extends LinkedStorageAbstract {
    constructor({ storage, port = 10010 }) {
        super({ storage, port });
        const wss = new WebSocket.Server({ port: port });
        wss.on('connection', function (ws) {
            this.socket = ws;
        });
    }
};