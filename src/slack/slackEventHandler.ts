import { SlackEvent } from "../helpers/interfaces";
import { SlackWebClient } from "../helpers/types";
import { strategies } from "./slackEventStrategies";

export async function handleSlackMessageEvent(
    slackWebClient: SlackWebClient,
    slackEvent: SlackEvent
): Promise<void> {
    const strategyName: string = slackEvent.subtype ?? slackEvent.type;
    let strategy = strategies[strategyName];
    if (strategy) {
        strategy.handle(slackWebClient, slackEvent);
        return;
    }
    console.log(`No strategy found for event type ${slackEvent.type}`);
}
