#!/bin/bash

cd ~/GC/Task/cloud-tasks-emulator

go run ./ -host localhost -port 8000 -queue projects/spending-money-762d0/locations/europe-west3/queues/fs-dev-files
