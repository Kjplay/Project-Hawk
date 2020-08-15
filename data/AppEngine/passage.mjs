/*
* @TODO: Add title verification
*
*
*/
import PositionDescriptor from "./positionDescriptor.mjs";
import Tag from "./Tag.mjs";
export default class Passage {
    constructor(Obj) {
        this.update(Obj);
    }
    #tags = []
    #text = ""
    #title = ""
    #position
    update({title, text, tags, positionDescriptor}) {
        if (title instanceof String) this.#title = title;
        if (text instanceof String) this.#text = text;
        if (tags instanceof Array) this.#tags = tags;
        if (positionDescriptor instanceof PositionDescriptor) this.#position = positionDescriptor;
    }
    toJSON() {
        return {
            tags: this.#tags,
            text: this.#text,
            title: this.#title,
            position: this.#position
        }
    }
    static fromJSON({title, text, tags, positionDescriptor}) {
        if (tags instanceof Array) tags = tags.map(t => Tag.fromJSON(t));
        if (positionDescriptor instanceof PositionDescriptor) positionDescriptor = PositionDescriptor.fromJSON(positionDescriptor);
        return new Passage({title,text, tags, positionDescriptor});
    }
};