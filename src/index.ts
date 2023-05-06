import { HttpFunction } from "@google-cloud/functions-framework";
import { Log, Logging } from "@google-cloud/logging";
import { SUCCESS_MESSAGE } from "./helpers/constants";
import { writeLog } from "./helpers/logs";
import { handleSlackMessageEvent } from "./helpers/slack";
import { SlackWebClient } from "./helpers/types";
const { WebClient } = require("@slack/web-api");
const fs = require("fs");

// Creates a client
const logging: Logging = new Logging();

// Logging parameters
const log: Log = logging.log(process.env.LOG_NAME || "xplorers-bot-log");
const LOG_METADATA = {
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
        fs.readFileSync("/etc/secrets/slack-oauth-token")
);

// app entry point
export const xplorersbot: HttpFunction = async (req, res) => {
    const message = {
        name: "Slack Event",
        req: req.body,
    };

    await writeLog(log, message, LOG_METADATA);

    switch (req.body.type) {
        case "url_verification":
            res.status(200).send(req.body.challenge);
            break;
        case "event_callback":
            if (req.body.event.type === "message") {
                await handleSlackMessageEvent(slackWebClient, req.body.event);
            }
    }

    res.status(200).send(SUCCESS_MESSAGE);
    console.log("Successfully processed slack message");
};
