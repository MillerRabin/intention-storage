const assert = require('assert');
const main = require('../main.js');

describe('Intention Storage', function() {
    describe('Enable stats', function () {
        it ('should disable stats', function () {
            main.enableStats();
            main.setStatsInterval(500);
        });
        it ('Set dispatch interval', function () {
            main.storage.dispatchInterval = 500;
        });
    });

    const updatedStorages = [];
    let iQuery = null;
    describe('Query Intention', function() {
        let iStorage = null;
        it('Create query intention', function(done) {
            iQuery = main.create({
                title: 'Test query intention',
                input: 'StorageStats',
                output: 'None',
                value: 'test',
                onData: async (status, intention, value) => {
                    if (status == 'accept') {
                        if (iStorage == null) {
                            iStorage = intention;
                            done();
                        }
                        return;
                    }
                    if (status == 'data') {
                        if (value.updatedStorages != null)
                            updatedStorages.push(...value.updatedStorages);
                    }
                }
            });
            assert.ok(iQuery != null, 'Intention must be created');
            assert.strictEqual(iQuery.value, 'test');
        });

        it('Query intention must be accepted', function() {
            assert.ok(iStorage != null, 'Intention must be accepted');
        });
    });


    describe('Linked storage by parameters', function() {
        it('add linked storage by parameters', function() {
            const res = main.storage.addLink([{ type: 'WebAddress', value: 'localhost' }]);
            const linked = main.storage.links.get('localhost:10010');
            assert.strictEqual(linked.origin, 'localhost');
            assert.strictEqual(res, linked);
        });

        it('Storage has been sended in stats', function (done) {
            this.timeout(1000);
            setTimeout(() => {
                const loc = updatedStorages.find(v => v.storage.origin == 'localhost');
                assert.strictEqual(loc.storage.origin, 'localhost');
                updatedStorages.length = 0;
                done();
            }, 500);
        });

        it('delete linked storage by parameters', function() {
            main.storage.deleteLink([{ type: 'WebAddress', value: 'localhost' }]);
            const linked = main.storage.links.get('localhost');
            assert.strictEqual(linked, undefined);
        });
    });

    describe('Delete query intention', function () {
        it('should disable stats', function () {
            main.delete(iQuery, 'intention closed');
        })
    });

    describe('Disable stats', function () {
        it ('should disable stats', function () {
            main.disableStats();
        });

        it ('disable dispatch interval', function () {
            main.storage.dispatchInterval = 0;
        });
    });
});