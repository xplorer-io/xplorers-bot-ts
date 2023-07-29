import { findMatchingEmojiKeywords } from "./emojiHandler";

const emojis = {
    react: ["react", "reactjs"],
    javascript: ["js", "javascript"],
    programming: ["javascript", "python"],
};

describe("Emoji handler", () => {
    it("should return matching emojis for a given keyword", () => {
        const keywords = Object.values(emojis).flat();

        const matchingEmojis = findMatchingEmojiKeywords(
            keywords,
            "reactivity",
            emojis
        );
        expect(matchingEmojis).toEqual(["react"]);

        const matchingEmojis2 = findMatchingEmojiKeywords(
            keywords,
            "javascript",
            emojis
        );
        expect(matchingEmojis2).toEqual(["javascript", "programming"]);
    });
});
