import { getRandomValue } from "./getRandomValue";

describe("Get random value", () => {
    it("should return random int value from 0-2 provided range 3", () => {
        const randomValue = getRandomValue({ range: 3 });
        expect([0, 1, 2].includes(randomValue)).toBe(true);
    });

    it("should return random int value from 0-4 provided range 5", () => {
        const randomValue = getRandomValue({ range: 5 });
        expect([0, 1, 2, 3, 4].includes(randomValue)).toBe(true);
    });
});
