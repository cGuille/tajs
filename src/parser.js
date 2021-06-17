import { ElementNode, TextNode } from './node.js';
import ParseError from './parse-error.js';

const tokenRegExp = /\w|-/;
const whitespacesRegExp = /\s/;

const isTokenChar = RegExp.prototype.test.bind(tokenRegExp);
const isWhitespace = RegExp.prototype.test.bind(whitespacesRegExp);

export default class Parser {
    parse(source) {
        this.source = source;
        this.position = 0;

        const elements = [];

        do {
            this.consumeWhitespaces();
            elements.push(this.parseElement());
            this.consumeWhitespaces();
        } while (!this.isAtEof());

        return elements;
    }

    parseElement() {
        this.consumeNextChar('<');

        const tagName = this.consumeToken();
        if (!tagName) {
            throw new ParseError('Tag name cannot be empty', this.source, this.position);
        }

        const element = new ElementNode(tagName);

        this.parseAttributes(element);

        this.consumeNextChar('>');

        const text = this.consumeWhile(nextChar => nextChar !== '<');
        if (text) {
            element.children.push(new TextNode(text));
        }

        while (this.nextChar() === '<' && this.lookAhead(1) !== '/') {
            element.children.push(this.parseElement());

            const text = this.consumeWhile(nextChar => nextChar !== '<');
            if (text) {
                element.children.push(new TextNode(text));
            }
        }

        this.consumeNextChar('<');
        this.consumeNextChar('/');

        const closingTagName = this.consumeToken();

        if (element.tagName !== closingTagName) {
            throw new ParseError(
                `Tag name '${element.tagName}' and closing tag name '${closingTagName}' do not match`,
                this.source,
                this.position - closingTagName.length
            );
        }

        this.consumeNextChar('>');

        return element;
    }

    parseAttributes(element) {
        let attribute = null;

        while (attribute = this.parseAttribute()) {
            element.attributes.set(attribute.name, attribute.value);
        }
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
