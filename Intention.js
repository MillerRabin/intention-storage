const safe = require('./core/safe.js');
const uuid = require('./core/uuid.js');
const AcceptedIntentions = require('./AcceptedIntentions.js');

function getOrigin() {
    try {
        return window.location.host;
    } catch (e) {
        return 'local';
    }
}

function update(intention, status) {
    intention._updateTime = new Date();
    try {
        if (intention._onUpdate) intention._onUpdate(intention, status);
    } catch (e) {
        console.log(e);
    }
}

async function accept(source, target) {
    if (source._accepted.has(target)) return;
    if (target._accepted.has(source)) return;
    let tData = null;
    let sData = null;
    try {
        try {
            sData = await source.send('accept', target);
        } catch (e) {
            target.sendError(e);
            throw e;
        }
        try {
            tData = await target.send('accept', source);
        } catch (e) {
            source.sendError(e);
            throw e;
        }
        source._accepted.set(target);
        update(source, 'accept');
        target._accepted.set(source);
        update(target, 'accept');
        if (tData != null) source.send('data', target, tData);
        if (sData != null) target.send('data', source, sData);
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
        onUpdate,
        parameters = []
    }) {
        if (safe.isEmpty(title)) throw new Error('Intention must have a title');
        if (safe.isEmpty(input)) throw new Error('Intention must have an input parameters');
        if (safe.isEmpty(output)) throw new Error('Intention must have an output parameters');
        if (typeof(onData) != 'function') throw new Error('Intention onData must be an async function');
        if (!Array.isArray(parameters)) throw new Error('Parameters must be array');
        if (input == output) throw new Error('Input and Output can`t be the same');

        this._createTime = new Date();
        this._updateTime = new Date();
        this._title = title;
        this._description = description;
        this._input = input;
        this._output = output;
        this._origin = getOrigin();
        this._onData = onData;
        this._parameters = parameters;
        this._id = uuid.generate();
        this._accepted = new AcceptedIntentions(this);
        this._onUpdate = onUpdate;
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
    async send(status, intention, data) {
        return await this._onData(status, intention, data);
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
            update(intention, 'close');
        }
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
            accepted: this._accepted.toObject()
        }
    }
};