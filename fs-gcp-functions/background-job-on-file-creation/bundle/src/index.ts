import functions from "@google-cloud/functions-framework";
// import { PubSub } from "@google-cloud/pubsub";
import { v2 } from "@google-cloud/tasks";

const config = {
    projectId: process.env.GC_PROJECT_ID as string
}

// const pubSub = new PubSub({
//     projectId: config.projectId
// });
const tasksClient = new v2.CloudTasksClient();

type FileData = {
    bucket: string;
    name: string;
    contentType: string;
}

functions.cloudEvent("onFileUpload", async (cloudEvent) => {
    const file = cloudEvent.data as {
        name: string;
        bucket: string;
        contentType: string;
        metageneration: string;
        timeCreated: string;
        updated: string;
    };

    const fileData: FileData = {
        name: file.name,
        bucket: file.bucket,
        contentType: file.contentType,
    };

    try {
        await createTask(fileData);
    } catch (error) {
        console.error(`Error: ${(error as Error)?.message}`);
    }
});

async function createTask(fileData: FileData) {
    const queue = process.env.GC_QUEUE_ID as string;
    const location = process.env.GC_QUEUE_LOCATION as string;
    const url = process.env.SERVER_URL as string;

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
        console.error(`Error creating task: ${(error as Error)?.message}`);
    }
}