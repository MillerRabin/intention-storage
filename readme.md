# Intention Storage
In real life we don't communicate with each others by calling theirs methods. 
Instead of that we use intentions and entities.
Intention network works similar way but for devices.
When the device need to get something or give something it creates an Intention and broadcasts it.
When intention with counter needs is found, the devices starts to communicate each other.
Intention can be broadcasted not only through internet, but with sound signals or gestures.
As example you can call drone by hand gesture and it will be recognised as intention.

## Live demo
The Intention Network debugging console can be found at https://intention.tech

## Manuals

### Creating a NodeJS application
You need a NodeJS https://nodejs.org

Create a project in your favorite IDE with one file main.js
Run npm init in project directory and answer to the questions to create package.json
```bash
npm init
```
Run npm i intention-storage to install intention-storage package
```bash
npm i intention-storage
```
Add the following code into main.js
```javascript
const { IntentionStorage } = require('intention-storage');
const intentionStorage = new IntentionStorage();
const storageServer = intentionStorage.createServer({ address: 'localhost' });
console.log(`Server listens on port ${storageServer.port}`);
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

Then speak into the microphone
`Add storage localhost`
You will move to the Storage tab and see the record
`localhost:10010 is online`

Now you can create intention in your project and console will see on the Intentions tab https://intention.tech/en/browser.html

### Sending data between devices
Let's imagine what all devices in house has it's own name. 
There's a robot assistant, who is able to carry out your orders. His name is Victor. 
Also, there is a fridge in the house kitchen. His name is Good Boatswain. He keeps cold lemonade.
And you ask Victor "Bring me lemonade".

Let's Express it in the code.
## Creating an application

Create a project in your favorite IDE with two empty files victor.js и fridge.js
Run npm init in project directory to create package.json
    
```bash
npm init    
npm i intention-storage
```

In Intention Network each devices has intention storage. Let`s create intention storage for fridge

fridge.js

```javascript
const { IntentionStorage } = require('intention-storage');
// Create intention storage
const intentionStorage = new IntentionStorage();
// All storages can initiate connect with known storages, but not all storages can accept connections.
// If you want your device to accept connection, you need create server.
// There can be one local intention server in your home that all device know.
// And every device can be server by itself
const storageServer = intentionStorage.createServer({ address: 'localhost' });
// By default server will be created on port 10010       
```

Now we will create intention storage for Victor and ask him for lemonade.
Victor doesn't have a lemonade, that's why he creates the intention.
Intention has input and output keys. It can be any strings. For example: "Lemonade - ThankYou".
Then input key is "Lemonade", and output key is our gratitude "ThankYou".
When intention is created, the search of counter intention will starts
Counter intention is a intention with opposite order of input and output keys "ThankYou - Lemonade"
First will be search in the device`s local intention storage. If it has no results, then intention will be broadcasts to known storages.
In our case it will be the fridge

victor.js
```javascript
const { IntentionStorage } = require('intention-storage');
const intentionStorage = new IntentionStorage();
// In the sake of simplicity let`s say Victor knows fridge
const link = intentionStorage.addStorage({ origin: 'localhost', port: 10010 });
link.connect();
// Victor creates intention "Need lemonade"
intentionStorage.createIntention({
    title: {
        en: 'Need lemonade'
    },
    input: 'Lemonade',
    output: 'ThankYou',
    onData: onData
});
        
async function onData(status, intention, value) {
    console.log(status);
}
```

There is a lemonade in the fridge.
Add the following code at the and of fridge.js

fridge.js

```javascript
intentionStorage.createIntention({
    title: {
        en: 'Has lemonade',
    },
    input: 'ThankYou',
    output: 'Lemonade',
    onData: onData
});
        
async function onData(status, intention, value) {
    console.log(status, value);
}
```
Launch two files in the different consoles.
    
node fridge.js
node victor.js
    
When counter intention for Victor was found, the acceptance process will starts
All devices will receive two messages with statuses accepting and accepted.
On the accepting stage you can return any data from call back and another device will receive it on accepted stage in 
value argument of callback function. 
If any device throws an exception during acceptance process, the process will be canceled. 

    Callback onData has three parameters. Status, Intention, Value.
        Status - is a message status. The message can be sent with any status, but there is system statuses
            accepting - The message is ask for accept from another device. The device can return any data and another device will received it with accepted message.
            accepted - the message is sent when another devices processed accepting message with no error.
            data - The another device sends a data
            close - The device has closed data channel
            error - The device reports an error on its side
            completed - The device reports the success of the task        
        Intention - Counter intention from the device that sent the data
        Value - This field stores device data if it is transferred

fridge.js
Let's modify the onData function for the Fridge so that Victor can find lemonade
    
```javascript
async function onData (status, intention, value) {
    if (status == 'accepting') {
        //You can send the data to another device with intention.send
        intention.send('data', this, {
            description: 'I am a fridge, I live in kitchen',
            location: 'Second shelf, left corner',
            volume: '1 liter'
        });
    }
}   
```
Now all device with intention "Lemonade - ThankYou", will receive information about lemonade from fridge Launch the code
    
node freezer.js
node victor.js
    
You can see the data about lemonade in the Victors`s console
Now when Victor creates intention to get lemonade, he knows where to find it.

###Using sound recognition in your projects
You can use the console https://intention.tech to provide voice recognition in your projects

Open the tab https://intention.tech/en/browser.html"  
Find the intention "Can receive raw user input from microphone or keyboard" with key HTMLTextAreaElement - Recognition.  
Output key Recognition means, what the intention gives voice input as text  
HTMLTextAreaElement - means, what the link to the textarea element can be present for receiving keyboard input. But it is not necessary.  
That intention was implemented for transferring data in console internally. But we can use it in external projects easy.  
To connect with that intention we need to create counter intention with opposite key.  
Take template main.js created in [Creating a NodeJS application](#creating-a-nodejs-application)  
Add the following code to the end of main.js  

**main.js**

```javascript
intentionStorage.createIntention({
    title: {
        en: 'Recognition test',
    },
    input: 'Recognition',
    output: 'HTMLTextAreaElement',
    onData: async function onData(status, intention, value) {
        if (status != 'data') return;
        console.log(value);    
    }
});
```
Launch the project
```Bash
node main.js
```

When your storage will change status to online, all what you say in microphone or write in user input window will be 
written in your project console.