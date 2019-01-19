import Intension from './Intension.js';
import OriginMap from './OriginMap.js'
import intensionQuery from './intensionQuery.js';

const main = new Map();

function add(intensions, intension) {
    const key = intension.getKey();
    if (!intensions.has(key)) intensions.set(key, new OriginMap());
    intensions.get(key).set(intension);
}

function deleteIntension(intension, message) {
    try {
        intension.accepted.close(intension, { message: message });
    } catch (e) {
        console.log(e);
    }
    const key = intension.getKey();
    const originSet = main.get(key);
    if (originSet == null) return;
    originSet.delete(intension);
    if (originSet.size == 0) main.delete(key);
}

function create(params) {
    const intension = new Intension(params);
    add(main, intension);
    setTimeout(() => {
        dispatchIntensions(main, intension)
    });
    return intension;
}

function dispatchIntensions(intensions, intension) {
    const rKey = intension.getKey(true);
    const originMap = intensions.get(rKey);
    if (originMap == null) return;
    for (let [,origin] of originMap) {
        for (let int of origin) {
            try {
                if (int == intension) throw new Error('Intension can`t be equal to itself');
                int.accept(intension);
            } catch (e) {
                console.log(e);
            }
        }
    }
    gIntension.accepted.send(iobj);
}

function query(info) {
    return intensionQuery.query(main, info);
}

const iobj = {
    query: query,
};

function getIntensions() {
    return main;
}

async function onData(status) {
    if (status == 'accept') return iobj;
}

const gIntension = create({
    title: 'can query intension storage information',
    input: 'None',
    output: 'InterfaceObject',
    onData: onData
});

export default {
    create: create,
    delete: deleteIntension,
    get: getIntensions
}