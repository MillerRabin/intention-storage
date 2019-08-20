//${time}
const Intention = require('./Intention.js');
const IntentionMap = require('./IntentionMap.js');
const LinkedStorageClient = require('./LinkedStorageClient.js');
const LinkedStorageServer = require('./IntentionStorageServer.js');
const NetworkIntention = require('./NetworkIntention.js');
const IntentionQuery = require('./IntentionQuery.js');
const IntentionError = require('./IntentionError.js');
const uuid = require('./core/uuid.js');

const errorCodes = {
    linkAlreadyExists: 'LNK-0001'
};


function dispatchIntentions(storage, intention) {
    const rKey = intention.getKey(true);
    const originMap = storage._intentions.byKey(rKey);
    if (originMap != null) {
        for (let [, origin] of originMap) {
            for (let [, int] of origin) {
                try {
                    if (int == intention) continue;
                    if ((int.type == 'NetworkIntention') && (intention.type == 'NetworkIntention'))  continue;
                    int.accept(intention);
                } catch (e) {
                    console.log(e);
                }
            }
        }
    }

    storage.translate(intention);
    return true;
}

function dispatchCycle(storage) {
    clearTimeout(storage._dispatchTimeout);
    storage._dispatchTimeout = setTimeout(() => {
        for (let intention of storage._dispatchWait) {
            dispatchIntentions(storage, intention);
            storage._dispatchWait.delete(intention);
        }
        dispatchCycle(storage);
    }, storage._dispatchInterval);
}

function getParameter(params, type) {
    if (!Array.isArray(params)) return params;
    const tp = (Array.isArray(type)) ? type : [type];
    const par = params.filter((p) => {
        const pt = p.type.toLowerCase();
        const cs = tp.find((t) => {
            const lt = t.toLowerCase();
            return pt == lt;
        });
        return (cs != null);
    });
    if (par[0] == null) return null;
    return par[0].value;
}

function hasStorage(storages, keys) {
    for (let key of keys) {
        const link = storages.get(key);
        if (link != null) return link;
    }
    return null;
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
        this._id = uuid.generate();
        this._type = 'IntentionStorage';
        dispatchCycle(this);
    }

    addStorage(params) {
        params.storage = this;
        const keys = LinkedStorageClient.getKeys(params.origin, params.port);
        const tLink = hasStorage(this.links, keys);
        if (tLink != null)
            throw new IntentionError({
                message: `Storage already exists ${tLink.key}`,
                code: errorCodes.linkAlreadyExists,
                detail: { link: tLink}
            });
        const link = new LinkedStorageClient(params);
        this.links.set(link.key, link);
        this._query.updateStorage(link, 'created');
        return link;
    }

    deleteStorage(link) {
        this.links.delete(link.key);
        link.dispose();
        this._query.updateStorage(link, 'deleted');
    }

    addLink(origin) {
        const address = getParameter(origin, ['WebAddress', 'IPAddress']);
        if (address == null) throw new Error('WebAddress or IPAddress parameter expected');
        let port = getParameter(origin, ['IPPort']);
        port = (port == null) ? undefined : port;
        const keys = LinkedStorageClient.getKeys(address, port);
        const tLink = hasStorage(this.links, keys);
        if (tLink != null)
            throw new IntentionError({
                message: `Storage already exists ${tLink.key}`,
                code: errorCodes.linkAlreadyExists,
                detail: { link: tLink}
            });
        const link = this.addStorage({ origin: address, handling: 'manual', port: port });
        link.connect();
        return link;
    }

    deleteLink(origin) {
        const address = getParameter(origin, ['WebAddress', 'IPAddress']);
        if (address == null) throw new Error('WebAddress or IPAddress parameter expected');
        let port = getParameter(origin, ['IPPort']);
        port = (port == null) ? 10010 : port;
        const path = `ws://${address}:${port}`;
        const link = this.links.get(path);
        if (link == null) throw new Error(`${ path } does not exists in linked storages`);
        this.deleteStorage(link);
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
        this._add(intention);
    }

    deleteIntention(intention, data) {
        try {
            intention.accepted.close(intention, data);
        } catch (e) {
            console.log(e);
        }

        this.intentions.delete(intention);
        if (intention._storageLink != null)
            intention._storageLink.deleteIntention(intention);
        this._query.updateIntention(intention, 'deleted');
    }

    get intentions() {
        return this._intentions;
    }
    get links() {
        return this._links;
    }
    get id() {
        return this._id;
    }

    get type() {
        return this._type;
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

    get storageServer() {
        return this._storageServer;
    }

    createServer({address, port = 10010}) {
        this._storageServer = new LinkedStorageServer({ storage: this, address: address, port });
        return this._storageServer;
    }

    closeServer() {
        this._storageServer.close();
    }

    translate(intention) {
        if (intention.origin == null) return false;
        for (let [,link] of this._links) {
            try {
                link.translate(intention);
            } catch (e) {
                if (!e.dispose) {
                    console.log(e);
                    return;
                }
                this.deleteStorage(link);
            }
        }
        return true;
    }

    queryIntentions(params) {
        return this._query.queryIntentions(params);
    }

    queryLinkedStorage(params) {
        return this._query.queryLinkedStorages(params);
    }

    toObject() {
        return {
            id: this._id,
            type: this._type
        }
    }
};