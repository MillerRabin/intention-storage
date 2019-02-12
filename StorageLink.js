module.exports = class StorageLink {
    constructor({ storage, origin, port = 10010}) {
        this._storage = storage;
        this._origin = origin;
        this._port =  port;
        this._key = `${origin}:${port}`;
    }
    get origin() {
        return this._origin;
    }
    get key() {
        return this._key;
    }
    toObject() {
        return {
            origin: this._origin,
            port: this._port,
            key: `${this._origin}:${this._port}`
        }
    }
};