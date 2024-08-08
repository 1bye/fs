#!/bin/bash

# Start LavinMQ in the background
lavinmq -D /var/lib/lavinmq &

# Wait for LavinMQ to be ready (you might need to adjust the sleep duration)
sleep 15

# Echo and run the required commands
echo "Setting and deleting user..."
lavinmqctl delete_user guest
lavinmqctl add_user nouro PTqp7kW2kBLHoZgQOduyd5iituEbxxA0
lavinmqctl set_user_tags nouro administrator
lavinmqctl set_permissions -p / nouro '.*' '.*' '.*'

# Bring LavinMQ back to the foreground
wait -n

