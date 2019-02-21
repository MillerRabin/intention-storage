const Intention = require('./Intention.js');
const IntentionMap = require('./IntentionMap.js');
const LinkedStorageClient = require('./LinkedStorageClient.js');
const LinkedStorageServer = require('./IntentionStorageServer.js');
const NetworkIntention = require('./NetworkIntention.js');
const IntentionQuery = require('./IntentionQuery.js');


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

    if ((intention.accepted == null) || (intention.accepted.size == 0)) {
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

function getParameter(params, type) {
    if (!Array.isArray(params)) return params;
    const par = params.filter(p => p.type == type);
    if (par[0] == null) return null;
    return par[0].value;
}


module.exports = class IntentionStorage {
    constructor () {
        this._intentions = new IntentionMap(this);
        this._links = new Map();
        this._dispatchWait = new Set();
        this._dispatchInterval = 5000;
        this._dispatchTimeout = null;
        this._query = new IntentionQuery(this);
        this._storageServer = null;
        dispatchCycle(this);
    }
    addLink(origin) {
        const op = getParameter(origin, 'WebAddress');
        if (op == null) throw new Error('WebAddress parameter expected');
        const link = new LinkedStorageClient({ storage: this, origin: op });
        this.links.set(link.key, link);
        this._query.updateStorage(link, 'created');
        return link;
    }

    deleteLink(origin) {
        const op = getParameter(origin, 'WebAddress');
        if (op == null) throw new Error('WebAddress parameter expected');
        const link = this.links.get(`${op}:10010`);
        if (link == null) throw new Error(`${ op } does not exists in linked storages`);
        this.links.delete(link.key);
        link.offline();
        this._query.updateStorage(link, 'deleted');
        return link;
    }

    _add(intention) {
        this.intentions.set(intention);
        intention._storage = this;
        this._query.updateIntention(intention, 'created');
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
            value,
            storage: this
        });
        this._add(intention);
        return intention;
    }

    async addNetworkIntention(intention) {
        if (!(intention instanceof NetworkIntention)) throw new Error('intention must be instance of NetworkIntention');
        try {
            await intention.storageLink.sendObject('translate', intention, this);
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
        this._query.updateIntention(intention, 'deleted');
    }
    get intentions() {
        return this._intentions;
    }
    get links() {
        return this._links;
    }
    set dispatchInterval(value) {
        if (typeof(value) != 'number') throw new Error('Value must be number');
        clearTimeout(this._dispatchTimeout);
        this._dispatchInterval = value;
        if (value > 0)
            dispatchCycle(this);
    }

    set statsInterval(value) {
        this._query.statsInterval = value;
    }

    get statsInterval() {
        return this._query.statsInterval;
    }

    get dispatchInterval() {
        return this._dispatchInterval;
    }

    createServer(port = 10010) {
        this._storageServer = new LinkedStorageServer({ storage: this, port });
        return this._storageServer;
    }

    closeServer() {
        this._storageServer.close();
    }

    translate(intention) {
        for (let [,link] of this._links) {
            link.translate(intention);
        }
    }

    queryIntentions(params) {
        return this._query.queryIntentions(this, params);
    }

    queryLinkedStorage(params) {
        return this._query.queryLinkedStorages(this, params);
    }


};