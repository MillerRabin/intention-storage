const Intension = require('./Intension.js');
const IntensionMap = require('./IntensionMap.js');

function dispatchIntensions(intensions, intension) {
    const rKey = intension.getKey(true);
    const originMap = intensions.get(rKey);
    if (originMap == null) return;
    for (let [,origin] of originMap) {
        for (let int of origin) {
            try {
                if (int == intension) continue;
                int.accept(intension);
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

module.exports = class IntensionStorage {
    constructor () {
        this.intensions = new IntensionMap(this);
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

    createIntension({
        title,
        description,
        input,
        output,
        onData,
        parameters = []
    }) {
        const intension = new Intension({
            title,
            description,
            input,
            output,
            onData,
            parameters
        });
        this.intensions.set(intension);
        setTimeout(() => {
            dispatchIntensions(this, intension)
        });
        return intension;
    }
    get(key) {
        return this.intensions.get(key);
    }
    deleteIntension(intension, data) {
        try {
            intension.accepted.close(intension, data);
        } catch (e) {
            console.log(e);
        }
        this.intensions.delete(intension);
    }
};