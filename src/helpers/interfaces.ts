export interface SlackEvent {
    channel: string;
    ts: string;
    type: string;
    subtype?: string;
}

export interface SlackMessageEvent extends SlackEvent {
    type: "message";
    text: string;
    user: string;
}

export interface SlackMessageChangedEvent extends SlackEvent {
    subtype: "message_changed";
    type: "message";
    message: {
        text: string;
        user: string;
        ts: string;
    };
}

export interface SlackChannelJoinEvent extends SlackEvent {
    subtype: "channel_join";
    type: "message";
    text: string;
    user: string;
}
