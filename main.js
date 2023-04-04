import IntentionStorage  from "./IntentionStorage.js";
import IntentionError  from "./IntentionError.js";
import messagesModule from './messages.js';
import uuid  from "./core/uuid.js";

const messages = await messagesModule.getModule();

export default {
    generateUUID: uuid.generate,
    IntentionStorage,
    IntentionError,
    mapValueToInterface: messages.mapValueToInterface
};