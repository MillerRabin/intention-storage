export default class OriginMap extends Map {
    set(intension) {
        if (!super.has(intension.origin))
            super.set(intension.origin, new Set());
        const is = super.get(intension.origin);
        is.add(intension);
    }
    delete(intension) {
        if (!super.has(intension.origin)) return;
        const is = super.get(intension.origin);
        is.delete(intension);
        if (is.size == 0)
            super.delete(intension.origin);
    }
};