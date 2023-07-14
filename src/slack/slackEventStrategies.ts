import {
    SlackChannelJoinEvent,
    SlackEvent,
    SlackMessageChangedEvent,
    SlackMessageEvent,
} from "../helpers/interfaces";
import { SlackWebClient } from "../helpers/types";
import { handleSlackJoinEvent, reactToSlackPost } from "./slackInteraction";

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
