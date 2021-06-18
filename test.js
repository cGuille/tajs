import { ElementNode, TextNode } from './src/node.js';
import ParseError from './src/parse-error.js';
import Parser from './src/parser.js';

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
            serialisation: '<dummy attr1="val3" attr2="val2"></dummy>',
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
            serialisation: '<dummy attr1="val1" attr2="val2"></dummy>',
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
            serialisation: '<dummy attr1="val1" attr2="val2">\n    Dummy text node\n</dummy>',
        },
    },
];

describe.each(singleTagInputs)('The parser returns a list containing the parsed element', testCase => {
    test(`with ${testCase.description}`, () => {
        // Given
        if (typeof(testCase.expected.serialisation) === 'undefined') {
            testCase.expected.serialisation = testCase.input;
        }

        const parser = new Parser();

        // When
        const result = parser.parse(testCase.input);

        // Then
        expect(result).toHaveLength(1);

        const element = result[0];

        expect(element).toBeInstanceOf(ElementNode);
        expect(element.tagName).toEqual(testCase.expected.tagName);
        expect(element.textContent).toEqual(testCase.expected.text);

        expect(element.attributes.size).toEqual(testCase.expected.attributes.size);
        testCase.expected.attributes.forEach((expectedValue, attributeName) => {
            expect(element.attributes.get(attributeName)).toEqual(expectedValue);
        });

        expect(element.toString()).toEqual(testCase.expected.serialisation);
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
    const elements = parser.parse(input);

    // Then
    expect(elements).toHaveLength(1);

    const html = elements[0];

    expect(html).toBeInstanceOf(ElementNode);
    expect(html.tagName).toEqual('html');
    expect(html.textContent).toEqual('\n    \n        This is a test!\n        Hello, World!\n    \n');
    expect(html.attributes.size).toBe(0);
    expect(html.children).toHaveLength(3);

    expect(html.children[0]).toBeInstanceOf(TextNode);
    expect(html.children[0].textContent).toEqual('\n    ');

    const body = html.children[1];

    expect(html.children[2]).toBeInstanceOf(TextNode);
    expect(html.children[2].textContent).toEqual('\n');

    expect(body).toBeInstanceOf(ElementNode);
    expect(body.tagName).toEqual('body');
    expect(body.textContent).toEqual('\n        This is a test!\n        Hello, World!\n    ');
    expect(body.attributes.size).toBe(0);
    expect(body.children).toHaveLength(5);

    expect(body.children[0]).toBeInstanceOf(TextNode);
    expect(body.children[0].textContent).toEqual('\n        ');

    const h1 = body.children[1];

    expect(body.children[2]).toBeInstanceOf(TextNode);
    expect(body.children[2].textContent).toEqual('\n        ');

    const p = body.children[3];

    expect(body.children[4]).toBeInstanceOf(TextNode);
    expect(body.children[4].textContent).toEqual('\n    ');

    expect(h1).toBeInstanceOf(ElementNode);
    expect(h1.tagName).toEqual('h1');
    expect(h1.textContent).toEqual('This is a test!');
    expect(h1.attributes.size).toBe(0);
    expect(h1.children).toHaveLength(1);

    expect(h1.children[0]).toBeInstanceOf(TextNode);
    expect(h1.children[0].textContent).toEqual('This is a test!');

    expect(p).toBeInstanceOf(ElementNode);
    expect(p.tagName).toEqual('p');
    expect(p.textContent).toEqual('Hello, World!');
    expect(p.attributes.size).toBe(1);
    expect(p.attributes.get('class')).toEqual('hello-world');
    expect(p.children).toHaveLength(1);

    expect(p.children[0]).toBeInstanceOf(TextNode);
    expect(p.children[0].textContent).toEqual('Hello, World!');

    const expectedSerialisation = `\
<html>
    <body>
        <h1>This is a test!</h1>
        <p class="hello-world">Hello, World!</p>
    </body>
</html>`;

    expect(html.toString()).toEqual(expectedSerialisation);
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
    const elements = parser.parse(input);

    // Then
    expect(elements).toHaveLength(2);

    elements.forEach(element => expect(element).toBeInstanceOf(ElementNode));

    expect(elements[0].tagName).toEqual('script');
    expect(elements[0].textContent).toEqual('\n{\n    "this is": "just an example"\n}\n');
    expect(elements[0].attributes.get('type')).toEqual('application/json');

    expect(elements[1].tagName).toEqual('script');
    expect(elements[1].textContent).toEqual("\n    alert('Hello, World!');\n");
    expect(elements[1].attributes.get('type')).toEqual('text/javascript');
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
