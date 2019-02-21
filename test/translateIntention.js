const assert = require('assert');
const { IntentionStorage } = require('../main.js');

describe.only('Translate intentions', function() {
    let iQuery = null;
    let target = null;
    let targetAccept = null;
    let intentionStorage = null;
    let intentionStorageServer = null;

    describe('Create Storage Server', function () {
        it ('Create storage', function () {
            intentionStorageServer = new IntentionStorage();
        });

        it ('should enable stats', function () {
            intentionStorageServer.statsInterval = 500;
        });

        it ('Set dispatch interval', function () {
            intentionStorageServer.dispatchInterval = 500;
        });

        it('Create server', function() {
            intentionStorageServer.createServer();
        });
    });


    describe('Create Storage Client', function () {
        it ('Create storage', function () {
            intentionStorage = new IntentionStorage();
        });

        it ('should enable stats', function () {
            intentionStorage.statsInterval = 500;
        });

        it ('Set dispatch interval', function () {
            intentionStorage.dispatchInterval = 500;
        });

        it('add linked storage by parameters', function() {
            const res = intentionStorage.addLink([{ type: 'WebAddress', value: 'localhost' }]);
            const linked = intentionStorage.links.get('localhost:10010');
            assert.strictEqual(linked.key, 'localhost:10010');
            assert.strictEqual(res, linked);
        });
    });

    describe('Query Intention', function() {
        let iStorage = null;
        it('Create query intention', function(done) {
            iQuery = intentionStorage.createIntention({
                title: 'Test query intention',
                input: 'StorageStats',
                output: 'None',
                value: 'test',
                onData: async (status, intention) => {
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
            target = intentionStorage.createIntention({
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
            const intention = intentionStorage.get('TranslateTestOut - TranslateTestIn');
            assert.ok(intention != null, 'Target must be exists in storage');
        });
        it('Wait 1000 seconds', function (done) {
            setTimeout(function () {
               done();
           },1000);
        });
    });

    describe('Delete query intention', function () {
        it('delete target intention', function () {
            intentionStorage.deleteIntention(target, { message: 'target is deleted'});
        });

        it('delete linked storage by parameters', function() {
            intentionStorage.deleteLink([{ type: 'WebAddress', value: 'localhost' }]);
            const linked = intentionStorage.links.get('localhost');
            assert.strictEqual(linked, undefined);
        });

        it('should delete intention', function () {
            intentionStorage.deleteIntention(iQuery, 'intention closed');
        })
    });

    describe('Disable stats at client', function () {
        it ('should disable stats', function () {
            intentionStorage.statsInterval = 0;
        });

        it('disable dispatch interval', function () {
            intentionStorage.dispatchInterval = 0;
        });
    });

    describe('Disable stats at server', function () {
        it ('should disable stats', function () {
            intentionStorageServer.statsInterval = 0;
        });

        it('disable dispatch interval', function () {
            intentionStorageServer.dispatchInterval = 0;
        });

        it('close Server', function () {
            intentionStorageServer.closeServer();
        });
    });
});