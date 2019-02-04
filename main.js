const intensionQuery = require('./intensionQuery.js');
const IntensionStorage = require('./intensionStorage.js');
const uuid = require('./core/uuid.js');

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


main.createIntension({
    title: 'Can return intension information',
    input: 'None',
    output: 'StorageIntensions',
    onData: async function onData(status) {
        if (status == 'accept') return iobj;
    }
});

module.exports = {
    create: create,
    delete: deleteIntension,
    storage: main,
    generateUUID: uuid.generate
};