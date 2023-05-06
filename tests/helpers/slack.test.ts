import { handleSlackMessageEvent } from "../../src/helpers/slack";
import {
    MessageChangedStrategy,
    ChannelJoinStrategy,
    MessageStrategy,
    addReactionToSlackPost,
} from "../../src/helpers/slack";
import { SlackWebClient } from "../../src/helpers/types";

const slackMessageChangedEvent = {
    channel_type: "channel",
    text: "golang git.",
    message: {
        source_team: "TMS5HACXZ",
        user_team: "TMS5HACXZ",
        type: "message",
        team: "TMS5HACXZ",
        text: "golang git.",
        user: "UMS5HLAAA",
        ts: "1682383793.955729",
    },
    subtype: "message_changed",
    event_ts: "1682386203.002100",
    type: "message",
    channel: "CMQ097OOP",
    ts: "1682383793.955729",
};

const slackMessageEvent = {
    channel_type: "channel",
    text: "golang git.",
    user: "UMS5HLAAA",
    event_ts: "1682383793.955729",
    type: "message",
    channel: "CMQ097OOP",
    ts: "1682383793.955729",
};

const channelJoinEvent = {
    channel_type: "channel",
    text: "<@UMS5HLAAA> has joined the channel",
    user: "UMS5HLAAA",
    event_ts: "1682383793.955729",
    type: "message",
    subtype: "channel_join",
    channel: "CMQ097OOP",
    ts: "1682383793.955729",
};

const slackWebClient = {
    reactions: {
        get: jest.fn(),
        add: jest.fn(),
    },
    chat: {
        postMessage: jest.fn(async () => ({ ts: "123" })),
    },
} as unknown as SlackWebClient;

describe("handleSlackMessageEvent", () => {
    const messageChangedStrategy = jest.spyOn(
        MessageChangedStrategy.prototype,
        "handle"
    );

    const channelJoinStrategy = jest.spyOn(
        ChannelJoinStrategy.prototype,
        "handle"
    );

    const messageStrategy = jest.spyOn(MessageStrategy.prototype, "handle");

    test("calls MessageChangedStrategy.handle when subtype is message_changed", async () => {
        await handleSlackMessageEvent(slackWebClient, slackMessageChangedEvent);
        expect(messageChangedStrategy).toHaveBeenCalledTimes(1);
    });

    test("calls ChannelJoinStrategy.handle when subtype is channel_join", async () => {
        await handleSlackMessageEvent(slackWebClient, channelJoinEvent);
        expect(channelJoinStrategy).toHaveBeenCalledTimes(1);
    });

    test("calls MessageStrategy.handle when type is message and subtype is undefined", async () => {
        await handleSlackMessageEvent(slackWebClient, slackMessageEvent);
        expect(messageStrategy).toHaveBeenCalledTimes(1);
    });
});

describe("addReactionToSlackPost", () => {
    const emoji = "smile";
    const timestamp = "1234.5678";
    const slackChannel = "general";

    it("should call slackWebClient.reactions.add with the correct params", async () => {
        await addReactionToSlackPost(
            emoji,
            timestamp,
            slackChannel,
            slackWebClient as SlackWebClient
        );
        expect(slackWebClient.reactions.add).toHaveBeenCalledWith({
            channel: slackChannel,
            timestamp,
            name: emoji,
        });
    });
});
