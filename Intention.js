const uuid = require('./core/uuid.js');
const IntentionAbstract = require('./IntentionAbstract.js');

function update(intention, status) {
    intention._updateTime = new Date();
    intention._storage._query.updateIntention(intention, status);
}


async function accept(local, network) {
    if (local.accepted.isAccepting(network)) return;
    if (local.enableBroadcasting && network.accepted.isAccepting(local)) return;
    try {
        if (local.enableBroadcasting)
            await network.accepted.reload();
        local.accepted.setAccepting(network);
        if (local.accepted.has(network)) return;

        if (local.enableBroadcasting) {
            if (network.accepted.has(local)) return;
            if (network.accepted.isAccepting(local)) return;
        }

        let sAccept = null;
        let tAccept = null;
        try {
            sAccept = await local.send('accepting', network);
        } catch (e) {
            network.sendError(e);
            return;
        }
        try {
            tAccept = await network.send('accepting', local);
        } catch (e) {
            local.sendError(e);
            return;
        }

        local.send('accepted', network, tAccept);
        network.send('accepted', local, sAccept);
        update(local, 'accepted');
        update(network, 'accepted');
        local.accepted.set(network);
        network.accepted.set(local);
    } catch (e) {
        local.accepted.delete(network);
        if (local.enableBroadcasting)
            network.accepted.delete(local);
    } finally {
        local.accepted.deleteAccepting(network);
        if (local.enableBroadcasting)
            network.accepted.deleteAccepting(local);
    }
}

module.exports = class Intention extends IntentionAbstract {
    constructor ({
        title,
        description,
        input,
        output,
        onData,
        parameters = [],
        value,
        storage,
        enableBroadcasting = true
    }) {
        super({title, description, input, output, parameters, value, enableBroadcasting});
        if (storage == null) throw new Error('Intention must have a storage');
        if (typeof(onData) != 'function') throw new Error('Intention onData must be an async function');
        this._createTime = new Date();
        this._onData = onData;
        this._id = uuid.generate();
        this._storage = storage;
        this._type = 'Intention';
    }
    get origin() {
        if (this._storage._storageServer != null)
            return this._storage._storageServer.key;
        if (this._storage._webRTCAnswer != null)
            return this._storage._webRTCAnswer.key;
        return null;
    }
    get createTime() {
        return this._createTime;
    }

    get id() {
        return this._id;
    }

    async accept(intention) {
        return await accept(this, intention);
    }

    async send(status, intention, data) {
        try {
            return await this._onData(status, intention, data);
        } catch (e) {
            await intention.send('error', this, e);
            throw e;
        }
    }

    dispatch() {
        this._storage._dispatchWait.add(this);
    }

    toObject() {
        return {
            ...super.toObject(),
            createTime: this.createTime,
            origin: this.origin
        };
    }
};
