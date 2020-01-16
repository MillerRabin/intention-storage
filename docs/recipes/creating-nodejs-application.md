# Creating a NodeJS application
You need a NodeJS https://nodejs.org

Create a project in your favorite IDE with one file main.js  
Run npm init in project directory to create package.json
```Bash
npm init
```
Install intention-storage package
```bash
npm i intention-storage
```
Add the following code into main.js to create simple server
```javascript
const { IntentionStorage } = require('intention-storage');
const intentionStorage = new IntentionStorage();
const storageServer = intentionStorage.createServer({ address: 'localhost' });
console.log(`Server listens on port ${storageServer.socketServer.port}`);
```

or you can use ssl certificate to create secure server
```javascript
const { IntentionStorage } = require('intention-storage');
const intentionStorage = new IntentionStorage();
const storageServer = intentionStorage.createServer({ 
    address: 'your.server.domain.name', 
    sslCert: { 
        cert: 'path to certificate', 
        key: 'path to certificate key'
    } 
});
console.log(`Server listens on port ${storageServer.socketServer.port}`);
```

Run project for execution
```bash
node main.js
```
If all works fine, you should see a record in console "Server listens on port 10010".  
10010 - is a default port for all intention storages.  
The console need to know at least one server from your infrastructure.  
Open https://intention.tech in browser with SpeechRecognition support. Chrome for example  
Enable your microphone for the console.  
Then speak into the microphone `Add storage localhost`
You will move to the Storage tab and see the record `localhost:10010 is online`  

Now you can create intention in your project and console will see it on 
the Intentions tab https://intention.tech/en/browser.html
