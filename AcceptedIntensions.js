module.exports = class AcceptedIntensions {
    constructor (intension) {
        if (intension == null) throw new Error('intension expected');
        this.accepted = new Map();
        this.intension = intension;
    }
    set(value) {
        this.accepted.set(value.id, value);
    }
    delete(value) {
        this.accepted.delete(value.id);
    }
    send(data) {
        for (let [, intension] of this.accepted) {
            try {
                intension.send('data', this.intension, data);
            } catch (e) {
                console.log(e);
            }
        }
    }
    close(sourceIntension, info) {
        for (let [, intension] of this.accepted) {
            try {
                intension.close(sourceIntension, info);
            } catch (e) {
                console.log(e);
            }
        }
        this.accepted.clear();
    }
    toObject() {
        const res = [];
        for (let [, intension] of this.accepted) {
            res.push({
                id: intension.id,
                origin: intension.origin,
                title: intension.title,
                key: intension.getKey()
            });
        }
        return res;
    }
    get size() {
        return this.accepted.size;
    }
};