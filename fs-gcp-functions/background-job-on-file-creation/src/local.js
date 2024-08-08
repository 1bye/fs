const {v2} = require("@google-cloud/tasks");
const {createSecretKey} = require("crypto");
const { credentials } = require("@grpc/grpc-js");

const {SignJWT} = require("jose");
(async () => {
    const functions = require("@google-cloud/functions-framework");
    const { v2 } = require("@google-cloud/tasks");
    const { SignJWT } = require("jose");
    const { createSecretKey } = require('crypto');

    const config = {
        projectId: process.env.GC_PROJECT_ID
    }

// const pubSub = new PubSub({
//     projectId: config.projectId
// });
    const tasksClient = new v2.CloudTasksClient({
        port: 8000,
        servicePath: "localhost",
        sslCreds: credentials.createInsecure(),
    });

    const fileData = {
        name: "8bab9855-d437-4ce7-a560-094e54570d94/t.txt",
        bucket: "fs-dev-files",
        contentType: "text/plain",
    };

    const userId = fileData.name.split("/")[0];
    console.log(userId, fileData.name.split("/"))
    try {
        await createTask({
            fileData,
            userId
        });
    } catch (error) {
        console.error(`Error: ${(error)?.message}`);
    }
    async function createTask({ fileData, userId }) {
        const queue = process.env.GC_QUEUE_ID;
        const location = process.env.GC_QUEUE_LOCATION;
        const url = process.env.SERVER_URL;
        const jwtSecret = process.env.SECRET;

        const parent = tasksClient.queuePath(config.projectId, location, queue);

        // const date = new Date();
        // date.setSeconds(date.getSeconds() + 10);

        const secretKey = createSecretKey(jwtSecret, "utf-8");

        const authToken = await new SignJWT({
            userId
        }).setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setIssuer("nouro:fs:gc")
            .setAudience("nouro:fs:server")
            .sign(new TextEncoder().encode(jwtSecret))

        console.log(authToken)

        try {

            const [response] = await tasksClient.createTask({
                task: {
                    httpRequest: {
                        httpMethod: "POST",
                        url: `${url}/v1/file/analyze`,
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${authToken}`,
                            "Origin": "nouro.app"
                        },
                        body: Buffer.from(JSON.stringify(fileData))
                    },
                },
                parent
            });
            console.log(`Created task ${response.name}`);
        } catch (error) {
            console.error(`Error creating task: ${(error)?.message}`);
        }
    }
})()