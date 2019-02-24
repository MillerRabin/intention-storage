const OriginMap = require('./OriginMap.js');

module.exports = class IntentionMap {
    constructor(storage) {
        if (storage == null) throw new Error('storage must be the first parameter');
        this.storage = storage;
        this._intentionsId = new Map();
        this._intentionsKey = new Map();
    }

    set(intention) {
        if (this._intentionsId.has(intention.id)) throw new Error('The intention already exists');
        const key = intention.getKey();
        if (!this._intentionsKey.has(key)) this._intentionsKey.set(key, new OriginMap());
        const originMap = this._intentionsKey.get(key);
        if (originMap.has(intention)) throw new Error('The intention already exists');
        originMap.set(intention);
        this._intentionsId.set(intention.id, intention);
    }

    delete(intention) {
        this._intentionsId.delete(intention.id);
        const key = intention.getKey();
        const origin = this._intentionsKey.get(key);
        if (origin == null) throw new Error('The intention does not exists');
        origin.delete(intention);
        if (origin.size == 0) this._intentionsKey.delete(key);
    }

    byId(id) {
        if (id != null)
            return this._intentionsId.get(id);
        return this._intentionsId;
    }

    byKey(key) {
        if (key != null)
            return this._intentionsKey.get(key);
        return this._intentionsKey;
    }
};