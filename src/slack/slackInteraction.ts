import { ChatPostMessageArguments, ErrorCode } from "@slack/web-api";
import { SlackWebClient } from "../helpers/types";
import { getEmojisToReactWith } from "../emojis/emojiHandler";
import SLACK_MESSAGE_BLOCKS from "../helpers/files/welcomeMessageBlocks.json";

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
        return messageReactions.flatMap((reaction) =>
            reaction.name ? [reaction.name] : []
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

    if (!emojisToReactWith.length) {
        return;
    }

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

export async function postMessageToSlack(
    slackWebClient: SlackWebClient,
    text: string,
    slackChannel: string,
    threadTs?: string
) {
    let chatPostMessageArguments: ChatPostMessageArguments = {
        text: text,
        channel: slackChannel,
    };

    if (threadTs) {
        chatPostMessageArguments.thread_ts = threadTs;
    }

    return await slackWebClient.chat.postMessage(chatPostMessageArguments);
}

export async function handleSlackJoinEvent(
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
