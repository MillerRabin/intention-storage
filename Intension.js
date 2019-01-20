const safe = require('./core/safe.js');
const uuid = require('./core/uuid.js');
const AcceptedIntensions = require('./AcceptedIntensions.js');

function getOrigin() {
    try {
        return window.location.host;
    } catch (e) {
        return 'localhost';
    }
}

async function accept(source, target) {
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
        source.accepted.set(target);
        target.accepted.set(source);
        if (tData != null) source.send('data', target, tData);
        if (sData != null) target.send('data', source, sData);
    } catch (e) {
        console.log(e);
    }

}

module.exports = class Intension {
    constructor ({
        title,
        description,
        input,
        output,
        onData,
        parameters = []
    }) {
        if (safe.isEmpty(title)) throw new Error('Intension must have a title');
        if (safe.isEmpty(input)) throw new Error('Intension must have an input parameters');
        if (safe.isEmpty(output)) throw new Error('Intension must have an output parameters');
        if (typeof(onData) != 'function') throw new Error('Intension onData must be an async function');
        if (!Array.isArray(parameters)) throw new Error('Parameters must be array');

        this.time = new Date();
        this.title = title;
        this.description = description;
        this.input = input;
        this.output = output;
        this.origin = getOrigin();
        this.onData = onData;
        this.parameters = parameters;
        this.id = uuid.generate();
        this.accepted = new AcceptedIntensions(this);
    }
    getKey(reverse = false) {
        return (!reverse) ? `${ this.input } - ${ this.output }` : `${ this.output } - ${ this.input }`;
    }
    getParameters() {
        return this.parameters;
    }
    async send(status, intension, data) {
        return await this.onData(status, intension, data);
    }
    async sendError(error) {
        return await this.onData('error', this, error);
    }
    async accept(intension) {
        return await accept(this, intension);
    }
    async close(intension, info) {
        try {
            return await this.onData('close', intension, info);
        }
        finally {
            this.accepted.delete(intension);
        }
    }
    toObject() {
        return {
            id: this.id,
            time: this.time,
            key: this.getKey(),
            input: this.input,
            output: this.output,
            origin: this.origin,
            title: this.title,
            accepted: this.accepted.toObject()
        }
    }
};