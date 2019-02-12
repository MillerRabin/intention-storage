const assert = require('assert');
const main = require('../main.js');
const intentionQuery = require('../intentionQuery.js');
describe('Intention Storage', function() {
    describe('Enable stats', function () {
        it ('should disable stats', function () {
            main.enableStats();
            main.setStatsInterval(500);
        })
    });

    describe('Create Storage intention', function() {
        it('Should create', function() {
            const intention = main.storage.get('None - StorageStats');
            assert.ok(intention != null, 'intention must be exists');
        });
    });

    const updatedIntentions = [];
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
                        iStorage = intention;
                        done();
                        return;
                    }
                    if (status == 'data') {
                        if (value.updatedIntentions != null)
                            updatedIntentions.push(...value.updatedIntentions);
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

    describe('Intentions', function() {
        let source = null;
        let target = null;
        let sourceAccept = null;
        let targetAccept = null;
        let sourceClose = null;
        it('create test intention', function() {
            source = main.create({
               title: 'test intention',
               input: 'TestIn',
               output: 'TestOut',
               onData: async (status, intention, value) => {
                    if (status == 'accept') {
                        sourceAccept = {
                            intention: intention,
                            value: value
                        };
                    }
                    if (status == 'close')
                        sourceClose = {
                            intention: intention,
                            value: value
                        }
               }
            });
            assert.ok(source != null, 'source must be created');
            const intention = main.storage.get('TestIn - TestOut');
            assert.ok(intention != null, 'Source must be exists in storage');
        });
        it('create counter intention', function () {
            assert.ok(source != null);
            target = main.create({
                title: 'test counter intention',
                input: 'TestOut',
                output: 'TestIn',
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
            const intention = main.storage.get('TestOut - TestIn');
            assert.ok(intention != null, 'Target must be exists in storage');
        });
        it('source must be accepted', function (done) {
            setTimeout(() => {
                const key = sourceAccept.intention.getKey();
                assert.strictEqual(key, 'TestOut - TestIn');
                done();
            }, 0);
        });
        it('target must be accepted', function () {
            assert.strictEqual(targetAccept.intention.getKey(),'TestIn - TestOut');
        });
        it('Stats has been sended accept status for source and target', function (done) {
            this.timeout(3000);
            setTimeout(() => {
                const tito = updatedIntentions.find(v => v.intention.key == 'TestIn - TestOut');
                const toti = updatedIntentions.find(v => v.intention.key == 'TestOut - TestIn');
                assert.ok(toti != null, 'TestIn - TestOut must exists');
                assert.ok(tito != null, 'TestOut - TestIn');
                assert.strictEqual(toti.status, 'accept');
                assert.strictEqual(tito.status, 'accept');
                updatedIntentions.length = 0;
                done();
            }, 2000);
        });
        it('intentions must exists', function () {
            const list = intentionQuery.queryIntentions(main.storage, {});
            assert.strictEqual(list.length, 4);
        });
        it('delete accepted target intention', function () {
            main.delete(target, { message: 'target is deleted'});
            const list = intentionQuery.queryIntentions(main.storage, {});
            assert.strictEqual(list.length, 3);
        });
        it('source must receive close message', function (done) {
            setTimeout(() => {
                assert.strictEqual(sourceClose.value.message,'target is deleted');
                done();
            });
        });
        it('target must be removed from source accepted list', function () {
            assert.strictEqual(source.accepted.size, 0);
        });
        it('source must be removed from target accepted list', function () {
            assert.strictEqual(target.accepted.size, 0);
        });
        it('Stats has been sended close status for target', function (done) {
            this.timeout(1000);
            setTimeout(() => {
                const toti = updatedIntentions.find(v => v.intention.key == 'TestOut - TestIn');
                assert.ok(toti != null, 'TestOut - TestIn must exists');
                assert.strictEqual(toti.status, 'closed');
                updatedIntentions.length = 0;
                done();
            }, 500);
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
       })
    });
});