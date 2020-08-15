/*
* @TODO: Add color and name verification
*
*
*
*/


export default class Tag {
    constructor(obj) {
        this.update(obj);
    }
    #color = ""
    #name = ""
    update({color, name}) {
        if (color instanceof String) this.#color = color;
        if (name instanceof String) this.#name = name;
    }
    toJSON() {
        return {
            name: this.#name,
            color: this.#color
        }
    }
    static fromJSON({name, color}) {
        return new Tag({name, color});
    }
}