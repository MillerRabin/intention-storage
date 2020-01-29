# Intention Storage
This is a core package for Intention Network. It gives ability for the device
to be a member of such networks.
It`s include code to accept intentions, searching for counter intentions and translate
intentions to another storages. 

## Instead of Introduction
Today there is no problem to buy a smart socket or hub controlled by wi-fi connections.
So you can turn it on or off remotely and create a schedule for these actions.

Today we have a choose of voice and gestures recognition systems - proprietary, 
open source, cloud, embedded.

We have a devices for cleaning, building, washing, security and more.
We want them to do works in our homes, yards, streets.

The main question is **"How can I manage all this?"**

When creating a smart house system what choices do I have?
Regardless of whether I use cloud system or built my own local ecosystem,
I'm faced with same problem - there are too many devices to support. 
If you want something more complex than just turning the device on by 
scheduler, you will find that communication between devices can be 
very complicated.
But often I caught myself searching the sequence of buttons to push. I give the system a command and it searches out the best
avenue to complete it`s action.

With Intention Network you don`t need to install microphone, camera and voice recognition to all devices.
The Intention Network does all this for you.

## What is the Intention Network?
This is a communication mechanism between devices that gives ability to the devices to do a complex commands together. 
 
The essence of the Intention Network is best described by the following example.  
Many of us have our own smartphones and laptops. Every modern smartphone and laptops has camera and microphone.
So it can "see" and "hear".   
The tea pot does not have any camera or microphone. 
It connected to the power line through smart socket. 
You can use your phone to ask the tea pot to boil water.    
This is nothing new, all smart sockets do it.     
But Intention Network can automaticly resolve exceptions.   
What if there is no water in your tea pot?  

The tea pot can be connected to a water pipe through a smart wi-fi valve - second device.      
Install a smart water volume control to measure amount of water in your tea pot - third device.  
How to manage the chain of three devices? It`s not a problem for Intention Network.
* The smartphone creates the intention **My owner wants hot water**
* The tea pot accepts the intention and creates a new **What about the water?**
* The water volume control accepts the intention and finds that no more water in the kettle.
It creates a new intention **I need the water**.
* The valve accept the intention and opens the water. 
* When the amount of water is enough, the water volume control closes the intention and the valve closes the water.
* The water volume control indicates to the tea pot through opened intention "The water is ok".
* The tea pot boils the water and indicates it finished through intention to the smartphone "The water is ready".

What if there is no water in the pipe?

* The volume control indicates that water is not received and informs your smartphone there is no water. 
With approval it can place an order for the water from you or a water service company.
   
We can create a more **fail safe** process.   
In the Intention Network all important nodes or transport can be doubled or tripled
without any problems.   
Let's add another tea pot in your home. 

* The first one can't boil the water and Intention Network will search for other options.
* The secondary tea pot accepts the intention and boils water.
* All chain of events were completed and now we have hot water.
* It answers through opened intention to the smartphone "The water is ready"
* Smartphone closes the intention
* The first tea pot will find that intention is closed and cancels the task.
 
The typical smart house system can have hundreds of that small devices. Every of it can generate own intentions.     
The simple things in your home can produce very complex scenarios with huge amount of possible results.  
But all of them can be resolved through **Intention Network**

## Live demo
The Intention Network debugging console can be found at https://intention.tech

## How it works
 + [Basic concepts](docs/basic-concepts.md)

## Recipes
+ [Creating a NodeJS application](docs/recipes/creating-nodejs-application.md)
+ [Sending a data between devices](docs/recipes/sending-data-between-devices.md)
+ [Using sound recognition](docs/recipes/using-sound-recognition.md)