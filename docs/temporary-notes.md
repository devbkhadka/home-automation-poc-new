

## Exception handling
- Device can detect critical state and go to safe mode and notify processor
- Processor retries to reconcile device state if device is not responding/reachable for some time it should stop reconciling and mark device as unreachable.
- when device comes back online processor should refresh all states before sending state change
