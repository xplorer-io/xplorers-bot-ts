import crypto from "crypto";

export const getRandomValue = ({ range }: { range: number }) => {
    const array = new Uint32Array(1); // creates array with length only 1
    return crypto.getRandomValues(array)[0] % range; //thus accessing first position in the array
};
