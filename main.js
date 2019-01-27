const intensionQuery = require('./intensionQuery.js');
const IntensionStorage = require('./intensionStorage.js');

const main = new IntensionStorage();


function create(params) {
    return main.createIntension(params);
}

function deleteIntension(intension, data) {
    return main.deleteIntension(intension, data);
}

function query(info) {
    return intensionQuery.query(main, info);
}

const iobj = {
    query: query,
};

async function onData(status) {
    if (status == 'accept') return iobj;
}

main.createIntension({
    title: 'Can be intension storage',
    input: 'None',
    output: 'InterfaceObject',
    onData: onData
});

module.exports = {
    create: create,
    delete: deleteIntension,
    storage: main
};