## How Intention Network works
Every device in Intention Network can accept, store and broadcast intentions - to be an **intention storage**. 
If the device can perform the specific functions, it can accepts a specific intentions. 
If no, it just broadcast intentions to another devices.     

When the device needs to get something or give something, that device generates an intention and 
broadcasts it through known storages to searching an intention for counter needs.
When that intention is found, then the devices starts to communicate with each other.
The device can generate a lot of intentions and get a lot of answers from many devices.
They forms an intention network. This makes it possible for simple devices to do
a complex things together.

## What is the Intention
Generally, intention is variable length binary or text structure. It can be generated from device to begin 
communication and broadcasted to network. The gestures and speech can also generate 
the intentions. It gives ability to user interact with intentions in most 
friendly ways.

The basic structure of intention is:
**Input Key** - is word that describes input type of input data flow.
**Output key** - is a word that describes type of output data flow.
The input and output keys together forms an intention key. The intention with counter needs has a reversed order of
keys.  
An Intention with key **Lemonde - Money** will accepts intention with **Money - Lemonade** key 
**Title** - is a title of intention
**Origin** - The address of the device which generated an Intention. When one device accepts an intention from
another device it tries to connect to that device through origin. The ipv4, ipv6, WebRTC identifier or 
specific unique GUID can be used as origin. It can be writen in [scheme]://address format 
**Description(optional)** - Contains html markup and links for the user.
**Public key(optional)** - If authentication or authorization is needed to exchange data between devices public key can be used.
**Geo data(optional)** - Is used to set up global coordinates of the device.   
Basically an intention stored in JSON format so any other specific for intention fields can be added.
   
