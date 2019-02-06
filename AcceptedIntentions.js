module.exports = class AcceptedIntentions {
    constructor (intention) {
        if (intention == null) throw new Error('intention expected');
        this.accepted = new Map();
        this.intention = intention;
    }
    set(intention) {
        return this.accepted.set(intention.id, intention);
    }
    has(intention) {
        return this.accepted.has(intention.id);
    }
    delete(value) {
        this.accepted.delete(value.id);
    }
    send(data) {
        for (let [, intention] of this.accepted) {
            try {
                intention.send('data', this.intention, data);
            } catch (e) {
                console.log(e);
            }
        }
    }
    close(sourceIntention, info) {
        for (let [, intention] of this.accepted) {
            try {
                intention.close(sourceIntention, info);
            } catch (e) {
                console.log(e);
            }
        }
        this.accepted.clear();
    }
    toObject() {
        const res = [];
        for (let [, intention] of this.accepted) {
            res.push({
                id: intention.id,
                origin: intention.origin,
                title: intention.title,
                key: intention.getKey()
            });
        }
        return res;
    }
    get size() {
        return this.accepted.size;
    }
};