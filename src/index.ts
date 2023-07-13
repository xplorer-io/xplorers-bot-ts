import { HttpFunction } from "@google-cloud/functions-framework";
import { Log, Logging } from "@google-cloud/logging";
import { SUCCESS_MESSAGE } from "./helpers/constants";
import { writeLog } from "./helpers/logs";
import { handleSlackMessageEvent, postMessageToSlack } from "./helpers/slack";
import { SlackWebClient } from "./helpers/types";
import { createHttpTask } from "./helpers/task";
import { readSecret } from "./helpers/secrets";
import { askOpenAI } from "./helpers/openai";
const { WebClient } = require("@slack/web-api");

// Creates a client
const logging: Logging = new Logging();

// Logging parameters
const log: Log = logging.log(process.env.LOG_NAME || "xplorers-bot-log");
var LOG_METADATA = {
    resource: {
        type: "cloud_function",
        labels: {
            custom_log_entry: "true",
            function_name: "xplorers-bot",
            region: "us-central1",
        },
    },
    severity: "INFO",
};

const slackWebClient: SlackWebClient = new WebClient(
    process.env.SLACK_OAUTH_TOKEN ||
        readSecret(`/etc/secrets/slack-oauth-token-${process.env.TF_WORKSPACE}`)
);

// app entry point
export const xplorersbot: HttpFunction = async (req, res) => {
    const message = {
        name: "Slack Event",
        req: req.body,
    };

    writeLog(log, message, LOG_METADATA);

    switch (req.body.type) {
        case "url_verification":
            res.status(200).send(req.body.challenge);
            break;
        case "event_callback":
            if (
                req.body.event.channel ===
                process.env.XPLORERS_OPENAI_SLACK_CHANNEL_ID
            ) {
                if (
                    req.body.event.text.toLowerCase().startsWith("hey openai")
                ) {
                    await createHttpTask(req.body);
                }
                break;
            }
            if (req.body.event.type === "message") {
                await handleSlackMessageEvent(slackWebClient, req.body.event);
            }
    }

    res.status(200).send(SUCCESS_MESSAGE);
    console.log("Successfully processed slack message");
};

// openai app entry point
export const xplorersbotOpenAI: HttpFunction = async (req, res) => {
    const parsedSlackEvent = JSON.parse(req.body);
    const message = {
        name: "Slack OpenAI Event",
        req: parsedSlackEvent,
    };

    // change function name in log metadata
    LOG_METADATA.resource.labels.function_name = "xplorers-openai-function";

    writeLog(log, message, LOG_METADATA);
    const openAIResponse = await askOpenAI(parsedSlackEvent.event.text);
    await postMessageToSlack(
        slackWebClient,
        openAIResponse,
        parsedSlackEvent.event.channel
    );
    res.status(200).send(SUCCESS_MESSAGE);
    console.log("Successfully processed openai event");
};
