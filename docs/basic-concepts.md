## How Intention Network works
Every device in Intention Network can accept, store and translate intentions - to be an **intention storage**. 
If the device can perform the specific functions, it can accepts a specific intentions. 
If no, it just translate intentions to another devices.     

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

##How intentions are accepted
The intentions is translating through intention storage. For every intention storages where are two types of intentions
**Local** and **Network**.
**Local** intention is an intentions created by device   
**Network** intention is an intention translated from another device.   
The acceptance process can be started only if one or both intention are **Local**.  

* The storage locks intention pair at it`s side and asks for locking intention pair at remote side. 
* The storage sends a message with **accepting** status to the the local intention with origin from remote intentions and
to the remote intention with it`s own origin. 
* The intention handles for local and remote side will called.
* Every side checks an intention data from another. If intention can be accepted it can return specific data
 for another side, otherwise it throws an exception.
* If no exception was throwned, the storage sends a message with **accepted** status to every intention handler with 
specific data returned from previous stage. This stage is used to give ability for one intention handler to process
specific answers from another intention. In case of error an exception will thrown.
   
