const assert = require('assert');
const main = require('../main.js');

describe('Intension Storage', function() {
    describe('Linked storage by parameters', function() {
        it('add linked storage by parameters', function() {
            main.storage.addLink([{ type: 'WebAddress', value: 'localhost' }]);
            const linked = main.storage.links.get('localhost');
            assert.strictEqual(linked.origin, 'localhost');
        });

        it('delete linked storage by parameters', function() {
            main.storage.deleteLink([{ type: 'WebAddress', value: 'localhost' }]);
            const linked = main.storage.links.get('localhost');
            assert.strictEqual(linked, undefined);
        });
    });
});