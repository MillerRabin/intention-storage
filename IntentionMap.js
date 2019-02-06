const OriginMap = require('./OriginMap.js');

module.exports = class IntentionMap extends Map {
    constructor(storage) {
        super();
        if (storage == null) throw new Error('storage must be the first parameter');
        this.storage = storage;
    }
    set(intention) {
        const key = intention.getKey();
        if (!super.has(key)) super.set(key, new OriginMap());
        const originMap = super.get(key);
        if (originMap.has(intention)) throw new Error('The intention already exists');
        originMap.set(intention);
    }
    delete(intention) {
        const key = intention.getKey();
        const origin = super.get(key);
        if (origin == null) throw new Error('The intention does not exists');
        origin.delete(intention);
        if (origin.size == 0) super.delete(key);
    }
};