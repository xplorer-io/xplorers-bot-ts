export type SlackEvent = {
    channel: string;
    user: string;
    text: string;
    ts: string;
    subtype: string;
    message: {
        text: string;
        ts: string;
    };
}
