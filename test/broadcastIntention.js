const assert = require('assert');
const { IntentionStorage } = require('../main.js');

describe('Broadcast intentions', function() {
    let iQuery = null;
    let source = null;
    let target = null;
    let sourceAccept = null;
    let targetAccept = null;
    let intentionStorage = null;
    let intentionStorageServer = null;
    let sourceData = null;
    let targetData = null;


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

        it ('Set dispatch interval', function () {
            intentionStorageServer.lifeTime = 500;
        });

        it('Create server', function() {
            intentionStorageServer.createServer({ address: 'localhost'});
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

        it ('Set dispatch interval', function () {
            intentionStorage.lifeTime = 500;
        });

        it('add linked storage by parameters', function() {
            const res = intentionStorage.addLink([{ name: 'WebAddress', value: 'localhost' }]);
            const linked = intentionStorage.links.get('localhost:10010');
            linked.waitForServerInterval = 500;
            assert.strictEqual(linked.key, 'localhost:10010');
            assert.strictEqual(res, linked);
        });

        it('automatic linked storage should be appeared at server', function(done) {
            setTimeout(() => {
                const links = [...intentionStorageServer.links.values()];
                const target = links.find(l => l.origin == '::ffff:127.0.0.1');
                assert.ok(target != null, 'storage must exists');
                assert.strictEqual(target.handling,'auto');
                done();
            }, 1000);
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
                    if (status == 'accepted') {
                        if (intention.type != 'Intention') return;
                        iStorage = intention;
                        done();
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

    describe('Broadcasting', function() {
        it('create test broadcast intention at server', function () {
            source = intentionStorageServer.createIntention({
                title: 'Test broadcasting intention',
                input: 'BroadcastTestIn',
                output: 'BroadcastTestOut',
                onData: async (status, intention, value) => {
                    if (status == 'accepted') {
                        sourceAccept = {
                            intention: intention,
                            value: value
                        };
                        return;
                    }

                    if (status == 'data') {
                        sourceData = value;
                    }
                }
            });
            assert.ok(source != null, 'Source must be created');
            assert.strictEqual(source.origin, 'ws://localhost:10010');
            const intention = intentionStorageServer.intentions.byKey('BroadcastTestIn - BroadcastTestOut');
            assert.ok(intention != null, 'Source must be exists in storage');
        });

        it('create counter broadcast intention', function () {
            target = intentionStorage.createIntention({
                title: 'test counter broadcast intention',
                input: 'BroadcastTestOut',
                output: 'BroadcastTestIn',
                onData: async (status, intention, value) => {
                    if (status == 'accepted') {
                        targetAccept = {
                            intention: intention,
                            value: value
                        };
                        return;
                    }

                    if (status == 'data') {
                        targetData = value;
                    }
                }
            });
            assert.ok(target != null, 'Target must be created');
            const intention = intentionStorage.intentions.byKey('BroadcastTestOut - BroadcastTestIn');
            assert.ok(intention != null, 'Target must be exists in storage');
        });

        it('Wait 1000 seconds', function (done) {
            setTimeout(function () {
               done();
           },1000);
        });
    });

    describe('Check statuses', function () {
        it('Intention must be accepted at serverStorage', function () {
            assert.ok(sourceAccept != null, 'Source must be accepted');
        });

       it('Intention must be accepted at clientStorage', function () {
           assert.ok(targetAccept != null, 'Target must be accepted');
           assert.strictEqual(targetAccept.intention.origin, 'ws://localhost:10010');
       });
    });

    describe('Send data between intentions', function () {
        it('Intention from client must be appeared at server as NetworkIntention', function () {
            const intention = intentionStorageServer.intentions.byId(target.id);
            assert.strictEqual(intention.type, 'NetworkIntention');
        });

        it('Send data from server', function () {
            source.accepted.send({ message: 'Test from server'});
        });

        it('Check at the client', function (done) {
            setTimeout(() => {
                assert.strictEqual(targetData.message, 'Test from server');
                done();
            }, 500);
        });

        it('Send data from client', function () {
            target.accepted.send({ message: 'Test from client'});
        });

        it('Check at the server', function (done) {
            setTimeout(() => {
                assert.strictEqual(sourceData.message, 'Test from client');
                done();
            }, 500);
        });
    });

    describe('Delete query intention', function () {
        it('delete target intention', function () {
            intentionStorage.deleteIntention(target, { message: 'target is deleted'});
        });

        it('delete linked storage by parameters', function() {
            intentionStorage.deleteLink([{ name: 'WebAddress', value: 'localhost' }]);
            const linked = intentionStorage.links.get('localhost');
            assert.strictEqual(linked, undefined);
        });

        it('should delete intention', function () {
            intentionStorage.deleteIntention(iQuery, 'intention closed');
        })
    });

    describe('Close client', function () {
        it ('should close', function () {
            intentionStorage.close();
        });
    });

    describe('Close server', function () {
        it ('should close', function () {
            intentionStorageServer.close();
        });
    });
});
