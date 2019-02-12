const intentionQuery = require('./intentionQuery.js');
const IntentionStorage = require('./IntentionStorage.js');
const uuid = require('./core/uuid.js');

const main = new IntentionStorage({ onUpdateStorages, onUpdateIntentions });
const updatedIntentions = new Map();
const updatedStorages = new Map();
let gSendStats = true;
let gStatsInterval = 5000;
let gStatsTimeout = null;

function sendStats() {
    try {
        if (updatedIntentions.size == 0) return;
        iQuery.accepted.send({
            updatedIntentions: [...updatedIntentions.values()],
            updatedStorages: [...updatedStorages.values()],
            queryIntentions: queryIntentions,
            queryLinkedStorages: queryLinkedStorages,
        });
    } catch(e) {
        console.log(e);
    } finally {
        updatedIntentions.clear();
        updatedStorages.clear();
        if (gSendStats)
            gStatsTimeout = setTimeout(sendStats, gStatsInterval);
    }
}

function onUpdateIntentions(intention, status) {
    updatedIntentions.set(intention.id, {
        intention: intention.toObject(),
        status: status
    })
}

function onUpdateStorages(storage, status) {
    updatedStorages.set(storage.id, {
        storage: storage.toObject(),
        status: status
    })
}

function create(params) {
    return main.createIntention(params);
}

function deleteIntention(intention, data) {
    return main.deleteIntention(intention, data);
}

function queryIntentions(info) {
    return intentionQuery.queryIntentions(main, info);
}

function queryLinkedStorages(info) {
    return intentionQuery.queryLinkedStorages(main, info);
}

const iobj = {
    queryIntentions: queryIntentions,
    queryLinkedStorages: queryLinkedStorages
};

const iQuery = main.createIntention({
    title: {
        en: 'Can query information from intention storage',
        ru: 'Запрашиваю информацию у хранилища намерений'
    },
    input: 'None',
    output: 'StorageStats',
    onData: async function onData(status) {
        if (status == 'accept') return iobj;
    }
});


function enableStats() {
    gSendStats = true;
    gStatsTimeout = setTimeout(sendStats, gStatsInterval);
}

function disableStats() {
    gSendStats = false;
    clearTimeout(gStatsTimeout);
}

function setStatsInterval(interval) {
    disableStats();
    gStatsInterval = interval;
    enableStats();
}

module.exports = {
    create: create,
    delete: deleteIntention,
    storage: main,
    generateUUID: uuid.generate,
    disableStats: disableStats,
    enableStats: enableStats,
    setStatsInterval: setStatsInterval
};