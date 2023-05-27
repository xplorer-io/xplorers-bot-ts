const { Reaction, ErrorCode } = require("@slack/web-api");
import { DEFAULT_EMOJIS_FILE_PATH } from "./constants";
import SLACK_MESSAGE_BLOCKS from "./files/welcomeMessageBlocks.json";
import { SlackWebClient } from "./types";
import {
    SlackEvent,
    SlackChannelJoinEvent,
    SlackMessageEvent,
    SlackMessageChangedEvent,
} from "./interfaces";
import fs from "fs";

export function getEmojisToReactWith(text: string): Array<string> {
    const lowerCaseText = text.toLowerCase();

    // Read list of emojis from file
    const emojis: Record<string, Array<string>> = readEmojisFromFile();

    const keywords = Object.values(emojis).flat();

    // search for each keyword in the text
    const emojisToReactWith = findMatchingEmojiKeywords(
        keywords,
        lowerCaseText,
        emojis
    );

    return Array.from(new Set(emojisToReactWith));
}

function validateIsEmojisDict(dict: any): boolean {
    if (typeof dict !== "object" || dict === null) return false;

    for (const key in dict) {
        if (typeof key !== "string") return false;
        if (!Array.isArray(dict[key])) return false;

        for (const elem of dict[key]) {
            if (typeof elem !== "string") return false;
        }
    }

    return true;
}

function getEmojisFilePath(): string {
    let emojisFilePath: string = DEFAULT_EMOJIS_FILE_PATH;

    if (process.env.EMOJIS_FILE_PATH) {
        // check if the file path is valid
        if (!fs.existsSync(process.env.EMOJIS_FILE_PATH)) {
            return "";
        } else {
            emojisFilePath = process.env.EMOJIS_FILE_PATH;
        }
    }

    return emojisFilePath;
}

function readEmojisFromFile(): Record<string, Array<string>> {
    const emojisFilePath = getEmojisFilePath();

    if (!emojisFilePath) {
        console.error(
            `Emojis file path ${process.env.EMOJIS_FILE_PATH} is invalid.`
        );
        return {};
    }

    try {
        const data = fs.readFileSync(emojisFilePath, {
            encoding: "utf8",
            flag: "r",
        });
        const emojis: Record<string, Array<string>> = JSON.parse(data);
        if (!validateIsEmojisDict(emojis)) {
            console.error(
                `Contents of emojis file ${emojisFilePath} is not in the correct format.`
            );
            return {};
        }
        return emojis;
    } catch (err) {
        console.error(`Error reading emojis file: ${err}`);
        return {};
    }
}

function findMatchingEmojiKeywords(
    keywords: string[],
    lowerCaseText: string,
    emojis: Record<string, string[]>
): Array<string> {
    const matchingEmojiKeywords: Array<string> = [];

    for (const keyword of keywords) {
        if (lowerCaseText.includes(keyword)) {
            matchingEmojiKeywords.push(
                Object.keys(emojis).find((key) =>
                    emojis[key].includes(keyword)
                )!
            );
        }
    }
    return matchingEmojiKeywords;
}

export async function getCurrentEmojisOnSlackPost(
    slackWebClient: SlackWebClient,
    channel: string,
    timestamp: string
): Promise<string[]> {
    try {
        const reactions = await slackWebClient.reactions.get({
            channel,
            timestamp,
        });

        const messageReactions = reactions?.message?.reactions;
        if (!messageReactions) {
            console.log(
                `No reactions found for message with timestamp ${timestamp} in channel ${channel}.`
            );
            return [];
        }
        return messageReactions.map(
            (reaction: typeof Reaction) => reaction.name
        );
    } catch (error) {
        console.error(
            `Error ${error} while getting reactions for message with timestamp ${timestamp} in channel ${channel}.`
        );
        return [];
    }
}

export async function reactToSlackPost(
    slackWebClient: SlackWebClient,
    text: string,
    slackChannel: string,
    timestamp: string
): Promise<void> {
    const emojisToReactWith: Array<string> = getEmojisToReactWith(text);

    if (!emojisToReactWith.length) return;

    const currentEmojisOnSlackPost: Array<string> =
        await getCurrentEmojisOnSlackPost(
            slackWebClient,
            slackChannel,
            timestamp
        );

    console.log(
        `Current emojis on slack post with timestamp ${timestamp} in channel ${slackChannel}: ${currentEmojisOnSlackPost}`
    );

    const newEmojisToReactWith = emojisToReactWith.filter(
        (emoji) => !currentEmojisOnSlackPost.includes(emoji)
    );

    console.log(`New emojis to react with: ${newEmojisToReactWith}`);

    if (newEmojisToReactWith.length) {
        for (const emoji of newEmojisToReactWith) {
            await addReactionToSlackPost(
                emoji,
                timestamp,
                slackChannel,
                slackWebClient
            );
        }
    }
}

export async function addReactionToSlackPost(
    emoji: string,
    timestamp: string,
    slackChannel: string,
    slackWebClient: SlackWebClient
) {
    try {
        console.log(
            `Adding emoji ${emoji} to slack post with timestamp ${timestamp} in channel ${slackChannel}.`
        );
        await slackWebClient.reactions.add({
            channel: slackChannel,
            timestamp: timestamp,
            name: emoji,
        });
    } catch (error: any) {
        if (error.code === ErrorCode.PlatformError) {
            console.log(
                `Error while adding reaction to slack post: '${error.message}' and error code: '${error.code}'`
            );
        }
    }
}

async function postMessageToSlack(
    slackWebClient: SlackWebClient,
    text: string,
    slackChannel: string
) {
    const postMessageResponse = await slackWebClient.chat.postMessage({
        text: text,
        channel: slackChannel,
    });
    console.log(
        `Successfully sent message ${postMessageResponse.ts} to slack channel ${slackChannel}`
    );
}

async function handleSlackJoinEvent(
    slackWebClient: SlackWebClient,
    slackChannel: string,
    userId: string
): Promise<void> {
    const messages = SLACK_MESSAGE_BLOCKS.welcomeMessageBlocks;
    const welcomeMessage =
        messages[Math.floor(Math.random() * messages.length)];
    // substitute user id in random welcome message with real user id
    const welcomeMessageText = welcomeMessage.blocks[0].text.text
        .split("@userId")
        .join("@" + userId);

    await postMessageToSlack(slackWebClient, welcomeMessageText, slackChannel);
}

interface SlackEventStrategy {
    handle(slackWebClient: SlackWebClient, slackEvent: SlackEvent): void;
}

export class ChannelJoinStrategy implements SlackEventStrategy {
    async handle(
        slackWebClient: SlackWebClient,
        slackEvent: SlackChannelJoinEvent
    ) {
        const userId = slackEvent.user;
        const slackChannel = slackEvent.channel;
        await handleSlackJoinEvent(slackWebClient, slackChannel, userId);
    }
}

export class MessageStrategy implements SlackEventStrategy {
    async handle(
        slackWebClient: SlackWebClient,
        slackEvent: SlackMessageEvent
    ): Promise<void> {
        const { text, channel, ts } = slackEvent;
        await reactToSlackPost(slackWebClient, text, channel, ts);
    }
}

export class MessageChangedStrategy implements SlackEventStrategy {
    async handle(
        slackWebClient: SlackWebClient,
        slackEvent: SlackMessageChangedEvent
    ): Promise<void> {
        const { channel } = slackEvent;
        const { text, ts } = slackEvent.message;
        await reactToSlackPost(slackWebClient, text, channel, ts);
    }
}

export const strategies: Record<string, SlackEventStrategy> = {
    channel_join: new ChannelJoinStrategy(),
    message: new MessageStrategy(),
    message_changed: new MessageChangedStrategy(),
};

export async function handleSlackMessageEvent(
    slackWebClient: SlackWebClient,
    slackEvent: SlackEvent
) {
    let strategyName: string;

    if (!slackEvent.subtype) {
        strategyName = slackEvent.type;
    } else {
        strategyName = slackEvent.subtype;
    }

    let strategy = strategies[strategyName];
    if (strategy) {
        await strategy.handle(slackWebClient, slackEvent);
    } else {
        console.log(`No strategy found for event type ${slackEvent.type}`);
    }
}
