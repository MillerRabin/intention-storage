const safe = require('./core/safe.js');
const AcceptedIntentions = require('./AcceptedIntentions.js');

module.exports = class NetworkIntention {
    constructor ({
                     id,
                     createTime,
                     title,
                     description,
                     origin,
                     input,
                     output,
                     parameters = [],
                     value,
                     storageLink
                 }) {
        if (safe.isEmpty(title)) throw new Error('Network Intention must have a title');
        if (safe.isEmpty(input)) throw new Error('Network Intention must have an input parameter');
        if (safe.isEmpty(output)) throw new Error('Network Intention must have an output parameters');
        if (safe.isEmpty(createTime)) throw new Error('Network Intention must have createTime');
        if (safe.isEmpty(id)) throw new Error('Network Intention must have an id');
        if (!Array.isArray(parameters)) throw new Error('Parameters must be array');
        if (input == output) throw new Error('Input and Output can`t be the same');
        if (storageLink == null) throw new Error('Storage link must be exists');

        this._createTime = createTime;
        this._updateTime = new Date();
        this._title = title;
        this._description = description;
        this._input = input;
        this._output = output;
        this._origin = storageLink.key;
        this._parameters = parameters;
        this._id = id;
        this._value = value;
        this._storage = null;
        this._storageLink = storageLink;
        this._accepted = new AcceptedIntentions(this);
        this._type = 'NetworkIntention';
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
    get storageLink() {
        return this._storageLink;
    }

    get type() {
        return this._type;
    }

    async send(status, intention, data) {
        if (intention.toObject == null) throw new Error('Intention must not be null');
        try {
            return await this._storageLink.sendObject({
                command: 'message',
                version: 1,
                status: status,
                id: this.id,
                intention: intention.toObject(),
                data: data
            });
        } catch (e) {
            if (status != 'error')
                return await this._storageLink.sendObject({
                    command: 'message',
                    version: 1,
                    status: 'error',
                    id: this.id,
                    intention: intention.toObject(),
                    data: e
                });
            console.log(e);
        }
    }
    async sendError(error) {
        return await this.send('error', this, error);
    }
    async accept(intention) {
        return await this.send('accept', intention);
    }

    async close(intention, message) {
        return await this.send('close', intention, message);
    }

    get accepted() {
        return this._accepted;
    }

    toObject() {
        return {
            id: this._id,
            createTime: this.createTime,
            updateTime: this.updateTime,
            key: this.getKey(),
            input: this._input,
            output: this._output,
            title: this._title,
            description: this._description,
            value: this._value,
            type: this._type,
            origin: this._origin
        }
    }
};