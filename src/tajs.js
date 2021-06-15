'use strict';

const tokenRegExp = /\w|-/;
const whitespacesRegExp = /\s/;

const isTokenChar = RegExp.prototype.test.bind(tokenRegExp);
const isWhitespace = RegExp.prototype.test.bind(whitespacesRegExp);

class Tag {
    constructor(name) {
        this.name = name;
        this.attributes = new Map();
        this.text = '';
    }
}

class Parser {
    parse(source) {
        this.source = source;
        this.position = 0;

        return [this.parseTag()];
    }

    parseTag() {
        this.consumeWhitespaces();
        this.consumeNextChar('<');

        const tag = new Tag(this.consumeToken());

        tag.attributes = this.parseAttributes();

        this.consumeNextChar('>');

        tag.text = this.consumeWhile(nextChar => nextChar !== '<');

        this.consumeNextChar('<');
        this.consumeNextChar('/');

        const closingTagName = this.consumeToken();

        if (tag.name !== closingTagName) {
            throw new ParseError(`Tag name '${tag.name}' and closing tag name '${closingTagName}' do not match`);
        }

        this.consumeNextChar('>');

        return tag;
    }

    parseAttributes() {
        const attributes = new Map();
        let attribute = null;

        while (attribute = this.parseAttribute()) {
            attributes.set(attribute.name, attribute.value);
        }

        return attributes;
    }

    parseAttribute() {
        this.consumeWhitespaces();

        if (this.nextChar() === '>') {
            return null;
        }

        const attribute = {};

        attribute.name = this.consumeToken();

        this.consumeNextChar('=');
        this.consumeNextChar('"');

        attribute.value = this.consumeWhile(nextChar => nextChar !== '"');

        this.consumeNextChar('"');

        return attribute;
    }

    nextChar() {
        return this.source[this.position];
    }

    consumeNextChar(expectedChar) {
        const nextChar = this.nextChar();

        if (expectedChar && nextChar !== expectedChar) {
            throw new ParseError(`Unexpected char '${nextChar}' at position ${this.position}; expected '${expectedChar}'`);
        }

        this.position++;

        return nextChar;
    }

    consumeWhile(test) {
        var result = '';

        while (!this.isAtEof() && test(this.source[this.position])) {
            result += this.consumeNextChar();
        }

        return result;
    }

    consumeWhitespaces() {
        return this.consumeWhile(isWhitespace);
    }

    consumeToken() {
        return this.consumeWhile(isTokenChar);
    }

    isAtEof() {
        return this.position >= this.source.length;
    }
}

class ParseError extends Error {
}

module.exports.Parser = Parser;
module.exports.Tag = Tag;
module.exports.ParseError = ParseError;
