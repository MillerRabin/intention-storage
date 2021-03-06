const safe = require('./core/safe.js');
const uuid = require('./core/uuid.js');
const IntentionAbstract = require('./IntentionAbstract.js');

const gRequestTransactions = {};

function processError(networkIntention, error) {
    const id = error.id;
    const operation = error.operation;
    if ((id == null) || (operation == null)) return;
    if (operation == 'delete')
        networkIntention.storageLink._storage.deleteIntention(networkIntention);
}

module.exports = class NetworkIntention extends IntentionAbstract {
    constructor ({
                     id,
                     createTime,
                     title,
                     description,
                     origin,
                     input,
                     output,
                     parameters = [],
                     value,
                     storageLink,
                     accepted
                 }) {
        super({ title, description, input, output, parameters, value, accepted });
        if (safe.isEmpty(id)) throw new Error('Network Intention must have an id');
        if (safe.isEmpty(createTime)) throw new Error('Network Intention must have createTime');
        if (storageLink == null) throw new Error('Storage link must be exists');
        this._createTime = createTime;
        this._origin = origin;
        this._id = id;
        this._storageLink = storageLink;
        this._storageLink.addIntention(this);
        this.messageTimeout = 5000;
        this._type = 'NetworkIntention';
    }

    static createRequestObject(networkIntention, intention, data) {
        const requestId = uuid.generate();
        const request = { intention, id: requestId };
        request.promise = new Promise((resolve, reject) => {
            request.resolve = resolve;
            request.reject = reject;
            request.timeout = setTimeout(() => {
                reject({ message: `Request ${requestId} time is out`, data});
                NetworkIntention.deleteRequestObject(requestId);
            }, networkIntention.messageTimeout);
        }).then((result) => {
            NetworkIntention.deleteRequestObject(requestId);
            return result;
        }).catch((error) =>{
            NetworkIntention.deleteRequestObject(requestId);
            processError(networkIntention, error);
            throw error;
        });
        gRequestTransactions[requestId] = request;
        return request;
    }

    static deleteRequestObject(requestId, error) {
        if (gRequestTransactions[requestId] == null) return;
        clearTimeout(gRequestTransactions[requestId].timeout);
        error = (error == null) ? new Error(`Request ${requestId} is deleted`) : error;
        const req = gRequestTransactions[requestId];
        delete gRequestTransactions[requestId];
        req.reject(error);
    }

    static updateRequestObject(message) {
        if (message.requestId == null) throw new Error('message requestId is null');
        const request = gRequestTransactions[message.requestId];
        if (message.status != 'FAILED') {
            request.resolve(message.result);
            return;
        }
        request.reject(message.result);
    }

    get origin() {
        return this._origin;
    }

    get createTime() {
        return this._createTime;
    }

    get id() {
        return this._id;
    }

    get storageLink() {
        return this._storageLink;
    }

    send(status, intention, data) {
        if (intention.toObject == null) throw new Error('Intention must not be null');
        const request = NetworkIntention.createRequestObject(this, intention);
        try {
            this._storageLink.sendObject({
                command: 'message',
                version: 1,
                status,
                id: this.id,
                intention: intention.toObject(),
                data: data,
                requestId: request.id
            });
            return request.promise;
        } catch (e) {
            NetworkIntention.deleteRequestObject(request.id, e);
            return request.promise;
        }
    }

    async sendCommand(intention, command, data) {
        const request = NetworkIntention.createRequestObject(this, intention, data);
        const iObj = (intention.toObject == null) ? intention : intention.toObject();
        try {
            this._storageLink.sendObject({
                command: command,
                version: 1,
                id: this.id,
                intention: iObj,
                data: data,
                requestId: request.id
            });
            return request.promise;
        } catch (e) {
            NetworkIntention.deleteRequestObject(request.id, e);
            return request.promise;
        }
    }


    toObject() {
        return {
            ...super.toObject(),
            createTime: this.createTime,
            origin: this._origin
        }
    }
};