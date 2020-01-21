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

When I creating a smart house system what choose do I have?
Regardless of whether I use cloud system or built my own local ecosystem,
I faced with same problem - there is too many of devices to support. 
If you want something more complex than just turning the device on by 
scheduler, you will find that communication between device can be 
very complex.
But often I catched myself that I do not want anymore to search 
the sequence of buttons I must push. I just want to speak with it and 
get the answers from it.

But how? I need to install microphone, camera and voice recognition
system to every device?

And this is the area where Intention Network works.

## What is the Intention Network?
This is a communication mechanism between devices that gives ability to  
the devices to do a complex things together. 
 
The essence of the network of intentions is best described by the following example.
Many of us have our own smartphones or laptops. Every modern smartphone and laptops has camera and microphone.
So its can "see" and "hear". 
**The kettle.** The kettle do not have any camera or microphone. 
It connected to the power line through smart socket. 
You can ask your phone to boil a water and it asks your kettle to do that.
Nothing special all smart sockets do this.
But do the situation more realistic. What if there is no water in your kettle?
Connect the kettle to a water pipe through a smart wi-fi valve - second device.
Install a smart water measurer to control amount of water in your kettle - third device.
How to manage the chain of three devices? It`s not a problem for Intention Network.
* The smartphone creates the Intention **My owner wants a hot water"**
* The kettler answers to the intention and create a new **How about the water?**
* The measurer answers to the intention and founds that no more water in the kettle.
It creates a new **I need the water**.
* The valve answers to the intentions and opens the water. 
* When amount of water is enough, the measurer closes the intention and the valve closes the water.
* The measurer answers to the kettler through opened intention "The water is ok"
* The kettler boils the water and answers through intention to the smartphone "The water is ok"

Let`s do the situation even more realistic. There is no water in pipe.

* The intention **I need the water** will not closed and will be translated through known storages.
As example it can be accepted by water service.
 
 
## Live demo
The Intention Network debugging console can be found at https://intention.tech

## How it works
 + [Basic concepts](docs/basic-concepts.md)

## Recipes
+ [Creating a NodeJS application](docs/recipes/creating-nodejs-application.md)
+ [Sending a data between devices](docs/recipes/sending-data-between-devices.md)
+ [Using sound recognition](docs/recipes/using-sound-recognition.md)