const Intention = require('./Intention.js');
const IntentionMap = require('./IntentionMap.js');
const StorageLink = require('./StorageLink.js');

function dispatchIntentions(intentions, intention) {
    const rKey = intention.getKey(true);
    const originMap = intentions.get(rKey);
    if (originMap == null) return;
    for (let [,origin] of originMap) {
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
        this._onUpdateIntentions = onUpdateIntentions;
        this._onUpdateStorages = onUpdateStorages;
    }
    addLink(origin) {
        const op = getParameter(origin, 'WebAddress');
        if (op == null) throw new Error('WebAddress parameter expected');
        const link = new StorageLink({ storage: this, origin: op });
        this.links.set(op, link);
        updateStorages(this, link, 'created');
        return op;
    }

    deleteLink(origin) {
        const op = getParameter(origin, 'WebAddress');
        if (op == null) throw new Error('WebAddress parameter expected');
        const link = this.links.get(op);
        if (link == null) throw new Error(`${ op } does not exists in linked storages`);
        this.links.delete(op);
        updateStorages(this, link, 'deleted');
        return op;
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
            value
        });
        this.intentions.set(intention);
        updateIntention(this, intention, 'created');
        setTimeout(() => {
            dispatchIntentions(this, intention)
        });
        return intention;
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
};