# Using sound recognition in your projects
You can use the console https://console.raintech.su to provide voice recognition in your projects

Open the tab https://console.raintech.su/en/browser.html"  
Find the intention "Can receive raw user input from microphone or keyboard" with key "HTMLTextAreaElement - Recognition."  
Output key **Recognition** means, what the intention gives voice input as text  
**HTMLTextAreaElement** - means, what the link to the textarea element can be present for receiving keyboard input. But it is not necessary.  
That intention was implemented for transferring data in console internally. But we can use it in external projects easy.  
To connect with that intention we need to create counter intention with opposite key.  
Take template main.js created in [Creating a NodeJS application](/docs/recipes/creating-nodejs-application.md)  
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