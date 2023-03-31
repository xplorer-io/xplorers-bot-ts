import { Entry, Log } from '@google-cloud/logging';

const LOG_METADATA = {
    resource: {
        type: 'cloud_function',
        labels: {
            custom_log_entry: 'true',
            function_name: 'xplorers-bot',
            region: 'us-central1'
        }
    }
};

export async function writeLog(log: Log, message: Record<string, unknown>) {
    const entry: Entry = log.entry(LOG_METADATA, message);
    await log.write(entry);
}
