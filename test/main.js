const assert = require('assert');
const main = require('../main.js');
const intensionQuery = require('../intensionQuery.js');

describe('Intension Storage', function() {
    describe('#Create Storage Server', function() {
        it('should create', function() {
            const intension = main.storage.get('None - InterfaceObject');
            assert.ok(intension != null, 'intension must be exists');
        });
    });
    describe('#Create intensions', function() {
        let source = null;
        let target = null;
        let sourceAccept = null;
        let targetAccept = null;
        let sourceClose = null;
        it('should create', function() {
            source = main.create({
               title: 'test intension',
               input: 'TestIn',
               output: 'TestOut',
               onData: async (status, intension, value) => {
                    if (status == 'accept')
                        sourceAccept = {
                            intension: intension,
                            value: value
                        };
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
        it('#Create counter intension', function () {
            assert.ok(source != null);
            target = main.create({
                title: 'test intension',
                input: 'TestOut',
                output: 'TestIn',
                onData: async (status, intension, value) => {
                    if (status == 'accept')
                        targetAccept = {
                            intension: intension,
                            value: value
                        }
                }
            });
            assert.ok(target != null, 'source must be created');
            const intension = main.storage.get('TestOut - TestIn');
            assert.ok(intension != null, 'Target must be exists in storage');
        });
        it('#Source must be accepted', function (done) {
            setTimeout(function () {
                assert.strictEqual(sourceAccept.intension.getKey(), 'TestOut - TestIn');
                done();
            });

        });
        it('#Target must be accepted', function (done) {
            setTimeout(function () {
                assert.strictEqual(targetAccept.intension.getKey(),'TestIn - TestOut');
                done();
            });

        });
        it('#Query intension', function () {
            const list = intensionQuery.query(main.storage, {});
            assert.ok(list.length == 3);
        });
        it('#Delete accepted target intension', function () {
            main.delete(target, { message: 'target is deleted'});
            const list = intensionQuery.query(main.storage, {});
            assert.ok(list.length == 2);
        });
        it('#Source must receive close message', function (done) {
            setTimeout(() => {
                assert.ok(sourceClose.value.message == 'target is deleted');
                done();
            });
        });
        it('#Target must be removed from source accepted list', function () {
            assert.strictEqual(source.accepted.size, 0);
        });
        it('#Source must be removed from target accepted list', function () {
            assert.strictEqual(target.accepted.size, 0);
        });
    });

});