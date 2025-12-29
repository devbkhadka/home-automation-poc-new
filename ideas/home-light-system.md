## Home Light System

### Overview
This system aims to efficiently manage and control the lighting in a home. It will consist of following key components:

1. Smart switch to control the lights
2. Light sensors to detect day light available in rooms
3. Motion sensors to detect movement in rooms
4. Workflows to control the lights based on the conditions

### Devices
- Each room can be considered as a device
- There will 5 rooms 2 bedrooms, 1 living room, 1 kitchen and 1 bathroom
- Each room can have multiple lights

### Workflows
**Bathroom Workflow**
- Bathroom lights are turned on when light sensor detects low light and motion is detected
- Bathroom lights are turned off when no motion is detected for 2 minutes

**Bedroom Workflow**
- Bedroom lights are turned on when common light sensor detects not enough day light and motion detected in bedroom
- Bedroom lights are turned off when no motion is detected for 5 minutes

**Living Room Workflow + Kitchen Workflow**
- Living room and kitchen lights are turned on when common light sensor detects not enough day light and motion detected in living room or kitchen
- Living room and kitchen lights are turned off when no motion is detected for 5 minutes
