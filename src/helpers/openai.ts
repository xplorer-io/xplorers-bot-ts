import { readSecret } from "./secrets";

const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

let messages = [
    {
        role: "system",
        content: "Assistant is a large language model trained by OpenAI.",
    },
];

export async function askOpenAI(message: string) {
    const azureOpenAIEndpoint =
        process.env.AZURE_OPENAI_ENDPOINT ||
        readSecret(
            `/etc/secrets/azure-openai-endpoint-${process.env.TF_WORKSPACE}`
        );
    const azureApiKey =
        process.env.AZURE_OPENAI_KEY ||
        readSecret(`/etc/secrets/azure-openai-key-${process.env.TF_WORKSPACE}`);

    if (!azureOpenAIEndpoint || !azureApiKey) {
        console.error("Azure OpenAI endpoint or key is missing.");
        return;
    }

    const client = new OpenAIClient(
        azureOpenAIEndpoint,
        new AzureKeyCredential(azureApiKey)
    );
    const deploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_ID;

    messages.push({ role: "user", content: message });

    try {
        const result = await client.getChatCompletions(deploymentId, messages);

        // json result
        console.log(JSON.stringify(result, null, 2));

        return result.choices[0].message.content;
    } catch (err) {
        console.error("Error occured when interacting with OpenAI:", err);
        console.error;
    }
}
