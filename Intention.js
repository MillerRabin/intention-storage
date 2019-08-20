const safe = require('./core/safe.js');
const uuid = require('./core/uuid.js');
const AcceptedIntentions = require('./AcceptedIntentions.js');

function update(intention, status) {
    intention._updateTime = new Date();
    intention._storage._query.updateIntention(intention, status);
}

async function accept(source, target) {
    if (source._accepted.has(target)) return;
    if (target._accepted.has(source)) return;
    source._accepted.set(target);
    target._accepted.set(source);
    let tData = null;
    let sData = null;
    try {
        try {
            sData = await source.send('accept', target);
        } catch (e) {
            source._accepted.delete(target);
            target._accepted.delete(source);
            target.sendError(e);
            return;
        }
        try {
            tData = await target.send('accept', source);
        } catch (e) {
            source._accepted.delete(target);
            target._accepted.delete(source);
            source.sendError(e);
            return;
        }
        update(source, 'accept');
        update(target, 'accept');
        if (tData != null) await source.send('data', target, tData);
        if (sData != null) await target.send('data', source, sData);
    } catch (e) {
        console.log(e);
    }
}

module.exports = class Intention {
    constructor ({
        title,
        description,
        input,
        output,
        onData,
        parameters = [],
        value,
        storage
    }) {
        if (safe.isEmpty(title)) throw new Error('Intention must have a title');
        if (safe.isEmpty(input)) throw new Error('Intention must have an input parameters');
        if (safe.isEmpty(output)) throw new Error('Intention must have an output parameters');
        if (storage == null) throw new Error('Intention must have a storage');
        if (typeof(onData) != 'function') throw new Error('Intention onData must be an async function');
        if (!Array.isArray(parameters)) throw new Error('Parameters must be array');
        if (input == output) throw new Error('Input and Output can`t be the same');

        this._createTime = new Date();
        this._updateTime = new Date();
        this._title = title;
        this._description = description;
        this._input = input;
        this._output = output;
        this._origin = null;
        this._onData = onData;
        this._parameters = parameters;
        this._id = uuid.generate();
        this._accepted = new AcceptedIntentions(this);
        this._value = value;
        this._storage = storage;
        this._type = 'Intention';
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
        if (this._storage._storageServer != null)
            return this._storage._storageServer.key;
        return this._origin;
    }
    get description() {
        return this._description;
    }
    get title() {
        return this._title;
    }
    get accepted() {
        return this._accepted;
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
    get type() {
        return this._type;
    }

    async send(status, intention, data) {
        try {
            return await this._onData(status, intention, data);
        } catch (e) {
            return await intention.send('error', this, e);
        }
    }

    async sendError(error) {
        return await this._onData('error', this, error);
    }

    async accept(intention) {
        return await accept(this, intention);
    }

    async close(intention, info) {
        try {
            return await this._onData('close', intention, info);
        }
        catch (e) {
            console.log(e);
        }
        finally {
            this._accepted.delete(intention);
            update(intention, 'closed');
        }
    }
    dispatch() {
        this._storage._dispatchWait.add(this);
    }

    toObject() {
        return {
            id: this._id,
            type: this._type,
            createTime: this.createTime,
            updateTime: this.updateTime,
            key: this.getKey(),
            input: this._input,
            output: this._output,
            origin: this.origin,
            title: this._title,
            description: this._description,
            accepted: this._accepted.toObject(),
            value: this._value,
            parameters: this._parameters
        }
    }
};