const assert = require('assert');
const main = require('../main.js');

describe.only('Translate intentions', function() {
    let iQuery = null;
    let target = null;
    let targetAccept = null;

    describe('Enable stats', function () {
        it ('should disable stats', function () {
            main.enableStats();
            main.setStatsInterval(500);
        });
        it ('Set dispatch interval', function () {
            main.storage.dispatchInterval = 500;
        });
        it('add linked storage by parameters', function() {
            const res = main.storage.addLink([{ type: 'WebAddress', value: 'localhost' }]);
            const linked = main.storage.links.get('localhost:10010');
            assert.strictEqual(linked.key, 'localhost:10010');
            assert.strictEqual(res, linked);
        });
    });

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
                        iStorage = intention;
                        done();
                        return;
                    }
                    if (status == 'data') {

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

    describe('Translation', function() {
        it('create counter translate intention', function () {
            target = main.create({
                title: 'test counter translate intention',
                input: 'TranslateTestOut',
                output: 'TranslateTestIn',
                onData: async (status, intention, value) => {
                    if (status == 'accept') {
                        targetAccept = {
                            intention: intention,
                            value: value
                        };
                    }

                }
            });
            assert.ok(target != null, 'source must be created');
            const intention = main.storage.get('TranslateTestOut - TranslateTestIn');
            assert.ok(intention != null, 'Target must be exists in storage');
        });
        it('Wait 1000 seconds', function (done) {
           setTimeout(function () {
               done();
           },1000);
        });
    });

    describe('Delete query intention', function () {
        it('delete linked storage by parameters', function() {
            main.storage.deleteLink([{ type: 'WebAddress', value: 'localhost' }]);
            const linked = main.storage.links.get('localhost');
            assert.strictEqual(linked, undefined);
        });

        it('should delete intention', function () {
            main.delete(iQuery, 'intention closed');
        })
    });

    describe('Disable stats', function () {
        it ('should disable stats', function () {
            main.disableStats();
        });

        it('disable dispatch interval', function () {
            main.storage.dispatchInterval = 0;
        });
    });

});