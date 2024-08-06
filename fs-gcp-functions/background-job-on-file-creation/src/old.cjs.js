const functions = require("@google-cloud/functions-framework");
const { v2 } = require("@google-cloud/tasks");
const { SignJWT } = require("jose");
const TextEncoder = require("util").TextEncoder;

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

    const userId = fileData.name.split("/")[0];

    try {
        await createTask({
            fileData,
            userId
        });
    } catch (error) {
        console.error(`Error: ${(error)?.message}`);
    }
});

async function createTask({ fileData, userId }) {
    const queue = process.env.GC_QUEUE_ID;
    const location = process.env.GC_QUEUE_LOCATION;
    const url = process.env.SERVER_URL;
    const jwtSecret = process.env.SECRET;

    const parent = tasksClient.queuePath(config.projectId, location, queue);

    // const date = new Date();
    // date.setSeconds(date.getSeconds() + 10);

    const authToken = SignJWT({
        userId
    }).setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setIssuer("urn:example:issuer")
        .setAudience("urn:example:audience")
        .sign(new TextEncoder().encode(jwtSecret))

    try {
        const [response] = await tasksClient.createTask({
            task: {
                httpRequest: {
                    httpMethod: "POST",
                    url: `${url}/v1/file/analyze`,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${authToken}`
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