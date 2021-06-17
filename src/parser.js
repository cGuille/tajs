import ParseError from './parse-error.js';
import Tag from './tag.js';

const tokenRegExp = /\w|-/;
const whitespacesRegExp = /\s/;

const isTokenChar = RegExp.prototype.test.bind(tokenRegExp);
const isWhitespace = RegExp.prototype.test.bind(whitespacesRegExp);

export default class Parser {
    parse(source) {
        this.source = source;
        this.position = 0;

        const tags = [];

        do {
            this.consumeWhitespaces();
            tags.push(this.parseTag());
            this.consumeWhitespaces();
        } while (!this.isAtEof());

        return tags;
    }

    parseTag() {
        this.consumeNextChar('<');

        const tagName = this.consumeToken();
        if (!tagName) {
            throw new ParseError('Tag name cannot be empty', this.source, this.position);
        }

        const tag = new Tag(tagName);

        tag.attributes = this.parseAttributes();

        this.consumeNextChar('>');

        tag.text = this.consumeWhile(nextChar => nextChar !== '<');

        while (this.nextChar() === '<' && this.lookAhead(1) !== '/') {
            tag.children.push(this.parseTag());
            tag.text += this.consumeWhile(nextChar => nextChar !== '<');
        }

        this.consumeNextChar('<');
        this.consumeNextChar('/');

        const closingTagName = this.consumeToken();

        if (tag.name !== closingTagName) {
            throw new ParseError(
                `Tag name '${tag.name}' and closing tag name '${closingTagName}' do not match`,
                this.source,
                this.position - closingTagName.length
            );
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

    lookAhead(n) {
        if (n < 1) {
            n = 1;
        }

        return this.source[this.position + n];
    }

    consumeNextChar(expectedChar) {
        if (this.isAtEof()) {
            throw new ParseError('Cannot consume next char: EOF reached');
        }

        const nextChar = this.nextChar();

        if (expectedChar && nextChar !== expectedChar) {
            throw new ParseError(
                `Unexpected char ${JSON.stringify(nextChar)} at position ${this.position}; expected ${JSON.stringify(expectedChar)}`,
                this.source,
                this.position
            );
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
