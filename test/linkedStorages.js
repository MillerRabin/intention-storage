import assert from 'assert';
import main from "../main.js";
const { IntentionStorage } = main;

describe('Linked Storages', function() {
    let intentionStorage = null;
    describe('Create intention storage', function () {
        it ('Create storage', function () {
            intentionStorage = new IntentionStorage();
        });

        it('should enable stats', function () {
            intentionStorage.statsInterval = 500;
        });

        it('Set dispatch interval', function () {
            intentionStorage.dispatchInterval = 500;
        });
    });

    const updatedStorages = [];
    let iQuery = null;

    describe('Query Intention', function() {
        let iStorage = null;
        it('Create query intention', function(done) {
            iQuery = intentionStorage.createIntention({
                title: 'Test query intention',
                input: 'StorageStats',
                output: 'None',
                value: 'test',
                onData: async (status, intention, value) => {
                    if (status == 'accepting') {
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


    describe('Linked storage by webaddress', function() {
        it('add linked storage by webaddress', function() {
            const res = intentionStorage.addLink([{ name: 'WebAddress', value: 'localhost' }]);
            const linked = intentionStorage.links.get('localhost:10010');
            linked.waitForServerInterval = 500;
            assert.strictEqual(linked.key, 'localhost:10010');
            assert.strictEqual(res, linked);
        });

        it('Storage has been sent in stats', function (done) {
            this.timeout(1000);
            setTimeout(() => {
                const loc = updatedStorages.find(v => v.storage.origin == 'localhost');
                assert.strictEqual(loc.storage.origin, 'localhost');
                updatedStorages.length = 0;
                done();
            }, 500);
        });

        it('delete linked storage by webaddress', function() {
            intentionStorage.deleteLink([{ name: 'WebAddress', value: 'localhost' }]);
            const linked = intentionStorage.links.get('localhost');
            assert.strictEqual(linked, undefined);
        });
    });

    describe('Linked storage by ipaddress and port', function() {
        it('add linked storage by ipaddress', function() {
            const res = intentionStorage.addLink([{ name: 'IPAddress', value: '192.168.1.5' }, { name: 'IPPort', value: '1515'}]);
            const linked = intentionStorage.links.get('192.168.1.5:1515');
            linked.waitForServerInterval = 500;
            assert.strictEqual(linked.key, '192.168.1.5:1515');
            assert.strictEqual(res, linked);
        });

        it('add linked storage with same parameters must fails', function() {
            try {
                intentionStorage.addLink([{ name: 'IPAddress', value: '192.168.1.5' }, { name: 'IPPort', value: '1515'}]);
                assert.fail('Storage must not created');
            } catch (e) {
                assert.strictEqual(e.detail.link.key, '192.168.1.5:1515');
            }
        });


        it('Storage has been sended in stats', function (done) {
            this.timeout(1000);
            setTimeout(() => {
                const loc = updatedStorages.find(v => v.storage.origin == '192.168.1.5');
                assert.strictEqual(loc.storage.origin, '192.168.1.5');
                updatedStorages.length = 0;
                done();
            }, 500);
        });

        it('delete linked storage by ipaddress and port', function() {
            intentionStorage.deleteLink([{ name: 'IPAddress', value: '192.168.1.5' }, { name: 'IPPort', value: '1515'}]);
            const linked = intentionStorage.links.get('localhost');
            assert.strictEqual(linked, undefined);
        });
    });

    describe('Delete query intention', function () {
        it('should disable stats', function () {
            intentionStorage.deleteIntention(iQuery, 'intention closed');
        })
    });

    describe('Disable stats', function () {
        it ('should disable stats', function () {
            intentionStorage.statsInterval = 0;
        });

        it ('disable dispatch interval', function () {
            intentionStorage.dispatchInterval = 0;
        });
    });
});
