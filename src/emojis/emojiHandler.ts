import emojis from "../helpers/files/emojis.json";

export function getEmojisToReactWith(text: string): Array<string> {
    const lowerCaseText = text.toLowerCase();

    const keywords = Object.values(emojis).flat();

    // search for each keyword in the text
    const emojisToReactWith = findMatchingEmojiKeywords(
        keywords,
        lowerCaseText,
        emojis
    );

    return Array.from(new Set(emojisToReactWith));
}

function findMatchingEmojiKeywords(
    keywords: string[],
    lowerCaseText: string,
    emojis: Record<string, string[]>
): Array<string> {
    const matchingEmojiKeywords: Array<string> = [];

    for (const keyword of keywords) {
        //this is too deep too
        if (lowerCaseText.includes(keyword)) {
            matchingEmojiKeywords.push(
                Object.keys(emojis).find((key) =>
                    emojis[key].includes(keyword)
                )!
            );
        }
    }
    return matchingEmojiKeywords;
}
