const Intention = require('./Intention.js');
const IntentionMap = require('./IntentionMap.js');

function dispatchIntentions(intentions, intention) {
    const rKey = intention.getKey(true);
    const originMap = intentions.get(rKey);
    if (originMap == null) return;
    for (let [,origin] of originMap) {
        for (let int of origin) {
            try {
                if (int == intention) continue;
                int.accept(intention);
            } catch (e) {
                console.log(e);
            }
        }
    }
}

function getParameter(params, type) {
    if (!Array.isArray(params)) return params;
    const par = params.filter(p => p.type == type);
    if (par[0] == null) return null;
    return par[0].value;
}

module.exports = class IntentionStorage {
    constructor () {
        this.intentions = new IntentionMap(this);
        this.links = new Map();
    }
    addLink(origin) {
        const op = getParameter(origin, 'WebAddress');
        if (op == null) throw new Error('WebAddress parameter expected');
        this.links.set(op, {
            origin: op
        });
        return op;
    }

    deleteLink(origin) {
        const op = getParameter(origin, 'WebAddress');
        if (op == null) throw new Error('WebAddress parameter expected');
        if (!this.links.has(op)) throw new Error(`${ op } does not exists in linked storages`);
        this.links.delete(op);
        return op;
    }

    createIntention({
        title,
        description,
        input,
        output,
        onData,
        parameters = [],
        onUpdate,
        value
    }) {
        const intention = new Intention({
            title,
            description,
            input,
            output,
            onData,
            parameters,
            onUpdate,
            value
        });
        this.intentions.set(intention);
        setTimeout(() => {
            dispatchIntentions(this, intention)
        });
        return intention;
    }
    get(key) {
        return this.intentions.get(key);
    }
    deleteIntention(intention, data) {
        try {
            intention.accepted.close(intention, data);
        } catch (e) {
            console.log(e);
        }

        this.intentions.delete(intention);
    }
};