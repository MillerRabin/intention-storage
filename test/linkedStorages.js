const assert = require('assert');
const main = require('../main.js');

describe('Intension Storage', function() {
    describe('Linked storage by parameters', function() {
        it('add linked storage by parameters', function() {
            const res = main.storage.addLink([{ type: 'WebAddress', value: 'localhost' }]);
            const linked = main.storage.links.get('localhost');
            assert.strictEqual(linked.origin, 'localhost');
            assert.strictEqual(res, 'localhost');
        });

        it('delete linked storage by parameters', function() {
            const res = main.storage.deleteLink([{ type: 'WebAddress', value: 'localhost' }]);
            const linked = main.storage.links.get('localhost');
            assert.strictEqual(linked, undefined);
            assert.strictEqual(res, 'localhost');
        });
    });
});