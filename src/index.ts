import { HttpFunction } from '@google-cloud/functions-framework';
import { Log, Logging } from '@google-cloud/logging';
import { SUCCESS_MESSAGE } from './helpers/constants';
import { writeLog } from './helpers/logs';
import { handleSlackMessageEvent } from './helpers/slack';
const { WebClient } = require('@slack/web-api');
const fs = require('fs');

// Creates a client
const logging: Logging = new Logging();

// Selects the log to write to
const log: Log = logging.log(process.env.LOG_NAME || 'xplorers-bot-log');

const slackWebClient: typeof WebClient = new WebClient(process.env.SLACK_OAUTH_TOKEN || fs.readFileSync('/etc/secrets/slack-oauth-token'))

// Lambda handler
export const xplorersbot: HttpFunction = (req, res) => {
    const message = {
        name: 'Slack Event',
        req: req.body
    };

    writeLog(log, message);

    switch (req.body.type) {
        case 'url_verification':
            res.status(200).send(req.body.challenge);
            break;
        case 'event_callback':
            switch (req.body.event.type) {
                case 'message':
                    handleSlackMessageEvent(slackWebClient, req.body.event)
            }
    }

    res.status(200).send(SUCCESS_MESSAGE);
};
