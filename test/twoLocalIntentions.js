const assert = require('assert');
const main = require('../main.js');
const intentionQuery = require('../intentionQuery.js');
describe('Intention Storage', function() {
    describe('Create Storage intention', function() {
        it('Should create', function() {
            const intention = main.storage.get('None - StorageIntentions');
            assert.ok(intention != null, 'intention must be exists');
        });
    });


    const updatedIntentions = [];
    describe('Query Intention', function() {
        let iQuery = null;
        let iStorage = null;
        it('Create query intention', function(done) {

            iQuery = main.create({
                title: 'Test query intention',
                input: 'StorageIntentions',
                output: 'None',
                onData: async (status, intention, value) => {
                    if (status == 'accept') {
                        iStorage = intention;
                        done();
                        return;
                    }

                    if (status == 'data') {

                        updatedIntentions.push(value);
                    }

                }
            });
            assert.ok(iQuery != null, 'Intention must be created');
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
                const iobj = updatedIntentions[1];
                console.log(updatedIntentions);
                assert.strictEqual(key, 'TestOut - TestIn');
                done()
            });
        });
        it('target must be accepted', function () {
            assert.strictEqual(targetAccept.intention.getKey(),'TestIn - TestOut');
        });
        it('intentions must exists', function () {
            const list = intentionQuery.query(main.storage, {});
            assert.strictEqual(list.length, 4);
        });
        it('delete accepted target intention', function () {
            main.delete(target, { message: 'target is deleted'});
            const list = intentionQuery.query(main.storage, {});
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
    });

});