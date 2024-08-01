import { test } from "bun:test";
import { FileAnalyzerAutoCategoryTask } from "@services/file/analyzer/tasks/category";

test("Auto category file", async () => {
    const autoCat = new FileAnalyzerAutoCategoryTask({
        file: {
            name: "flow-script.sh",
            content: `#!/bin/bash
# Function to validate UUID
validate_uuid() {
    local uuid=$1
    if [[ ! $uuid =~ ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$ ]]; then
        echo "Invalid UUID: $uuid"
        exit 1
    fi
}

# Set your API URL
API_URL="https://api.flow.nouro.app/v1"

# Ask user for API key
read -p "Enter your API key: " API_KEY

# Ask user whether to create a flow or just get URL
read -p "Do you want to create a flow? (y/N): " create_flow_input

# Convert input to lowercase
create_flow_input=$(echo "$create_flow_input" | tr '[:upper:]' '[:lower:]')

# Default value for create_flow
create_flow="no"

# Set create_flow based on user input
if [ "$create_flow_input" == "yes" ] || [ "$create_flow_input" == "y" ]; then
    create_flow="yes"
fi

if [ "$create_flow" == "yes" ]; then
    # Step 1: Create a flow
    CREATE_RESPONSE=$(curl -X POST "$API_URL/flow/assigned/create" \\
    -H "Authorization: Bearer $API_KEY" \\
    -H "Content-Type: application/json" \\
    -d '{
  "flow": {
    "type": "edge",
    "name": "New Assigned Edge Flow!",
    "description": "Wow!"
  },
  "assign": {
    "type": "code"
  }
}')
    echo $CREATE_RESPONSE
    # Extract uuid from create response
    UUID=$(echo $CREATE_RESPONSE | jq -r '.uuid')
    validate_uuid $UUID
else
    # Ask user for UUID
    read -p "Enter the UUID of the flow: " UUID
    validate_uuid $UUID
fi

# Step 2: Generate a code using the extracted uuid
GENERATE_CODE_RESPONSE=$(curl -X POST "$API_URL/flow/assigned/code" \\
-H "Authorization: Bearer $API_KEY" \\
-H "Content-Type: application/json" \\
-d '{
  "uuid": "'$UUID'"
}')

# Extract code from generate code response
CODE=$(echo $GENERATE_CODE_RESPONSE | jq -r '.code')

# Step 3: Use uuid and code to access the flow
ACCESS_URL="https://flow.nouro.app/assigned/$UUID/validate?assign_type=code&code=$CODE"

# Output the final URL
echo "Access your flow at: $ACCESS_URL"`
        },
        fsTree: {
            flow: {
                type: "folder",
                items: {
                    "flow": {
                        type: "folder",
                        items: {}
                    }
                }
            }
        }
    });

    console.log(await autoCat.run())
}, {
    timeout: 50000
})