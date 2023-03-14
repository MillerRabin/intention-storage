function queryIntentions() {
    return this.formatIntentions()
}

function queryLinkedStorages() {
    return this.formatLinkedStorages()
}

export default class IntentionQuery {
    #storage;
    #updatedIntentions = new Map();
    #updatedStorages = new Map();
    #statsInterval = 5000;
    #statsTimeout;
    #iQuery;
    #interface = {
        queryIntentions: queryIntentions.bind(this),
        queryLinkedStorages: queryLinkedStorages.bind(this),
        updatedIntentions: [],
        updatedStorages: []
    };
    #sendStats = true;

    #createQueryIntention() {
        return this.#storage.createIntention({
            title: {
                en: 'Can query information from intention storage',
                ru: 'Запрашиваю информацию у хранилища намерений'
            },
            input: 'None',
            output: 'StorageStats',
            onData: async function onData(status) {
                if (status == 'accepted') return this.#interface;
            }
        });
    }

    constructor (storage) {
        this.#storage = storage;
        setTimeout(() => {
            this.#iQuery = this.#createQueryIntention();
        }, 0);
    }


    #formatIntentions() {
        const res = [];
        for (let [, intention] of this.#storage.intentions.byId()) {
            res.push(intention.toObject());
        }
        return res;
    }

    #formatLinkedStorages() {
        const res = [];
        for (let [, link] of this.#storage.links) {
            res.push(link.toObject());
        }
        return res;
    }

    queryIntentions() {
        return this.#formatIntentions()
    }

    queryLinkedStorages() {
        return this.#formatLinkedStorages()
    }

    async #updateStats() {
        try {
            if ((this.#updatedIntentions.size == 0) && (this.#updatedStorages.size == 0)) return;
            this.#interface.updatedIntentions = [...this.#updatedIntentions.values()];
            this.#interface.updatedStorages = [...this.#updatedStorages.values()];
            this.#iQuery.accepted.send(this.#interface);
        } catch(e) {
            console.log(e);
        } finally {
            this.#updatedIntentions.clear();
            this.#updatedStorages.clear();
            if (this.#sendStats)
                this.#statsTimeout = setTimeout(() => this.#updateStats(), this.#statsInterval);
        }
    }

    #enableStats() {
        if (this.statsInterval == 0) {
            this.#sendStats = false;
            return;
        }
        this.#sendStats = true;
        this.#statsTimeout = setTimeout(() => this.#updateStats(), this.#statsInterval);
    }
    
    #disableStats() {
        this.#sendStats = false;
        clearTimeout(this.#statsTimeout);
    }

    updateIntention(intention, status) {
        this.#updatedIntentions.set(intention.id, {
            intention: intention.toObject(),
            status: status
        });
    }

    updateStorage(storage, status) {
        this.#updatedStorages.set(storage.id, {
            storage: storage.toObject(),
            status: status
        })
    }

    set statsInterval(interval) {
        this.#disableStats();
        this.#statsInterval = interval;
        this.#enableStats();
    }

    get statsInterval() {
        return this.#statsInterval;
    }

    get sendStats() {
        return this.#sendStats;
    }

    set sendStats(value) {
        if (typeof(value) != 'boolean') throw new Error('Value must be boolean');
        if (!value) return this.#disableStats();
        this.#enableStats();
    }
};


