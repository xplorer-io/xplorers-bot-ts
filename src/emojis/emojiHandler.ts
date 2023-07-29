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

export function findMatchingEmojiKeywords(
    keywords: string[],
    lowerCaseText: string,
    emojis: Record<string, string[]>
) {
    const emojiKeys = Object.keys(emojis);
    for (const keyword of keywords) {
        //this is too deep too
        const textHasKeyword = lowerCaseText.includes(keyword);
        if (textHasKeyword) {
            const matchingEmojis = emojiKeys.filter((key) =>
                emojis[key].includes(keyword)
            );
            return matchingEmojis;
        }
    }
}
