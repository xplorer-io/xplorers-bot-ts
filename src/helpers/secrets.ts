const fs = require("fs");

export function readSecret(path: string): string | null {
    try {
        return fs.readFileSync(path).toString();
    } catch (err) {
        console.error(`Failed to read secret at path ${path}: ${err}`);
        return null;
    }
}
