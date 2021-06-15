const tajs = require('./src/tajs');
const Parser = tajs.Parser;
const Tag = tajs.Tag;
const ParseError = tajs.ParseError;

const singleTagInputs = [
    {
        description: 'a tag without attributes nor text node',
        input: '<dummy></dummy>',
        expected: {
            tagName: 'dummy',
            text: '',
            attributes: new Map(),
        },
    },
    {
        description: 'a tag with a single-line text node',
        input: '<dummy>Dummy tag content</dummy>',
        expected: {
            tagName: 'dummy',
            text: 'Dummy tag content',
            attributes: new Map(),
        },
    },
    {
        description: 'a tag with a multi-line text node',
        input: '<dummy>Dummy\nmulti-line\ntag\ncontent</dummy>',
        expected: {
            tagName: 'dummy',
            text: 'Dummy\nmulti-line\ntag\ncontent',
            attributes: new Map(),
        },
    },
];

describe.each(singleTagInputs)('The parser returns a list containing the parsed tag', testCase => {
    test(`with ${testCase.description}`, () => {
        // Given
        const parser = new Parser();

        // When
        const result = parser.parse(testCase.input);

        // Then
        expect(result).toHaveLength(1);

        const tag = result[0];

        expect(tag).toBeInstanceOf(Tag);
        expect(tag.name).toEqual(testCase.expected.tagName);
        expect(tag.text).toEqual(testCase.expected.text);

        expect(tag.attributes.size).toEqual(testCase.expected.attributes.size);
        testCase.expected.attributes.forEach((expectedValue, attributeName) => {
            expect(tag.attributes.get(attributeName)).toEqual(expectedValue);
        });
    });
});

const invalidInputs = [
    {
        description: 'a single word',
        input: 'foo',
    },
    {
        description: 'non matching tags',
        input: '<foo></bar>',
    },
];

describe.each(invalidInputs)('The parser throws a ParseError', testCase => {
    test(`with ${testCase.description}`, () => {
        // Given
        const parser = new Parser();

        // When
        const behaviour = () => {
            parser.parse(testCase.input);
        };

        // Then
        expect(behaviour).toThrow(ParseError);
    });
});
