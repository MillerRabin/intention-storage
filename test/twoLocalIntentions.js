const assert = require('assert');
const main = require('../main.js');
const intensionQuery = require('../intentionQuery.js');
describe('Intension Storage', function() {
    describe('Create Storage intension', function() {
        it('Should create', function() {
            const intension = main.storage.get('None - StorageIntensions');
            assert.ok(intension != null, 'intension must be exists');
        });
    });


    const updatedIntensions = [];
    describe('Query Intension', function() {
        let iQuery = null;
        let iStorage = null;
        it('Create query intension', function(done) {

            iQuery = main.create({
                title: 'Test query intension',
                input: 'StorageIntensions',
                output: 'None',
                onData: async (status, intension, value) => {
                    if (status == 'accept') {
                        iStorage = intension;
                        done();
                        return;
                    }

                    if (status == 'data') {

                        updatedIntensions.push(value);
                    }

                }
            });
            assert.ok(iQuery != null, 'Intension must be created');
        });

        it('Query intension must be accepted', function() {
            assert.ok(iStorage != null, 'Intension must be accepted');
        });
    });

    describe('Intensions', function() {
        let source = null;
        let target = null;
        let sourceAccept = null;
        let targetAccept = null;
        let sourceClose = null;
        it('create test intension', function() {
            source = main.create({
               title: 'test intension',
               input: 'TestIn',
               output: 'TestOut',
               onData: async (status, intension, value) => {
                    if (status == 'accept') {
                        sourceAccept = {
                            intension: intension,
                            value: value
                        };
                    }
                    if (status == 'close')
                        sourceClose = {
                            intension: intension,
                            value: value
                        }
               }
            });
            assert.ok(source != null, 'source must be created');
            const intension = main.storage.get('TestIn - TestOut');
            assert.ok(intension != null, 'Source must be exists in storage');
        });
        it('create counter intension', function () {
            assert.ok(source != null);
            target = main.create({
                title: 'test counter intension',
                input: 'TestOut',
                output: 'TestIn',
                onData: async (status, intension, value) => {
                    if (status == 'accept') {
                        targetAccept = {
                            intension: intension,
                            value: value
                        };
                    }

                }
            });
            assert.ok(target != null, 'source must be created');
            const intension = main.storage.get('TestOut - TestIn');
            assert.ok(intension != null, 'Target must be exists in storage');
        });
        it('source must be accepted', function (done) {
            setTimeout(() => {
                const key = sourceAccept.intension.getKey();
                const iobj = updatedIntensions[1];
                console.log(updatedIntensions);
                assert.strictEqual(key, 'TestOut - TestIn');
                done()
            });
        });
        it('target must be accepted', function () {
            assert.strictEqual(targetAccept.intension.getKey(),'TestIn - TestOut');
        });
        it('intensions must exists', function () {
            const list = intensionQuery.query(main.storage, {});
            assert.strictEqual(list.length, 4);
        });
        it('delete accepted target intension', function () {
            main.delete(target, { message: 'target is deleted'});
            const list = intensionQuery.query(main.storage, {});
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