# Intention Storage
This is a core package for the Intention Network. It gives ability to the device
to be a member of such networks.
It`s includes code to accept intentions, to search for counter intentions and to translate
intentions to other storage. 

## Instead of Introduction
Today there is no problem in buying a smart socket or hub controlled by wi-fi connections.
So you can turn it on or off remotely and create a schedule for these actions.

Today we have a choices of voice and gestures recognition systems - proprietary, 
open source, cloud and embedded.

We have devices for cleaning, building, washing, security and more.
We want them to do work in our homes, yards and streets.

The main question is **"How can I manage all of this?"**

When creating a smart house system what choices do I have?
Regardless of whether I use a cloud system or build my own local ecosystem,
I'm faced with the same problem - there are too many devices to support. 
If you want something more complex than just turning the device on with 
a scheduler, you will find that communication between devices can be 
very complicated.
But often I catch myself searching the sequences of buttons to push. I give the system a command and it 
searches for the best way to complete this action.

With the Intention Network you don`t need to install microphone, camera or voice recognition to all devices.
The Intention Network does all of this for you.

## What is the Intention Network?
This is a communication mechanism between devices that gives the ability to all devices to do 
complex commands together. 
 
The essence of the Intention Network is best described by the following example.  
Many of us have our own smartphones and laptops. Every modern smartphone and laptop has a camera and microphone.
So it can "see" and "hear".   
A tea pot does not have any camera or microphone. 
It connected to the power line through smart socket. 
You can use your phone to ask the tea pot to boil water.    
This is nothing new, all smart sockets do it.     
But the Intention Network can automaticly resolve exceptions.   
What if there is no water in your tea pot?  

The tea pot can be connected to a water pipe through a smart wi-fi valve - the second device.      
Install a smart water volume control to measure the amount of water in your tea pot - the third device.  
How can we manage the chain of three devices? It`s not a problem for the Intention Network.
* The smartphone creates the intention "My owner wants hot water"
* The tea pot accepts the intention and creates a new "What about the water?"
* The water volume control accepts the intention and finds that it needs water in the tea pot.
It creates a new intention "I need the water".
* The valve accepts the intention and allows the water to enter. 
* When the amount of water is enough, the water volume control closes the intention and valve closes and stops the water.
* The water volume control indicates to the tea pot through the opened intention "The water is ready".
* The tea pot boils the water and indicates it finished through the intention to the smartphone "The water is ready".

What if there is no water in the pipe?

* The volume control indicates that water is not received and informs your smartphone there is no water. 
With approval it can place an order for the water from you or a water service company.
   
We can create a more **fail safe** process.   
In the Intention Network all important nodes or transports can be modified by doubling or tripling
without any problems.   
Let's add another tea pot in your home. 

* The first one can't boil the water and the Intention Network will search for other options.
* The secondary tea pot accepts the intention and boils the water.
* All chain of events were completed and now we have hot water.
* It answers through the opened intention to the smartphone "The water is ready"
* The smartphone closes the intention.
* The first tea pot will find that the intention is closed and cancels the task.
 
A typical smart house system can have hundreds of small devices. Each one can generate it's own intentions.     
The simple things in your home can produce very complex scenarios because of selecting the best possible option.  
The **Intention Network** is designed to resolve all device commands.   

## Home security

Let`s imagine a picture of you in your own home. There is a main gate with doorbell and camera.
The camera has built in microphone and connected to the video server in security room. The main gate  
automatically opening and closing. The gate is connected to the computer system (Raspberry PI), so it can receive 
command for opening and closing from keychain or wi-fi.  
There is a laptop at your workspace or smartphone that is always with you when you are out.   

You work on the laptop and somebody rang the doorbell.
* You give a command to connect you to the gate camera.
* Your laptop creates the intention "I need a video from gate camera"
* Video server accepts the intention and redirects a video stream from the gate camera to your laptop. 
* Now you can see who is coming and start conversation from your workplace.
* If you wish, you can ask your laptop "Please open the gate"
* The laptop creates the intention "Open the main gate"
* The gate computer accepts the intention and opens the gate.
* When you want to close the gate just ask your laptop to close it

What if you working in the garden when the doorbell rings. It`s not a problem. Just ask your smartphone "Connect me to the gate camera" and
process will be same, but through your smartphone.  
Want a security terminal for all your family that will automatically on when the doorbell is rang. It's not a
problem. 

## Multilocation Intention Networks

Every location can have it`s own network. The networks can be separated by location or connected
together. This setup allows migration between networks.
   
**The robotic cafe**   
*This is a futuristic scenario, but this case can be modeled using intentions*   
 
* You go to cafe a fully serviced by robots.
* You call the robo-waiter with a gesture or by voice. Gestures can also generate the intention.
* Now the robo-waiter has the intention from you that you want his attention.
* The robo-waiter comes to you. And you order carbonara.
* The intention "I need carbonara" will be generated by robo-waiter and accepted by the kitchen.
* When your carbonara is ready, the kitchen sends "The carbonara is ready" through an opened
intention.
* The robo-waiter takes the carbonara and brings it to you.
* When you want to leave you ask the robo-waiter for the bill.
* The robo-waiter generates an intention "Could you pay for carbonara?" with your specific public key.
* Your smart phone can accept these intentions, and asks you to approve the transaction. 
  
 ## Live demo
The Intention Network debugging console can be found at https://console.raintech.su

## How it works
 + [Basic concepts](docs/basic-concepts.md)

## Recipes
+ [Creating a NodeJS application](docs/recipes/creating-nodejs-application.md)
+ [Sending a data between devices](docs/recipes/sending-data-between-devices.md)
+ [Using sound recognition](docs/recipes/using-sound-recognition.md)