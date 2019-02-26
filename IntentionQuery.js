function createQueryIntention(query) {
    return query._storage.createIntention({
        title: {
            en: 'Can query information from intention storage',
            ru: 'Запрашиваю информацию у хранилища намерений'
        },
        input: 'None',
        output: 'StorageStats',
        onData: async function onData(status) {
            if (status == 'accept') return query._iObj;
        }
    });
}

function sendStats() {
    try {
        if (this._iQuery == null) return;
        if (this._updatedIntentions.size == 0) return;
        this._iObj.updatedIntentions = [...this._updatedIntentions.values()];
        this._iObj.updatedStorages = [...this._updatedStorages.values()];

        this._iQuery.accepted.send(this._iObj);
    } catch(e) {
        console.log(e);
    } finally {
        this._updatedIntentions.clear();
        this._updatedStorages.clear();
        if (this._sendStats)
            this._statsTimeout = setTimeout(sendStats.bind(this), this._statsInterval);
    }
}


function enableStats(intentionQuery) {
    if (intentionQuery._statsInterval == 0) {
        intentionQuery._sendStats = false;
        return;
    }
    intentionQuery._sendStats = true;
    intentionQuery._statsTimeout = setTimeout(sendStats.bind(intentionQuery), intentionQuery._statsInterval);
}

function disableStats(intentionQuery) {
    intentionQuery._sendStats = false;
    clearTimeout(this._statsTimeout);
}

module.exports = class IntentionQuery {
    constructor (storage) {
        this._storage = storage;
        this._updatedIntentions = new Map();
        this._updatedStorages = new Map();
        this.sendStats = true;
        this._statsInterval = 5000;
        this._statsTimeout = null;
        this._iObj = {
            queryIntentions: this.queryIntentions.bind(this),
            queryLinkedStorages: this.queryLinkedStorages.bind(this)
        };
        setTimeout(() => {
            this._iQuery = createQueryIntention(this)
        });
    }

    queryIntentions() {
        return this.formatIntentions()
    }

    queryLinkedStorages() {
        return this.formatLinkedStorages()
    }

    updateIntention(intention, status) {
        this._updatedIntentions.set(intention.id, {
            intention: intention.toObject(),
            status: status
        });
    }

    updateStorage(storage, status) {
        this._updatedStorages.set(storage.id, {
            storage: storage.toObject(),
            status: status
        })
    }

    set statsInterval(interval) {
        disableStats(this);
        this._statsInterval = interval;
        enableStats(this);
    }

    get statsInterval() {
        return this._statsInterval;
    }

    get sendStats() {
        return this._sendStats;
    }

    set sendStats(value) {
        if (typeof(value) != 'boolean') throw new Error('Value must be boolean');
        if (!value) return disableStats(this);
        enableStats(this);
    }

    formatIntentions() {
        const res = [];
        for (let [, intention] of this._storage.intentions.byId()) {
            res.push(intention.toObject());
        }
        return res;
    }

    formatLinkedStorages() {
        const res = [];
        for (let [, link] of this._storage.links) {
            res.push(link.toObject());
        }
        return res;
    }
};


