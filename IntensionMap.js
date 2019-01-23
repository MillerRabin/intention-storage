const OriginMap = require('./OriginMap.js');

module.exports = class IntensionMap extends Map {
    constructor(storage) {
        super();
        if (storage == null) throw new Error('storage must be the first parameter');
        this.storage = storage;
    }
    set(intension) {
        const key = intension.getKey();
        if (!super.has(key)) super.set(key, new OriginMap());
        const originMap = super.get(key);
        if (originMap.has(intension)) throw new Error('The intension already exists');
        originMap.set(intension);
    }
    delete(intension) {
        const key = intension.getKey();
        const origin = super.get(key);
        if (origin == null) throw new Error('The intension does not exists');
        origin.delete(intension);
        if (origin.size == 0) super.delete(key);
    }
};