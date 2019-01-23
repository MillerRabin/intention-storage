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

module.exports = class IntensionStorage {
    constructor () {
        this.intensions = new IntensionMap(this);
        this.links = new Map();
    }
    addLink(origin) {
        this.links.set(origin, {
            origin: origin
        });
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
    deleteIntension(intension, message) {
        try {
            intension.accepted.close(intension, { message: message });
        } catch (e) {
            console.log(e);
        }
        this.intensions.delete(intension);
    }
};