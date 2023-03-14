import OriginMap  from "./OriginMap.js";

export default class IntentionMap {
    #storage;
    #intentionsId = new Map();
    #intentionsKey = new Map();
    
    constructor(storage) {
        if (storage == null) throw new Error('storage must be the first parameter');
        this.#storage = storage;
        this.#intentionsId = new Map();
        this.#intentionsKey = new Map();
    }

    set(intention) {
        if (this.#intentionsId.has(intention.id)) throw new Error('The intention already exists');
        const key = intention.getKey();
        if (!this.#intentionsKey.has(key)) this.#intentionsKey.set(key, new OriginMap());
        const originMap = this.#intentionsKey.get(key);
        if (originMap.has(intention)) throw new Error('The intention already exists');
        originMap.set(intention);
        this.#intentionsId.set(intention.id, intention);
    }

    delete(intention) {
        this.#intentionsId.delete(intention.id);
        const key = intention.getKey();
        const origin = this.#intentionsKey.get(key);
        if (origin == null) return;
        origin.delete(intention);
        if (origin.size == 0) this.#intentionsKey.delete(key);
    }

    [Symbol.iterator]() { return this.#intentionsId.values() }

    byId(id) {
        if (id != null)
            return this.#intentionsId.get(id);
        return this.#intentionsId;
    }

    get storage() { return this.#storage; }

    byKey(key) {
        if (key != null)
            return this.#intentionsKey.get(key);
        return this.#intentionsKey;
    }
};