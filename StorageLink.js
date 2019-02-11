module.exports = class StorageLink {
    constructor({ storage, origin }) {
        this._storage = storage;
        this._origin = origin;
    }
    get origin() {
        return this._origin;
    }
    toObject() {
        return {
            origin: this._origin
        }
    }
};