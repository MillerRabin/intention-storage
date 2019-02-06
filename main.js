const intentionQuery = require('./intentionQuery.js');
const IntentionStorage = require('./IntentionStorage.js');
const uuid = require('./core/uuid.js');

const main = new IntentionStorage();

function onUpdate(intention, status) {
    iQuery.accepted.send({
        intention: intention.toObject(),
        status: status
    });
}

function create(params) {
    const tParams = Object.assign(params);
    tParams.onUpdate = onUpdate;
    return main.createIntention(params);
}

function deleteIntention(intention, data) {
    return main.deleteIntention(intention, data);
}

function query(info) {
    return intentionQuery.query(main, info);
}

const iobj = {
    query: query,
};

const iQuery = main.createIntention({
    title: {
        en: 'Can query information from intention storage',
        ru: 'Запрашивает информацию у хранилища намерений'
    },
    input: 'None',
    output: 'StorageIntentions',
    onData: async function onData(status) {
        if (status == 'accept') return iobj;
    }
});

module.exports = {
    create: create,
    delete: deleteIntention,
    storage: main,
    generateUUID: uuid.generate
};