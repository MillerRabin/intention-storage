const safe = require('./core/safe.js');

module.exports = class NetworkIntention {
    constructor ({
                     id,
                     createTime,
                     title,
                     description,
                     input,
                     output,
                     origin,
                     parameters = [],
                     value,
                     storage
                 }) {
        if (safe.isEmpty(title)) throw new Error('Network Intention must have a title');
        if (safe.isEmpty(input)) throw new Error('Network Intention must have an input parameter');
        if (safe.isEmpty(output)) throw new Error('Network Intention must have an output parameters');
        if (safe.isEmpty(createTime)) throw new Error('Network Intention must have createTime');
        if (safe.isEmpty(id)) throw new Error('Network Intention must have an id');
        if (safe.isEmpty(storage)) throw new Error('Network Intention must have storage parameter');
        if (!Array.isArray(parameters)) throw new Error('Parameters must be array');
        if (input == output) throw new Error('Input and Output can`t be the same');

        this._createTime = createTime;
        this._updateTime = this._createTime;
        this._title = title;
        this._description = description;
        this._input = input;
        this._output = output;
        this._origin = origin;
        this._parameters = parameters;
        this._id = id;
        this._value = value;
        this._storage = storage;
    }
    getKey(reverse = false) {
        return (!reverse) ? `${ this._input } - ${ this._output }` : `${ this._output } - ${ this._input }`;
    }
    get parameters() {
        return this._parameters;
    }
    get input() {
        return this._input;
    }
    get output() {
        return this._output;
    }
    get origin() {
        return this._origin;
    }
    get description() {
        return this._description;
    }
    get title() {
        return this._title;
    }
    get updateTime() {
        return this._updateTime;
    }
    get createTime() {
        return this._createTime;
    }
    get id() {
        return this._id;
    }
    get value() {
        return this._value;
    }
    async send(status, intention, data) {
        try {
            return await this._storage.send(status, intention, data)
        } catch (e) {
            return await intention.send('error', this, e);
        }
    }
    async sendError(error) {
        return await this.send('error', this, error);
    }
    async accept(intention) {
        return await this.send('accept', this, intention);
    }

    toObject() {
        return {
            id: this._id,
            createTime: this.createTime,
            updateTime: this.updateTime,
            key: this.getKey(),
            input: this._input,
            output: this._output,
            origin: this._origin,
            title: this._title,
            description: this._description,
            value: this._value
        }
    }
};