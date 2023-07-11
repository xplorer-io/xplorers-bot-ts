const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");
const fs = require("fs");

let messages = [
    { role: "system", content: "Assistant is a large language model trained by OpenAI."},
  ];

export async function askOpenAI(message: string) {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT || fs.readFileSync(`/etc/secrets/azure-openai-endpoint-${process.env.TERRAFORM_WORKSPACE_NAME}`)
    const azureApiKey = process.env.AZURE_OPENAI_KEY || fs.readFileSync(`/etc/secrets/azure-openai-key-${process.env.TERRAFORM_WORKSPACE_NAME}`)

    const client = new OpenAIClient(endpoint, new AzureKeyCredential(azureApiKey));
    const deploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_ID

    messages.push({ role: "user", content: message });

    try {
        const result = await client.getChatCompletions(deploymentId, messages);

        // json result
        console.log(JSON.stringify(result, null, 2));

        return result.choices[0].message.content

    } catch (err) {
        console.error("The sample encountered an error:", err);
        console.error
    }
}
