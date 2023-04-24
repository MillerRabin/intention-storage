import IntentionStorage  from "./IntentionStorage.js";
import IntentionError  from "./IntentionError.js";
import coreModule from './core.js';
import uuid  from "./core/uuid.js";

const core = await coreModule.getModule();

export default {
    generateUUID: uuid.generate,
    IntentionStorage,
    IntentionError,
    IntentionInterface: core.IntentionInterface
};