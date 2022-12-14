import Intention  from "./Intention.js";
import IntentionMap  from "./IntentionMap.js";
import LinkedStorageClient  from "./LinkedStorageClient.js";
import LinkedStorageServer  from "./IntentionStorageServer.js";
import NetworkIntention  from "./NetworkIntention.js";
import IntentionQuery  from "./IntentionQuery.js";
import IntentionError  from "./IntentionError.js";
import WebRTC  from "./WebRtc.js";
import uuid  from "./core/uuid.js";

const errorCodes = {
    linkAlreadyExists: 'LNK-0001'
};

function typeIntentions(source, target) {
    if (source.type == 'Intention')
        return { local: source, network: target };
    if (target.type == 'Intention')
        return { local: target, network: source };
    return null;
}

function dispatchIntentions(storage, intention) {
    const rKey = intention.getKey(true);
    const originMap = storage._intentions.byKey(rKey);
    if (originMap != null) {
        for (const [, origin] of originMap) {
            for (const [, int] of origin) {
                try {
                    if (int == intention) continue;
                    const sRes = typeIntentions(int, intention);
                    if (sRes == null) continue;
                    sRes.local.accept(sRes.network);
                } catch (e) {}
            }
        }
    }

    if (intention.enableBroadcast)
        storage.broadcast(intention);
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
    if (!Array.isArray(params)) throw new Error('Parameters must be array of enties');
    const tp = (Array.isArray(type)) ? type : [type];
    const par = params.filter((p) => {
        const pt = p.name.toLowerCase();
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

export default class IntentionStorage {
    constructor () {
        this._intentions = new IntentionMap(this);
        this._links = new Map();
        this._dispatchWait = new Set();
        this._dispatchInterval = 5000;
        this._dispatchTimeout = null;
        this._query = new IntentionQuery(this);
        this._storageServer = null;
        this._webRTCAnswer = null;
        this._lifeTime = 5000;
        this._id = uuid.generate();
        this._type = 'IntentionStorage';
        dispatchCycle(this);
    }

    addStorage(params) {
        params.storage = this;
        if (params.handling == null)
            params.handling = 'manual';
        const keys = LinkedStorageClient.getKeys(params.origin, params.port);
        const tLink = hasStorage(this.links, keys);
        if ((tLink != null) && (tLink.handling != 'auto'))
            throw new IntentionError({
                message: `Storage already exists ${tLink.key}`,
                code: errorCodes.linkAlreadyExists,
                detail: { link: tLink}
            });
        if (tLink != null)
            this.deleteStorage(tLink);
        const link = new LinkedStorageClient(params);
        this.links.set(link.key, link);
        this._query.updateStorage(link, 'created');
        return link;
    }

    deleteStorage(link) {
        this.links.delete(link.key);
        link.dispose();
        link.close();
        this._query.updateStorage(link, 'deleted');
    }

    addLink(parameters) {
        const address = getParameter(parameters, ['WebAddress', 'IPAddress']);
        if (address == null) throw new Error('WebAddress or IPAddress entities expected');
        let port = getParameter(parameters, ['IPPort']);
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
        link.waitConnection();
        return link;
    }

    deleteLink(origin) {
        const address = getParameter(origin, ['WebAddress', 'IPAddress']);
        if (address == null) throw new Error('WebAddress or IPAddress parameter expected');
        let port = getParameter(origin, ['IPPort']);
        port = (port == null) ? 10010 : port;
        const path = `${address}:${port}`;
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
        value,
        enableBroadcast = true
    }) {
        const intention = new Intention({
            title,
            description,
            input,
            output,
            onData,
            parameters,
            value,
            storage: this,
            enableBroadcast
        });
        this._add(intention);
        return intention;
    }

    addNetworkIntention(intention) {
        if (!(intention instanceof NetworkIntention)) throw new Error('intention must be instance of NetworkIntention');
        this._add(intention);
    }

    deleteIntention(intention, data) {
        intention.accepted.close(data);
        this.intentions.delete(intention);
        this._query.updateIntention(intention, 'deleted');
    }

    deleteAllIntention(data) {
        for (const intention of this._intentions) {
            try {
                this.deleteIntention(intention, data);
            } catch (e) {}
        }
    }

    deleteAllStorages() {
        for (const [,link] of this._links) {
            try {
                this.deleteStorage(link);
            } catch (e) {}
        }
    }

    close() {
        this.closeServer();
        this.deleteAllIntention();
        this.deleteAllStorages();
        this.dispatchInterval = 0;
        this.statsInterval = 0;
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

    get query() {
        return this._query;
    }

    get lifeTime() {
        return this._lifeTime;
    }

    set lifeTime(value) {
        this._lifeTime = value;
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

    async createServer({address, port = 10010, sslCert, useSocket = true, useWebRTC = false }) {
        const rObj = {};
        if (useSocket) {
            this._storageServer = new LinkedStorageServer({ storage: this, address: address, port, sslCert });
            rObj.socketServer = this._storageServer;
        }

        if (useWebRTC) {
            this._webRTCAnswer = new WebRTC({ storage: this, key: address });
            await this._webRTCAnswer.connectToSignal(address);
            rObj.webRTCAnswer = this._webRTCAnswer;
        }
        return rObj;
    }

    closeServer() {
        if (this._storageServer != null)
            this._storageServer.close();
    }

    async broadcast(intention) {
        if (intention.origin == null) return false;
        for (let [,link] of this._links) {
            try {
                await link.broadcast(intention);
            } catch (e) {
                if (!e.dispose) {
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

    broadcastIntentionsToLink(link) {
        const intentions = this.intentions.byId();
        for (let [,intention] of intentions) {
            try {
                link.broadcast(intention);
            } catch (e) {
                if (!e.dispose) {
                    return;
                }
                this.deleteStorage(link);
            }
        }
        return true;
    }

    toObject() {
        return {
            id: this._id,
            type: this._type
        }
    }
};
