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
    {
        description: 'a tag with a single attribute',
        input: '<dummy example="This is an example attribute w/ &quot;some&quot; text"></dummy>',
        expected: {
            tagName: 'dummy',
            text: '',
            attributes: new Map([
                ['example', 'This is an example attribute w/ &quot;some&quot; text'],
            ]),
        },
    },
    {
        description: 'a tag with a multiple attributes',
        input: '<dummy attr1="val1" attr2="val2"></dummy>',
        expected: {
            tagName: 'dummy',
            text: '',
            attributes: new Map([
                ['attr1', 'val1'],
                ['attr2', 'val2'],
            ]),
        },
    },
    {
        description: 'a tag with a duplicated attributes',
        input: '<dummy attr1="val1" attr2="val2" attr1="val3"></dummy>',
        expected: {
            tagName: 'dummy',
            text: '',
            attributes: new Map([
                ['attr1', 'val3'],
                ['attr2', 'val2'],
            ]),
        },
    },
    {
        description: 'a tag with a multi-line attributes',
        input: '<dummy\nattr1="val1"\nattr2="val2"\n></dummy>',
        expected: {
            tagName: 'dummy',
            text: '',
            attributes: new Map([
                ['attr1', 'val1'],
                ['attr2', 'val2'],
            ]),
        },
    },
    {
        description: 'a tag with both attributes and text node',
        input: `
<dummy
    attr1="val1"
    attr2="val2"
>
    Dummy text node
</dummy>`,
        expected: {
            tagName: 'dummy',
            text: '\n    Dummy text node\n',
            attributes: new Map([
                ['attr1', 'val1'],
                ['attr2', 'val2'],
            ]),
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
    {
        description: 'a tag with an attribute containing double quotes',
        input: `<dummy example="Wow, "this" is not OK"></dummy>`,
    },
    {
        description: 'a tag with an attribute containing backslash escaped double quotes',
        input: `<dummy example="Wow, \\"this\\" is not OK"></dummy>`,
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
