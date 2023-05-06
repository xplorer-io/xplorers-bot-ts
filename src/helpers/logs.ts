import { Entry, Log } from "@google-cloud/logging";
import { LOG_METADATA } from "./types";

export async function writeLog(
    log: Log,
    message: Record<string, unknown>,
    metadata: LOG_METADATA
) {
    const entry: Entry = log.entry(metadata, message);
    await log.write(entry);
}
