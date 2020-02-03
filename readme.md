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
* The water volume control accepts the intention and finds that it needs water in the tea pot.
It creates a new intention **I need the water**.
* The valve accepts the intention and allows the water to enter. 
* When the amount of water is enough, the water volume control closes the intention and valve closes and stops the water.
* The water volume control indicates to the tea pot through opened intention "The water is ready".
* The tea pot boils the water and indicates it finished through intention to the smartphone "The water is ready".

What if there is no water in the pipe?

* The volume control indicates that water is not received and informs your smartphone there is no water. 
With approval it can place an order for the water from you or a water service company.
   
We can create a more **fail safe** process.   
In the Intention Network all important nodes or transports can be modified by doubling or tripling
without any problems.   
Let's add another tea pot in your home. 

* The first one can't boil the water and Intention Network will search for other options.
* The secondary tea pot accepts the intention and boils water.
* All chain of events were completed and now we have hot water.
* It answers through opened intention to the smartphone "The water is ready"
* Smartphone closes the intention.
* The first tea pot will find that intention is closed and cancels the task.
 
The typical smart house system can have hundreds of that small devices. Each one can generate it's own intentions.     
The simple things in your home can produce very complex scenarios by selecting the best possible option.  
**Intention Network** is designed to resolve all device commands.   

##Outdoor intention networks
Every location can has own network. Some of them can be physically splitted, 
some of them can be connected together.
In anycase every device will have no any problems to migrate between networks.   

**The robotic cafe**.

* You go to cafe fully serviced by robots.
* You call the robo-waiter with a gesture or voice. Gestures can also generate the intention.
* Now the robo-waiter has the intention from you that you want his attention.
* The robo-waiter is coming to you. And you order carbonara.
* The intention **I need carbonara** will be generated by robo-waiter and accepted by the kitchen.
* When your carbonara is ready. The kitchen sends **The karbonara is ready** through opened
intention.
* The robo-waiter takes the karbonara and brings it to you.
* When you want to leave you asks a robo-waiter for the bill.
* The robo-waiter generates an intention **Could you pay for carbonara?** with your specific public key.
* Your smart phone can accept these intentions, and asks you to approve transaction. 
  
## Live demo
The Intention Network debugging console can be found at https://intention.tech

## How it works
 + [Basic concepts](docs/basic-concepts.md)

## Recipes
+ [Creating a NodeJS application](docs/recipes/creating-nodejs-application.md)
+ [Sending a data between devices](docs/recipes/sending-data-between-devices.md)
+ [Using sound recognition](docs/recipes/using-sound-recognition.md)