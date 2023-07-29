import { readSecret } from "./secrets";
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

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
    const deploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_ID!;

    messages.push({ role: "user", content: message });

    try {
        const chatCompletion = await client.getChatCompletions(
            deploymentId,
            messages
        );

        return chatCompletion?.choices?.[0]?.message?.content ?? "";
    } catch (err) {
        console.error("Error occured when interacting with OpenAI:", err);
    }
}
