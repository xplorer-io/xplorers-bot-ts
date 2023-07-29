import { findMatchingEmojiKeywords } from "./emojiHandler";

const emojis = {
    react: ["react", "reactjs"],
    javascript: ["js", "javascript"],
    programming: ["javascript", "python"],
};

const keywords = Object.values(emojis).flat();

describe("Emoji handler", () => {
    it("should return matching emoji for a given keyword", () => {
        const matchingEmojis = findMatchingEmojiKeywords(
            keywords,
            "reactivity",
            emojis
        );
        expect(matchingEmojis).toEqual(["react"]);
    });

    it("should return multiple matching emojis for a given keyword", () => {
        const matchingEmojis = findMatchingEmojiKeywords(
            keywords,
            "javascript",
            emojis
        );
        expect(matchingEmojis).toEqual(["javascript", "programming"]);
    });

    it("should return empty array for a not matching keyword", () => {
        const matchingEmojis = findMatchingEmojiKeywords(
            keywords,
            "random",
            emojis
        );
        expect(matchingEmojis).toEqual([]);
    });
});
