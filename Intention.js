import IntentionAbstract  from "./IntentionAbstract.js";

async function accept(local, network) {    
    if (local.accepted.isAccepting(network)) return;
    if (local.enableBroadcast && network.accepted.isAccepting(local)) return;
    try {
        if (local.enableBroadcast)
            await network.accepted.reload();
        local.accepted.setAccepting(network);
        if (local.accepted.has(network)) return;

        if (local.enableBroadcast) {
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
        local.update('accepted');
        network.update('accepted');
        local.accepted.set(network);
        network.accepted.set(local);
    } catch (e) {
        console.log(e);
        local.accepted.delete(network);
        if (local.enableBroadcast)
            network.accepted.delete(local);
    } finally {
        local.accepted.deleteAccepting(network);
        if (local.enableBroadcast)
            network.accepted.deleteAccepting(local);
    }
}

export default class Intention extends IntentionAbstract {        
    #type = 'Intention';
    #storage;
    #onData;
    
    constructor ({
        title,
        description,
        input,
        output,
        onData,
        parameters = [],
        value,
        storage,
        enableBroadcast = true
    }) {
        super({title, description, input, output, parameters, value, enableBroadcast});
        if (storage == null) throw new Error('Intention must have a storage');
        if (typeof(onData) != 'function') throw new Error('Intention onData must be an async function');        
        this.#onData = onData;        
        this.#storage = storage;        
    }

    get origin() {
        if (this.#storage.storageServer != null)
            return this.#storage.storageServer.key;
        if (this.#storage.webRTCAnswer != null)
            return this.#storage.webRTCAnswer.key;
        return null;
    }
    
    async accept(intention) {
        return await accept(this, intention);
    }

    async send(status, intention, data) {
        try {
            return await this.#onData(status, intention, data);
        } catch (e) {
            await intention.send('error', this, e);
            throw e;
        }
    }

    dispatch() {
        this.#storage.dispatchWait.add(this);
    }

    get type() {
        return this.#type;
    }

    toObject() {
        return {
            ...super.toObject(),
            origin: this.origin,
            type: this.#type
        };
    }
};
