import { WebClient } from "@slack/web-api";

export type SlackWebClient = WebClient;

export type LOG_METADATA = {
    resource: {
        type: string;
        labels: {
            custom_log_entry?: string;
            function_name?: string;
            region: string;
        };
    };
    severity: string;
};
