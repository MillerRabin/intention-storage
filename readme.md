**Intention Storage**
Through a network of intentions, devices can communicate with users and with each other.<br/>
When a device needs to interact with the outside world, it creates an <b>Intention</b><br/>
<b>Intention</b> is the need to provide or receive a service.<br/>
It is broadcast between devices for search of devices with counter intentions.<br/>
Once a device with a counter intent is found, the negotiation process begins. Each of the devices accepts
or rejects the counter intention. If the intention is accepted on both sides, a data link is established
and the devices can communicate with each other<br/>

## Dependencies
    NodeJS 11.x or above

## How to install

```sh
npm i intention-storage
```

#Use in NodeJS environment

```javascript
    const { IntentionStorage } = require('intention-storage');
    const intentionStorage = new IntentionStorage();
    const storageServer = intentionStorage.createServer({ address: 'localhost' });
    console.log(`Server listens on port ${storageServer.port}`);   
```

#Use in Browser environment

```javascript
    import IS from '/node_modules/intention-storage/browser/main.js';
    const intentionStorage = new IS.IntentionStorage();   
```