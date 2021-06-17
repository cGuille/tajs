export default class Tag {
    constructor(name) {
        this.name = name;
        this.attributes = new Map();
        this.text = '';
        this.children = [];
    }
}
