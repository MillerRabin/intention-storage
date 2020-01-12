const safe = require('./core/safe.js');
const AcceptedIntentions = require('./AcceptedIntentions.js');

module.exports = class IntentionAbstract {
    constructor ({
                     title,
                     description,
                     input,
                     output,
                     parameters = [],
                     value,
                     accepted
                 }) {
        if (safe.isEmpty(title)) throw new Error('Intention must have a title');
        if (safe.isEmpty(input)) throw new Error('Intention must have an input parameter');
        if (safe.isEmpty(output)) throw new Error('Intention must have an output parameters');
        if (!Array.isArray(parameters)) throw new Error('Parameters must be array');
        if (input == output) throw new Error('Input and Output can`t be the same');

        this._updateTime = new Date();
        this._title = title;
        this._description = description;
        this._input = input;
        this._output = output;
        this._parameters = parameters;
        this._value = value;
        this._accepted = new AcceptedIntentions(this, accepted);
        this._type = 'IntentionAbstract';
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
    get description() {
        return this._description;
    }
    get title() {
        return this._title;
    }
    get updateTime() {
        return this._updateTime;
    }
    get value() {
        return this._value;
    }
    get type() {
        return this._type;
    }

    get accepted() {
        return this._accepted;
    }

    toObject() {
        return {
            id: this._id,
            updateTime: this.updateTime,
            key: this.getKey(),
            input: this._input,
            output: this._output,
            title: this._title,
            description: this._description,
            value: this._value,
            type: this._type,
            parameters: this._parameters,
            accepted: this._accepted.toObject()
        }
    }
};