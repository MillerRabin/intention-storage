export default class IntentionError extends Error {
    constructor({message, code, detail}) {
        if ((message == null) || (message == '')) throw new Error('Message can`t be empty');
        if ((code == null) || (code == '')) throw new Error('Code can`t be empty');
        super(message);
        this.code = code;
        this.detail = detail;
    }
};