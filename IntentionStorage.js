const Intention = require('./Intention.js');
const IntentionMap = require('./IntentionMap.js');
const LinkedStorageClient = require('./LinkedStorageClient.js');
const NetworkIntention = require('./NetworkIntention.js');

function dispatchIntentions(storage, intention) {
    const rKey = intention.getKey(true);
    const originMap = storage._intentions.get(rKey);
    if (originMap != null) {
        for (let [, origin] of originMap) {
            for (let int of origin) {
                try {
                    if (int == intention) continue;
                    int.accept(intention);
                } catch (e) {
                    console.log(e);
                }
            }
        }
    }

    if (intention.accepted.size == 0) {
        storage.translate(intention);
        return false;
    }
    return true;
}

function dispatchCycle(storage) {
    clearTimeout(storage._dispatchTimeout);
    storage._dispatchTimeout = setTimeout(() => {
        for (let intention of storage._dispatchWait) {
            if (dispatchIntentions(storage, intention))
                storage._dispatchWait.delete(intention);
        }
        dispatchCycle(storage);
    }, storage._dispatchInterval);
}

function updateIntention(storage, intention, status) {
    if (storage._onUpdateIntentions != null)
        storage._onUpdateIntentions(intention, status);
}

function updateStorages(storage, link, status) {
    if (storage._onUpdateStorages != null)
        storage._onUpdateStorages(link, status);
}


function getParameter(params, type) {
    if (!Array.isArray(params)) return params;
    const par = params.filter(p => p.type == type);
    if (par[0] == null) return null;
    return par[0].value;
}

module.exports = class IntentionStorage {
    constructor ({ onUpdateStorages, onUpdateIntentions }) {
        this._intentions = new IntentionMap(this);
        this._links = new Map();
        this._dispatchWait = new Set();
        this._onUpdateIntentions = onUpdateIntentions;
        this._onUpdateStorages = onUpdateStorages;
        this._dispatchInterval = 5000;
        this._dispatchTimeout = null;
        dispatchCycle(this);
    }
    addLink(origin) {
        const op = getParameter(origin, 'WebAddress');
        if (op == null) throw new Error('WebAddress parameter expected');
        const link = new LinkedStorageClient({ storage: this, origin: op });
        this.links.set(link.key, link);
        updateStorages(this, link, 'created');
        return link;
    }

    deleteLink(origin) {
        const op = getParameter(origin, 'WebAddress');
        if (op == null) throw new Error('WebAddress parameter expected');
        const link = this.links.get(`${op}:10010`);
        if (link == null) throw new Error(`${ op } does not exists in linked storages`);
        this.links.delete(link.key);
        link.offline();
        updateStorages(this, link, 'deleted');
        return link;
    }

    _add(intention) {
        this.intentions.set(intention);
        updateIntention(this, intention, 'created');
        this._dispatchWait.add(intention);
    }
    createIntention({
        title,
        description,
        input,
        output,
        onData,
        parameters = [],
        value
    }) {
        const intention = new Intention({
            title,
            description,
            input,
            output,
            onData,
            parameters,
            onUpdate: this._onUpdateIntentions,
            value,
            storage: this
        });
        this._add(intention);
        return intention;
    }

    async addNetworkIntention(intention) {
        if (!(intention instanceof NetworkIntention)) throw new Error('intention must be instance of NetworkIntention');
        try {
            await intention.send('translate', intention, this);
            this._add(intention);
        } catch (e) {
            console.log(e);
        }
    }

    get(key) {
        return this.intentions.get(key);
    }
    deleteIntention(intention, data) {
        try {
            intention.accepted.close(intention, data);
        } catch (e) {
            console.log(e);
        }

        this.intentions.delete(intention);
        updateIntention(this, intention, 'deleted');
    }
    get intentions() {
        return this._intentions;
    }
    get links() {
        return this._links;
    }
    set dispatchInterval(value) {
        clearTimeout(this._dispatchTimeout);
        this._dispatchInterval = value;
        if (value > 0)
            dispatchCycle(this);
    }
    get dispatchInterval() {
        return this._dispatchInterval;
    }

    translate(intention) {
        for (let [,link] of this._links) {
            link.translate(intention);
        }
    }

};