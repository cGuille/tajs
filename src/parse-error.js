export default class ParseError extends Error {
    constructor(message, source = null, position = null) {
        if (source !== null && position !== null) {
            const excerptStart = findLineStart(source, position);
            const excerptEnd = findLineEnd(source, position);

            const excerpt = source.slice(excerptStart, excerptEnd);
            const leftPadding = ' '.repeat(position - excerptStart);

            message += `:\n${excerpt}\n${leftPadding}↑`;
        }

        super(message);
    }
}

function findLineStart(str, startPos) {
    const prevNewLinePos = findClosestChar('\n', str, startPos, -1);

    return prevNewLinePos === null ? 0 : prevNewLinePos + 1;
}

function findLineEnd(str, startPos) {
    const nextNewLinePos = findClosestChar('\n', str, startPos, +1);

    return nextNewLinePos === null ? str.length : nextNewLinePos;
}

function findClosestChar(c, str, startPos, step) {
    let currentPos = startPos;
    let currentChar = str[currentPos];

    while (currentPos >= 0 && currentPos < str.length) {
        if (c === currentChar) {
            return currentPos;
        }

        currentPos += step;
        currentChar = str[currentPos];
    }

    return currentPos >= 0 && currentPos < str.length ? currentPos : null;
}
