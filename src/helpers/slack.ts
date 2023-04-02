const { Reaction, ErrorCode } = require('@slack/web-api');
import SLACK_MESSAGE_BLOCKS from './files/welcomeMessageBlocks.json';
import { SlackEvent, SlackWebClient } from './types';
const fs = require('fs');


function getEmojisToReactWith(text: string): Array<string> {
    const emojisToReactWith: Array<string> = [];

    let rawdata = fs.readFileSync('./helpers/files/emojis.json');
    let emojis: Record<string, Array<string>> = JSON.parse(rawdata);

    for (const [emoji, keywords] of Object.entries(emojis)) {
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                emojisToReactWith.push(emoji)
            }
        }
    }

    console.log(`Emojis to react with: ${emojisToReactWith}`)
    return emojisToReactWith
}

async function getCurrentEmojisOnSlackPost(slackWebClient: SlackWebClient, channel: string, timestamp: string): Promise<string[]> {
    try {
        const reactions = await slackWebClient.reactions.get({
            channel,
            timestamp
        });

        const messageReactions = reactions?.message?.reactions;
        if (messageReactions) {
            // return an array of reactions
            return messageReactions.map((reaction: typeof Reaction) => reaction.name);
        } else {
            console.log(`No reactions found for message with timestamp ${timestamp} in channel ${channel}.`);
            return [];
        }
    } catch (error) {
        console.error(`Error ${error} while getting reactions for message with timestamp ${timestamp} in channel ${channel}.`);
        return [];
    }
}

async function reactToSlackPost(slackWebClient: SlackWebClient, text: string, slackChannel: string, timestamp: string): Promise<void> {
    const emojisToReactWith: Array<string> = getEmojisToReactWith(text)
    if (emojisToReactWith.length > 0) {
        const currentEmojisOnSlackPost: Promise<string[]> = getCurrentEmojisOnSlackPost(slackWebClient, slackChannel, timestamp)

        for (const emoji of emojisToReactWith) {
            if (!(await currentEmojisOnSlackPost).includes(emoji)) {
                try {
                    console.log(`Adding emoji ${emoji} to slack post with timestamp ${timestamp} in channel ${slackChannel}.`)
                    await slackWebClient.reactions.add({
                        channel: slackChannel,
                        timestamp: timestamp,
                        name: emoji
                    })
                } catch (error: Error | any) {
                    if (error.code === ErrorCode.PlatformError) {
                        console.log(`Error message: '${error.message}' and error code: '${error.code}'`);
                    }
                }
            } else {
                console.log(`Emoji ${emoji} already exists on slack post with timestamp ${timestamp} in channel ${slackChannel}.`)
            }
        }
    }
}


function handleSlackJoinEvent(slackWebClient: SlackWebClient, slackChannel: string, userId: string) {
    const messages = SLACK_MESSAGE_BLOCKS.welcomeMessageBlocks
    const welcomeMessage = messages[Math.floor(Math.random() * messages.length)];
    // substitute user id in random welcome message with real user id
    const welcomeMessageText = welcomeMessage.blocks[0].text.text.replace('user_id', userId);

    (async () => {
        const result = await slackWebClient.chat.postMessage({
            text: welcomeMessageText,
            channel: slackChannel,
        });

        console.log(`Successfully sent message ${result.ts} to slack channel ${slackChannel}`);
    })();
}

export function handleSlackMessageEvent(slackWebClient: SlackWebClient, slackEvent: SlackEvent) {
    const slackChannel: string = slackEvent.channel;
    const userId: string = slackEvent.user;
    let text: string = slackEvent.text;
    let timestamp: string = slackEvent.ts;

    if ('subtype' in slackEvent) {
        switch (slackEvent.subtype) {
            case 'message_changed':
                text = slackEvent.message.text
                timestamp = slackEvent.message.ts
                break;
            case 'channel_join':
                handleSlackJoinEvent(slackWebClient, slackChannel, userId);
                break;
            default:
                break;
        }
    }
    reactToSlackPost(slackWebClient, text, slackChannel, timestamp)
}
