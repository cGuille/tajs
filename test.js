import ParseError from './src/parse-error.js';
import Parser from './src/parser.js';
import Tag from './src/tag.js';

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

test('With nested tags', () => {
    // Given
    const input = `\
<html>
    <body>
        <h1>This is a test!</h1>
        <p    class="hello-world">Hello, World!</p>
    </body>
</html>
`;
    const parser = new Parser();

    // When
    const tags = parser.parse(input);

    // Then
    expect(tags).toHaveLength(1);

    const html = tags[0];

    expect(html).toBeInstanceOf(Tag);
    expect(html.name).toEqual('html');
    expect(html.text).toEqual('\n    \n');
    expect(html.attributes.size).toBe(0);
    expect(html.children).toHaveLength(1);

    const body = html.children[0];

    expect(body).toBeInstanceOf(Tag);
    expect(body.name).toEqual('body');
    expect(body.text).toEqual('\n        \n        \n    ');
    expect(body.attributes.size).toBe(0);
    expect(body.children).toHaveLength(2);

    const h1 = body.children[0];

    expect(h1).toBeInstanceOf(Tag);
    expect(h1.name).toEqual('h1');
    expect(h1.text).toEqual('This is a test!');
    expect(h1.attributes.size).toBe(0);
    expect(h1.children).toHaveLength(0);

    const p = body.children[1];

    expect(p).toBeInstanceOf(Tag);
    expect(p.name).toEqual('p');
    expect(p.text).toEqual('Hello, World!');
    expect(p.attributes.size).toBe(1);
    expect(p.attributes.get('class')).toEqual('hello-world');
    expect(p.children).toHaveLength(0);
});

test('With multiple tags', () => {
    // Given
    const input = `\
<script type="application/json">
{
    "this is": "just an example"
}
</script>
<script type="text/javascript">
    alert('Hello, World!');
</script>
`;
    const parser = new Parser();

    // When
    const tags = parser.parse(input);

    // Then
    expect(tags).toHaveLength(2);

    tags.forEach(tag => expect(tag).toBeInstanceOf(Tag));

    expect(tags[0].name).toEqual('script');
    expect(tags[0].text).toEqual('\n{\n    "this is": "just an example"\n}\n');
    expect(tags[0].attributes.get('type')).toEqual('application/json');

    expect(tags[1].name).toEqual('script');
    expect(tags[1].text).toEqual("\n    alert('Hello, World!');\n");
    expect(tags[1].attributes.get('type')).toEqual('text/javascript');
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
