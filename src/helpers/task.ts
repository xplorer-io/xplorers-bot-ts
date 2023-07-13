const { CloudTasksClient } = require("@google-cloud/tasks");

const client = new CloudTasksClient();

export async function createHttpTask(payload: string) {
    const project = process.env.PROJECT_ID;
    const location = process.env.REGION;
    const parent = client.queuePath(
        project,
        location,
        process.env.CLOUD_TASK_QUEUE_NAME
    );
    const url = `https://${location}-${project}.cloudfunctions.net/xplorers-bot-openai-${process.env.TF_WORKSPACE}`;
    const serviceAccountEmail = process.env.CLOUD_TASK_SERVICE_ACCOUNT_EMAIL;

    const task = {
        httpRequest: {
            headers: {
                "Content-Type": "text/plain",
            },
            httpMethod: "POST",
            body: Buffer.from(JSON.stringify(payload)).toString("base64"),
            scheduleTime: {
                seconds: Date.now() / 1000,
            },
            oidcToken: {
                serviceAccountEmail: serviceAccountEmail,
            },
            url,
        },
    };

    // Send create task request.
    const request = { parent: parent, task: task };
    const [response] = await client.createTask(request);
    console.log(`Successfully created task ${response.name}`);
}
