const functions = require("@google-cloud/functions-framework");
const { v2 } = require("@google-cloud/tasks");

const config = {
    projectId: process.env.GC_PROJECT_ID
}

// const pubSub = new PubSub({
//     projectId: config.projectId
// });
const tasksClient = new v2.CloudTasksClient();

functions.cloudEvent("onFileUpload", async (cloudEvent) => {
    const file = cloudEvent.data;

    const fileData = {
        name: file.name,
        bucket: file.bucket,
        contentType: file.contentType,
    };

    try {
        await createTask(fileData);
    } catch (error) {
        console.error(`Error: ${(error)?.message}`);
    }
});

async function createTask(fileData) {
    const queue = process.env.GC_QUEUE_ID;
    const location = process.env.GC_QUEUE_LOCATION;
    const url = process.env.SERVER_URL;

    const parent = tasksClient.queuePath(config.projectId, location, queue);

    // const date = new Date();
    // date.setSeconds(date.getSeconds() + 10);

    try {
        const [response] = await tasksClient.createTask({
            task: {
                httpRequest: {
                    httpMethod: "POST",
                    url: `${url}/v1/file/analyze`,
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(fileData)
                }
            },
            parent
        });
        console.log(`Created task ${response.name}`);
    } catch (error) {
        console.error(`Error creating task: ${(error)?.message}`);
    }
}