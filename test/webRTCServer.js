const assert = require('assert');
const { IntentionStorage } = require('../main.js');
const fs = require('fs');
const path = require('path');

/*process.on('unhandledRejection', function(reason, p) {
    console.log("Possibly Unhandled Rejection at: Promise ", p, " reason: ", reason);
});*/

describe('Intention WebRTC Server ', function() {
    let iQuery = null;
    let source = null;
    let target = null;
    let sourceAccept = null;
    let targetAccept = null;
    let intentionStorage = null;
    let intentionStorageServer = null;
    let sourceData = null;
    let targetData = null;
    const largeData = fs.readFileSync(path.resolve( __dirname, 'testFiles/musicCache.json')).toString();

    describe('Create Storage Server', function () {
        it ('Create storage server', async function () {
            intentionStorageServer = new IntentionStorage();
            const {webRTCAnswer} = await intentionStorageServer.createServer({ address: 'localhost', useWebRTC: true, useSocket: false });
            assert.notStrictEqual(webRTCAnswer, null);
            assert.notStrictEqual(webRTCAnswer.signalSocket, null);
        });

        it ('should enable stats', function () {
            intentionStorageServer.statsInterval = 500;
        });

        it ('Set dispatch interval', function () {
            intentionStorageServer.dispatchInterval = 500;
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
            const res = intentionStorage.addLink([{ name: 'WebAddress', value: 'localhost' }]);
            const linked = intentionStorage.links.get('localhost:10010');
            linked.waitForServerInterval = 500;
            assert.strictEqual(linked.key, 'localhost:10010');
            assert.strictEqual(res, linked);
        });

        it('automatic linked storage should be appeared at server', function(done) {
            this.timeout(4000);
            setTimeout(() => {
                const links = [...intentionStorageServer.links.values()];
                const target = links.find(l => l.origin == '127.0.0.1');
                assert.notStrictEqual(target, null, 'storage must exists');
                assert.strictEqual(target.handling,'auto');
                done();
            }, 3000);
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

    describe('Translation', function() {
        it('create test translate intention at server', function () {
            source = intentionStorageServer.createIntention({
                title: 'test translate intention',
                input: 'TranslateTestIn',
                output: 'TranslateTestOut',
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
            assert.strictEqual(source.origin, 'localhost');
            const intention = intentionStorageServer.intentions.byKey('TranslateTestIn - TranslateTestOut');
            assert.ok(intention != null, 'Source must be exists in storage');
        });

        it('create counter translate intention', function () {
            target = intentionStorage.createIntention({
                title: 'test counter translate intention',
                input: 'TranslateTestOut',
                output: 'TranslateTestIn',
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
            const intention = intentionStorage.intentions.byKey('TranslateTestOut - TranslateTestIn');
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
            assert.notStrictEqual(sourceAccept, null, 'Source must be accepted');
        });

        it('Intention must be accepted at clientStorage', function () {
            assert.notStrictEqual(targetAccept, null, 'Target must be accepted');
            assert.strictEqual(targetAccept.intention.origin, 'localhost');
            assert.strictEqual(target.accepted.size, 1);
        });
    });

    describe('Send data between intentions', function () {
        it('Intention from client must be appeared at server as NetworkIntention', function () {
            const intention = intentionStorageServer.intentions.byId(target.id);
            assert.strictEqual(intention.type, 'NetworkIntention');
        });

        it('Intention from server must be appeared at client as NetworkIntention', function () {
            const intention = intentionStorage.intentions.byId(source.id);
            assert.strictEqual(intention.type, 'NetworkIntention');
        });

        it('Send data from server', function () {
            source.accepted.send({ message: 'Test from server'});
        });

        it('Check at the client', function (done) {
            this.timeout(3000);
            setTimeout(() => {
                assert.strictEqual(targetData.message, 'Test from server');
                done();
            }, 2000);
        });

        it('Send data from client', function (done) {
            setTimeout(function () {
                assert.strictEqual(target.accepted.size, 1);
                target.accepted.send({ message: 'Test from client'});
                done();
            }, 1000);
        });

        it('Check at the server', function (done) {
            setTimeout(() => {
                assert.strictEqual(sourceData.message, 'Test from client');
                done();
            }, 1000);
        });
    });

    describe('Send large data between intentions', function () {
        it('Send data from server', function () {
            source.accepted.send({ data: largeData });
        });

        it('Check at the client', function (done) {
            this.timeout(11000);
            setTimeout(() => {
                assert.strictEqual(targetData.data, largeData);
                done();
            }, 10000);
        });

        it('Send data from client', function () {
            assert.strictEqual(target.accepted.size, 1);
            target.accepted.send({ data: largeData });
        });

        it('Check at the server', function (done) {
            this.timeout(11000);
            setTimeout(() => {
                assert.strictEqual(sourceData.data, largeData);
                done();
            }, 10000);
        });
    });

    describe('Shutdown server storage', function () {
        it('Close server linked storage channel', function () {
            const [link] = [...intentionStorageServer.links.values()];
            link.channel.close()
        });

        it('Intention from server must be disappeared at client', function (done) {
            setTimeout(function () {
                const intention = intentionStorage.intentions.byId(source.id);
                assert.strictEqual(intention, undefined);
                done();
            }, 500)
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


