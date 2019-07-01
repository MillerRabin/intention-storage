const IntentionStorage = require('./IntentionStorage.js');
const IntentionError = require('./IntentionError.js');

const uuid = require('./core/uuid.js');

module.exports = {
    generateUUID: uuid.generate,
    IntentionStorage,
    IntentionError
};