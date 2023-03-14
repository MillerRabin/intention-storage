import safe  from "./core/safe.js";
import AcceptedIntentions  from "./AcceptedIntentions.js";
import uuid  from "./core/uuid.js";

export default class IntentionAbstract {
    #createTime = new Date();    
    #id = uuid.generate();
    #updateTime = this.#createTime;
    #title;
    #description;
    #input;
    #output;
    #parameters;
    #value;
    #accepted;
    #type = 'IntentionAbstract';
    #enableBroadcast;
    #storage;
    
    constructor ({
        title,
        description,
        input,
        output,
        parameters = [],
        value,
        accepted,
        enableBroadcast = true,
        id = this.#id,
        createTime = this.#createTime
    }) {
        if (safe.isEmpty(title)) throw new Error('Intention must have a title');
        if (safe.isEmpty(input)) throw new Error('Intention must have an input parameter');
        if (safe.isEmpty(output)) throw new Error('Intention must have an output parameters');
        if (!Array.isArray(parameters)) throw new Error('Parameters must be array');
        if (input == output) throw new Error('Input and Output can`t be the same');

        this.#title = title;
        this.#description = description;
        this.#input = input;
        this.#output = output;
        this.#parameters = parameters;
        this.#value = value;
        this.#accepted = new AcceptedIntentions(this, accepted);        
        this.#enableBroadcast = enableBroadcast;
        this.#id = id;
        this.#createTime = createTime;
    }

    getKey(reverse = false) {
        return (!reverse) ? `${ this.#input } - ${ this.#output }` : `${ this.#output } - ${ this.#input }`;
    }

    get parameters() {
        return this.#parameters;
    }
    get input() {
        return this.#input;
    }
    get output() {
        return this.#output;
    }
    get description() {
        return this.#description;
    }
    get title() {
        return this.#title;
    }
    get updateTime() {
        return this.#updateTime;
    }
    get createTime() {
        return this.#createTime;
    }
    get value() {
        return this.#value;
    }
    get type() {
        return this.#type;
    }

    get accepted() {
        return this.#accepted;
    }

    get enableBroadcast() {
        return this.#enableBroadcast;
    }

    get id() {
        return this.#id;
    }

    get storage() {
        return this.#storage;
    }

    set storage(value) {
        this.#storage = value;
    }

    update(status) {
        this.#updateTime = new Date();
        this.#storage.query.updateIntention(this, status);
    }
    
    toObject() {
        return {
            id: this.#id,
            createTime: this.#createTime,
            updateTime: this.#updateTime,
            key: this.getKey(),
            input: this.#input,
            output: this.#output,
            title: this.#title,
            description: this.#description,
            value: this.#value,
            type: this.#type,
            parameters: this.#parameters,
            accepted: this.#accepted.toObject()
        }
    }
};