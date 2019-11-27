function loadAccepted(self, acceptedObject) {
    const aMap = ((acceptedObject != null) && Array.isArray(acceptedObject.accepted)) ? new Map(acceptedObject.accepted) : new Map();
    const aSet = ((acceptedObject != null) && Array.isArray(acceptedObject.accepting)) ? new Set(acceptedObject.accepting) : new Set();
    self._accepted = aMap;
    self._accepting = aSet;
}

module.exports = class AcceptedIntentions {
    constructor (intention, accepted) {
        if (intention == null) throw new Error('intention expected');
        this.intention = intention;
        loadAccepted(this, accepted);
    }

    async set(intention) {
        const result = this._accepted.set(intention.id, intention);
        if (this.intention.type == 'NetworkIntention')
            return await this.intention.sendCommand(intention, 'setAccepted');
        return result;
    }

    has(intention) {
        return this._accepted.has(intention.id);
    }

    isAccepting(target) {
        return this._accepting.has(target.id);
    }

    setAccepting(target) {
        this._accepting.add(target.id);
    }

    deleteAccepting(target) {
        this._accepting.delete(target.id);
    }

    delete(intention, data) {
        const result = this._accepted.delete(intention.id);
        if (intention.type == 'Intention') {
            intention.accepted._accepted.delete(this.intention.id);
            intention.send('close', this.intention, data).catch(() => {});
        }
        if (this.intention.type == 'NetworkIntention')
            this.intention.sendCommand(intention, 'deleteAccepted', data).catch(() => {});
        return result;
    }

    async send(data, status = 'data') {
        const promises = [];
        for (let [, intention] of this._accepted) {
            promises.push(intention.send(status, this.intention, data).catch((e) => {
                return { reason: e };
            }));
        }
        return await Promise.all(promises);
    }

    async reload() {
        if (this.intention.type == 'NetworkIntention') {
            const aObj = await this.intention.sendCommand(this.intention, 'getAccepted');
            loadAccepted(this, aObj);
        }
    }

    close(data) {
        for (const [, intention] of this._accepted) {
            this.delete(intention, data);
        }
        this._accepted.clear();
    }

    toObject() {
        const res = {
            accepted: [],
            accepting: Array.from(this._accepting)
        };
        for (const [key, intention] of this._accepted) {
            res.accepted.push([
                key,{
                    id: intention.id,
                    origin: intention.origin,
                    title: intention.title,
                    key: (intention.key != null) ? key : intention.getKey()
                }]);
        }
        return res;
    }

    get size() {
        return this._accepted.size;
    }
};