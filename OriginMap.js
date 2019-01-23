module.exports = class OriginMap extends Map {
    set(intension) {
        if (!super.has(intension.origin))
            super.set(intension.origin, new Set());
        const origin = super.get(intension.origin);
        origin.add(intension);
    }
    delete(intension) {
        if (!super.has(intension.origin)) throw new Error('Intension does not exists');
        const origin = super.get(intension.origin);
        origin.delete(intension);
        if (origin.size == 0)
            super.delete(intension.origin);
    }
    has(intension) {
        const origin = super.get(intension.origin);
        if (origin == null) return false;
        return origin.has(intension);
    }
    get(intension) {
        const origin = super.get(intension.origin);
        if (origin == null) return null;
        return origin.get(intension);
    }
};