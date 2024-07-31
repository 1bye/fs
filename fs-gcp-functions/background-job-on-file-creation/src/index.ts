import functions from "@google-cloud/functions-framework";
import { PubSub } from "@google-cloud/pubsub";
import { CloudTasksClient } from "@google-cloud/tasks";

const config = {
    projectId: process.env.GC_PROJECT_ID
}

const pubSub = new PubSub({
    projectId: config.projectId
});
const tasksClient = new CloudTasksClient();

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

    // Root ID is can be userId, for ex
    // const rootId = name.split("/")[0];

    const fileData: FileData = {
        bucket: file.bucket,
        name: file.name,
        contentType: file.contentType,
    };

    try {
        const topic = await pubSub
            .topic("file-upload-topic");

        const messageId = await topic.publishMessage({
            json: fileData,
        })
            // .publish(dataBuffer);
        // console.log(`Message ${messageId} published.`);

        await createTask(fileData);
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
});

async function createTask(fileData: FileData) {
    const queue = process.env.GC_QUEUE_ID;
    const location = process.env.GC_QUEUE_LOCATION;
    const url = process.env.SERVER_URL;

    const parent = tasksClient.queuePath(config.projectId, location, queue);

    // const date = new Date();
    // date.setSeconds(date.getSeconds() + 10);

    const task = {
        httpRequest: {
            httpMethod: "POST",
            url,
            headers: {
                "Content-Type": "application/json"
            },
            body: Buffer.from(JSON.stringify(fileData)).toString('base64'),
        },
        // scheduleTime: {
        //     seconds: Math.floor(date.getTime() / 1000)
        // }
    };

    try {
        const [response] = await tasksClient.createTask({
            parent,
            task,

        });
        console.log(`Created task ${response.name}`);
    } catch (error) {
        console.error(`Error creating task: ${error.message}`);
    }
}