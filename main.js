import IntentionStorage  from "./IntentionStorage.js";
import IntentionError  from "./IntentionError.js";

import uuid  from "./core/uuid.js";

export default {
    generateUUID: uuid.generate,
    IntentionStorage,
    IntentionError
};