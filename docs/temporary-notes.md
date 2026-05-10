

## Processor Exception handling
- Device can detect critical state and go to safe mode and notify processor
- Processor retries to reconcile device state if device is not responding/reachable for some time it should stop reconciling and mark device as unreachable.
- when device comes back online processor should refresh all states before sending state change


## TODO
- I don't like device dependencies in states and effect. That provides clean interface for access device data and commands inside the state and effect function. However, it will mean un-necessary re-computation when anything on device changes.
- Instead it may be more efficient to create a modifiable state for any value we want to use and use it as dependency. This will give more control on when to update and recompute.
- We can't assume device running in same process as system so interface should always be through message bus.


## Idea to setup devices
- device can be added to system as a plugin, which will actually be device configuration in typescript type (it could be schema like zod).
- The configuration mainly defines outbound data types from device and commands it supports
- Firmware will not be part of the plugin, actual device lives else were
- Configuration on plugin only defines how to communicate with the device through message bus, which is taken care of by communication service.
- For example we can subscribe to device channel to get data from device. Data can be of different predefined types, few of the data types can be
    - Current state of device sensors/actuators eg. temperature, on/of state
    - Continuous stream of data from sensors e.g. 100hz data from vibration sensor, images, video, json data or binary data
    - Events e.g. motion detected, door opened
- Similarly we can use message bus to send commands and configuration to devices.
- message bus will decide which telemetry to use to deliver the data based on device configuration during registration.
- by default message bus use mqtt broker but it can be extended to support other protocols like http, websockets.


## Device registration (for system simulation)
**Note** name system and subsystem is too generic which can cause confusion. May be can call it platform and gateway, but gateway also doesn't capture the essence of it.
- system is root of everything in system, devices, subsystems, gateways, plugins, message bus etc
- subsystem is subset of system with its own states, effects, rules, devices etc. plugins and message bus are system level
- devices can be registered to as subsystem or can directly be added to system. Multiple system/subsystem can use data from device but there will be only one to control it. system with make sure that there is only one controller for each device.
- There should be plugin for device type in system before a device and be registered
- For simulation, device can broadcast message of presence on start up on message bus this will show the device in available device list with details (for simulation we can just log them)
- To register device with system we call registerDevice with necessary details like telemetry needed, events supported, commands supported
- once device is registered they are available to be used in systems/subsystems.
- subsystem can download plugin of the device from main system if not already installed, if not available on main system also it can download from repository on internet. For simulation purpose we already have predefined plugins.
