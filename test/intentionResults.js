const assert = require('assert');
const { IntentionStorage, generateUUID } = require('../main.js');

describe('Intention results', function () {
    let masha = null;
    let mashaGetsCoffee = null;
    let petya = null;
    let kolya = null;
    let petyaMakesCoffee = null;
    let kolyaMakesCoffee = null;
    const kolyaAccepted = [];
    const petyaAccepted = [];
    const mashaAccepted = [];

    describe('Create Masha', function() {
        let accept = null;
        it('Create storage', function () {
            masha = new IntentionStorage();
            masha.name = 'Маша';
        });

        it('should enable stats', function () {
            masha.statsInterval = 500;
        });

        it('Set dispatch interval', function () {
            masha.dispatchInterval = 500;
        });

        it('Set tasks stats interval', function () {
            masha.statsInterval = 500;
        });

        it('Create intention to make a coffee', function () {
            mashaGetsCoffee = masha.createIntention({
                title: 'Everybody I want a coffee',
                input: 'Coffee',
                output: 'Love',
                onData: async function (status, intention, value) {
                    if (status == 'accepting')
                        return { message: 'Masha accepted'};

                    if (status == 'accepted')
                        mashaAccepted.push({ intention, value });
                }
            });
        });
    });

    describe('Create Petya', function() {
        it('Create storage', function () {
            petya = new IntentionStorage();
            petya.name = 'Петя';
        });

        it('Create Server', function () {
            petya.createServer({ address: 'localhost', port: 10011 });
        });

        it('should enable stats', function () {
            petya.statsInterval = 500;
        });

        it('Set dispatch interval', function () {
            petya.dispatchInterval = 500;
        });

        it('Set tasks stats interval', function () {
            petya.statsInterval = 500;
        });

        it('create intention to make a coffee', function () {
            petyaMakesCoffee = petya.createIntention({
                title: 'Petya can make coffee',
                input: 'Love',
                output: 'Coffee',
                onData: async function (status, intention, value) {
                    if (status == 'accepting')
                        return { message: 'Petya accepted' };

                    if (status == 'accepted')
                        petyaAccepted.push({ intention, value});
                }
            });
        });
    });

    describe('Create Kolya', function() {
        it('Create storage', function () {
            kolya = new IntentionStorage();
            kolya.name = 'Коля';
        });

        it('Create Server', function () {
            kolya.createServer({ address: 'localhost', port: 10012 });
        });


        it('should enable stats', function () {
            kolya.statsInterval = 500;
        });

        it('Set dispatch interval', function () {
            kolya.dispatchInterval = 500;
        });

        it('Set tasks stats interval', function () {
            kolya.statsInterval = 500;
        });

        it('create intention to make a coffee', function () {
            kolyaMakesCoffee = kolya.createIntention({
                title: 'Kolya can make coffee',
                input: 'Love',
                output: 'Coffee',
                onData: async function (status, intention, value) {
                    if (status == 'accepting')
                        return { message: 'Kolya accepted' };
                    if (status == 'accepted')
                        kolyaAccepted.push({intention, value});
                }
            });
        });
    });

    describe('Connect Masha, Petya and Kolya', function () {
        let pLink = null;
        let kLink = null;
        it('add Petya link', async function () {
            pLink = masha.addStorage({ origin: 'localhost', port: '10011'});
            await pLink.waitConnection();
        });

        it('add Kolya link', async function () {
            kLink = masha.addStorage({ origin: 'localhost', port: '10012'});
            await kLink.waitConnection();
        });
    });

    describe('Wait for accepts', function () {
        it('Petya intention must be accepted', function (done) {
            setTimeout(() => {
                assert.strictEqual(petyaAccepted.length, 1, 'Petya must accept intention');
                const [vl] = petyaAccepted;
                assert.strictEqual(vl.value.message, 'Masha accepted');
                done();
            }, 1000);
        });

        it('Kolya intention must be accepted', function (done) {
            setTimeout(() => {
                assert.strictEqual(kolyaAccepted.length, 1, 'Kolya must accept intention');
                const [vl] = kolyaAccepted;
                assert.strictEqual(vl.value.message, 'Masha accepted');
                done();
            }, 1000);
        });

        it('Masha intention must be accepted', function (done) {
            setTimeout(() => {
                assert.strictEqual(mashaAccepted.length, 2, 'Masha must accept intentions from Masha and Kolya');
                const [vl1, vl2] = mashaAccepted;
                assert.strictEqual(vl1.value.message, 'Petya accepted');
                assert.strictEqual(vl2.value.message, 'Kolya accepted');
                done();
            }, 1000);
        });
    });

    describe('Disable petya', function () {
        it('close', function () {
            petya.close();
        });
    });

    describe('Disable Kolya', function () {
        it('close', function () {
            kolya.close();
        });
    });

    describe('Disable Masha', function () {
        it('Close masha', function () {
            masha.close();
        });
    });
});