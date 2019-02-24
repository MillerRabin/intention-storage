module.exports = class OriginMap extends Map {
    set(intention) {
        if (!super.has(intention.origin))
            super.set(intention.origin, new Map());
        const origin = super.get(intention.origin);
        origin.set(intention.id, intention);
    }
    delete(intention) {
        if (!super.has(intention.origin)) throw new Error('Intention does not exists');
        const origin = super.get(intention.origin);
        origin.delete(intention.id);
        if (origin.size == 0)
            super.delete(intention.origin);
    }
    has(intention) {
        const origin = super.get(intention.origin);
        if (origin == null) return false;
        return origin.has(intention.id);
    }
    get(intention) {
        const origin = super.get(intention.origin);
        if (origin == null) return null;
        return origin.get(intention.id);
    }
};