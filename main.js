const IntentionStorage = require('./IntentionStorage.js');

const uuid = require('./core/uuid.js');

module.exports = {
    generateUUID: uuid.generate,
    IntentionStorage: IntentionStorage
};