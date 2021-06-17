class Node {
}

export class TextNode extends Node {
    constructor(content) {
        super();

        this.content = content || '';
    }

    get textContent() {
        return this.content;
    }

    set textContent(content) {
        this.content = content;
    }
}

export class ElementNode extends Node {
    constructor(tagName) {
        super();

        this.tagName = tagName;
        this.children = [];
        this.attributes = new Map();
    }

    get textContent() {
        return this.children.reduce((acc, childNode) => acc + childNode.textContent, '');
    }

    set textContent(content) {
        this.children = this.children.filter(child => child instanceof TextNode);
        this.children.push(new TextNode(content));
    }
}
