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
    #intentions = new IntentionMap(this);
    #links = new Map();
    #dispatchWait = new Set();
    #dispatchInterval = 5000;
    #dispatchTimeout;
    #storageServer = null;
    #webRTCAnswer;
    #requestLifeTime = 5000;
    #connectionLifeTime = 5000;    
    #id;
    #type = 'IntentionStorage';
    #query;
    
    constructor (params = {}) {
        const id = params.id ?? uuid.generate();
        this.#id = id;
        this.#query = new IntentionQuery(this);
        this.#dispatchCycle();
    }

    
    #dispatchCycle() {
        clearTimeout(this.#dispatchTimeout);
        this.#dispatchTimeout = setTimeout(() => {
            for (let intention of this.#dispatchWait) {
                this.#dispatchIntentions(intention);
                this.#dispatchWait.delete(intention);
            }
            this.#dispatchCycle();
        }, this.#dispatchInterval);
    }

    #dispatchIntentions(intention) {
        const rKey = intention.getKey(true);
        const originMap = this.#intentions.byKey(rKey);
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
            this.broadcast(intention);
        return true;
    }

    #add(intention) {
        this.#intentions.set(intention);
        intention.storage = this;
        this.#query.updateIntention(intention, 'created');
        this.#dispatchWait.add(intention);
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
                detail: { link: tLink }
            });
        if (tLink != null)
            this.deleteStorage(tLink);
        const link = new LinkedStorageClient(params);
        this.links.set(link.key, link);
        this.#query.updateStorage(link, 'created');
        return link;
    }

    deleteStorage(link) {
        this.links.delete(link.key);
        link.dispose();
        link.close();
        this.#query.updateStorage(link, 'deleted');
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
        this.#add(intention);
        return intention;
    }

    addNetworkIntention(intention) {
        if (!(intention instanceof NetworkIntention)) throw new Error('intention must be instance of NetworkIntention');
        this.#add(intention);
    }

    deleteIntention(intention, data) {
        intention.accepted.close(data);
        this.intentions.delete(intention);
        this.#query.updateIntention(intention, 'deleted');
    }

    deleteAllIntention(data) {
        for (const intention of this.#intentions) {
            try {
                this.deleteIntention(intention, data);
            } catch (e) {}
        }
    }

    deleteAllStorages() {
        for (const [,link] of this.#links) {
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
        return this.#intentions;
    }
    get links() {
        return this.#links;
    }
    get id() {
        return this.#id;
    }

    get type() {
        return this.#type;
    }

    get query() {
        return this.#query;
    }

    get requestLifeTime() {
        return this.#requestLifeTime;
    }

    set requestLifeTime(value) {
        this.#requestLifeTime = value;
    }

    get connectionLifeTime() {
        return this.#connectionLifeTime;
    }

    set connectionLifeTime(value) {
        this.#connectionLifeTime = value;
    }

    get dispatchInterval() {
        return this.#dispatchInterval;
    }

    set dispatchInterval(value) {
        if (typeof(value) != 'number') throw new Error('Value must be number');
        clearTimeout(this.#dispatchTimeout);
        this.#dispatchInterval = value;
        if (value > 0)
            this.#dispatchCycle();
    }

    set statsInterval(value) {
        this.#query.statsInterval = value;
    }

    get statsInterval() {
        return this.#query.statsInterval;
    }

    get dispatchInterval() {
        return this.#dispatchInterval;
    }

    get storageServer() {
        return this.#storageServer;
    }

    get webRTCAnswer() {
        return this.#webRTCAnswer;
    }
    
    async createServer({address, port = 10010, sslCert, useSocket = true, useWebRTC = false }) {
        const rObj = {};
        if (useSocket) {
            this.#storageServer = new LinkedStorageServer({ storage: this, address: address, port, sslCert });
            rObj.socketServer = this.#storageServer;
        }

        if (useWebRTC) {
            this.#webRTCAnswer = new WebRTC({ storage: this, key: address });
            await this.#webRTCAnswer.connectToSignal(address);
            rObj.webRTCAnswer = this.#webRTCAnswer;
        }
        return rObj;
    }

    closeServer() {
        if (this.#storageServer != null)
            this.#storageServer.close();
    }

    async broadcast(intention) {
        if (intention.origin == null) return false;
        for (let [,link] of this.#links) {
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
        return this.#query.queryIntentions(params);
    }

    queryLinkedStorage(params) {
        return this.#query.queryLinkedStorages(params);
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
            id: this.#id,
            type: this.#type
        }
    }
};
