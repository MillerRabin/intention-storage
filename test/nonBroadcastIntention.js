const assert = require('assert');
const { IntentionStorage } = require('../main.js');

describe('Non broadcast intentions', function() {
    let broadcastIntention = null;
    let nonBroadcastIntention = null;
    let nonBroadcastServer = null;
    let broadcastServer = null;

    describe('Create Broadcast Storage Server', function () {
        it ('Create storage', function () {
            broadcastServer = new IntentionStorage();
        });

        it ('should enable stats', function () {
            broadcastServer.statsInterval = 500;
        });

        it ('Set dispatch interval', function () {
            broadcastServer.dispatchInterval = 500;
        });

        it ('Set dispatch interval', function () {
            broadcastServer.lifeTime = 500;
        });

        it('Create server', function() {
            broadcastServer.createServer({ address: 'localhost', port: 10010 });
        });
    });


    describe('Create non broadcast storage server', function () {
        it ('Create storage', function () {
            nonBroadcastServer = new IntentionStorage();
        });

        it ('should enable stats', function () {
            nonBroadcastServer.statsInterval = 500;
        });

        it ('Set dispatch interval', function () {
            nonBroadcastServer.dispatchInterval = 500;
        });

        it ('Set dispatch interval', function () {
            nonBroadcastServer.lifeTime = 500;
        });

        it('Create server', function() {
            nonBroadcastServer.createServer({ address: 'localhost', port: 10011 });
        });

        it('add linked storage by parameters', function() {
            const res = nonBroadcastServer.addLink([{ name: 'WebAddress', value: 'localhost' }]);
            const linked = nonBroadcastServer.links.get('localhost:10010');
            linked.waitForServerInterval = 500;
            assert.strictEqual(linked.key, 'localhost:10010');
            assert.strictEqual(res, linked);
        });
    });

    describe('Create intentions', function() {
        it('create broadcast intention at broadcast server', function () {
            broadcastIntention = broadcastServer.createIntention({
                title: 'Test broadcasting intention',
                input: 'BroadcastTestIn',
                output: 'BroadcastTestOut',
                enableBroadcast: true,
                onData: async () => {}
            });

            assert.notEqual(broadcastIntention, null,'Broadcasting intention must be created');
            const intention = broadcastServer.intentions.byKey('BroadcastTestIn - BroadcastTestOut');
            assert.notEqual(intention, null, 'Broadcasting intention must be exists in storage');
        });

        it('create non broadcasting intention at non broadcast server', function () {
            nonBroadcastIntention = nonBroadcastServer.createIntention({
                title: 'Test non broadcasting intention',
                input: 'NonBroadcastTestIn',
                output: 'NonBroadcastTestOut',
                enableBroadcast: false,
                onData: async () => {}
            });
            assert.notEqual(nonBroadcastIntention, null, 'Non broadcasting intention must be created');
            const intention = nonBroadcastServer.intentions.byKey('NonBroadcastTestIn - NonBroadcastTestOut');
            assert.notEqual(intention, null, 'Non broadcasting intention must be exists in storage');
        });

        it('create broadcasting intention at non broadcast server', function () {
            nonBroadcastServer.createIntention({
                title: 'Test non broadcasting intention',
                input: 'BNBroadcastTestIn',
                output: 'BNBroadcastTestOut',
                enableBroadcast: true,
                onData: async () => {}
            });
        });

        it('Wait 2000 seconds', function (done) {
            setTimeout(function () {
               done();
           },2000);
        });
    });

    describe('Check Broadcasting', function () {
        it('Broadcasting intention should appeared on non broadcasting server', function () {
            const intention = nonBroadcastServer.intentions.byKey('BroadcastTestIn - BroadcastTestOut');
            assert.notEqual(intention, null, 'Broadcasting intention must be exists at non broadcast storage');
        });

        it('Non broadcasting intention should not appeared on broadcasting server', function () {
            const intention = broadcastServer.intentions.byKey('NonBroadcastTestIn - NonBroadcastTestOut');
            assert.equal(intention, null, 'Non Broadcasting intention must not be exists at broadcast storage');
        });

        it('Broadcasting intention from non broadcasting server should appeared on broadcasting server', function () {
            const intention = broadcastServer.intentions.byKey('BNBroadcastTestIn - BNBroadcastTestOut');
            assert.notEqual(intention, null, 'Broadcasting intention must be exists at broadcast storage');
        });

    });

    describe('Close client', function () {
        it ('should close', function () {
            nonBroadcastServer.close();
        });
    });

    describe('Close server', function () {
        it ('should close', function () {
            broadcastServer.close();
        });
    });
});
