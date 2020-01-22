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
The coffee machine does not have any camera or microphone. 
It connected to the power line through smart socket. 
You can ask your phone make coffee and it tells coffee machine to do it.    
This is nothing new, all smart sockets do it.  
But do the situation more realistic. What if there is no water in your coffee machine?  
Let connect the coffee machine to a water pipe through a smart wi-fi valve - second device.      
Install a smart water measurer to control amount of water in your kettle - third device.  
How to manage the chain of three devices? It`s not a problem for Intention Network.
* The smartphone creates the Intention **My owner wants a hot water**
* The kettler answers to the intention and creates a new intention **How about the water?**
* The measurer answers to the intention and founds that no more water in the kettle.
It creates a new intention **I need the water**.
* The valve answers to the intentions and opens the water. 
* When amount of water is enough, the measurer closes the intention and the valve closes the water.
* The measurer answers to the kettler through opened intention "The water is ok"
* The kettler boils the water and answers through intention to the smartphone "The water is ok"

Let`s do the situation even more realistic. There is no water in pipe.

* The intention **I need the water** will not closed and will be translated through known storages.
As example it can be accepted by water service.
 
Do the situation less realistic, but more **fail safe**

There is another kettler in your home. And the first one can't boil the water because there is not water in the pipe.

* The secondary kettler accepts the intention **My owner wants a hot water**.
* All chain of events was same but it`s succeeded.
* It answers through opened intention to the smartphone "The water is ok"
* Smartphone closes the intention
* The first kettler will find that intention is closed and cancels the task.
 
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