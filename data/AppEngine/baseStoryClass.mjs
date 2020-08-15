/*
Story class is a class used to load, create, save and load stories inside the App
For exporting story to a playable format see StoryDispatcher (currently to do)
@TO_DO:
- Data to JSON
- save() as a static, and wrapped in a non static
- Tags
- Positions
- PositionGroups
- fromJSON()
@FUTURE:
- from chromium 83 use private methods instead of private fields as arrow functions
- More events
@CONSIDER
- validation when saving to file
*/

//dependencies
const helpers = libs.req("helpers");
const userData = libs.req("userData");
const utils = libs.req("utils");
import EventEmitter from "../../lib/emitterClass.mjs";
import Passage from "./passage.mjs";
//constants
const allowedTagKeys = ["color"];
const allowedPosKeys = ["color", "pointsArray"];
const allowedPasKeys = ["tags", "positionGroups", "content"]; //name is the key here
const allowedAttrKeys = ["title", "author", "author", "passages", "date_created", "id", "date_modified"];
//containers
var selected = null;
var container = {
  stories: {}
};
export default class Story extends EventEmitter {
  constructor(attributes, data) {
    this.#applyAttrs(attributes);
    this.#applyData(data);
    this.#updateAttrs();
    container.stories[this.fullName] = this;
  }
  #attributes = {}
  #data = {
    tags: {},
    passages: {},
    positionGroups: {}
  }
  //emitter functions
  //basic attributes getters
  get id() {
    if (!this.#attributes.id) this.#attributes.id = helpers.randomString(24);
    return this.#attributes.id;
  }
  get fullName() {
    return this.#attributes.title+" "+this.id;
  }
  get title() {
    return this.#attributes.title;
  }
  get passages() {
    return this.#attributes.passages;
  }
  get isSelected() {
    if (selected instanceof Story) return selected.fullName === this.fullName;
    return false;
  }
  get dateModified() {
    return this.#attributes.date_modified.toLocaleString();
  }
  get dateCreated() {
    return this.#attributes.date_created.toLocaleString();
  }
  //loading and saving
  async save() {
    this.#recalculateAttrs();
    //validation?
    await userData.mkdir(`stories/${this.fullName}`);
    await userData.replaceJSON(`stories/${this.fullName}/attributes.json`, this.#attributes);
    await userData.replaceJSON(`stories/${this.fullName}/data.json`, this.#data);
    return true;
  }
  async saveAttributes() {
    this.#recalculateAttrs();
    await userData.mkdir(`stories/${this.fullName}`);
    await userData.replaceJSON(`stories/${this.fullName}/attributes.json`, this.#attributes);
  }
  async unload() {
    this.#data = {
      tags: [],
      passages: {},
      positionGroups: {}
    }
    container.stories[this.fullName] = this;
    if (selected instanceof Story && selected.fullName === this.fullName) selected = null;
  }
  async load() {
    try {
      let attrs = await userData.requireJSON(`stories/${this.fullName}/attributes.json`);
      let data = await userData.requireJSON(`stories/${this.fullName}/data.json`);
      this.#applyData(data);
      this.#applyAttrs(attrs);
      this.#updateAttrs();
      if (selected instanceof Story) await selected.unload();
      selected = this;
    } catch (e) {
      throw e;
    }
  }
  async delete() {
    if (selected instanceof Story && selected.fullName === this.fullName) selected = null;
    await userData.delete(`stories/${this.fullName}`);
    delete container.stories[this.fullName];
    this.#attributes = {};
    this.#data = {
      tags: {},
      passages: {},
      positionGroups: {}
    };
  }
  static async delete(name) {
    if (selected instanceof Story && selected.fullName === name) selected = null;
    try {
      await userData.delete(`stories/${name}`);
      delete container.stories[name];
      return true;
    } catch (e) {
      console.error(e);
      console.error("Couldn't delete "+name+" story!");
      return false;
    }
  }
  static removeSelected() {
    if (selected instanceof Story) selected.unload();
  }
  update(attributes, data) {
    this.#applyAttrs(attributes);
    this.#applyData(data);
    this.emit("update");
  }
  static getSelected() { //we assume selected is cached
    return selected;
  }
  static async getAll(useCache) { //attributes ONLY
    useCache = typeof useCache !== "boolean" ? true : useCache;
    let cachedNames = [];
    if (useCache) cachedNames = Object.keys(container.stories);
    let names = await userData.getDirNames("stories");
    var out = {};
    for (let n of names) {
      if (cachedNames.includes(n)) out[n] = container.stories[n];
      else out[n] = await Story.#loadOneAttrsFromDir(n);
    }
    return out;
  }
  static async getByName(name, useCache) {
    let s = await Story.getAll(useCache);
    for (let key in s) {
      let sName = key.slice(0, key.lastIndexOf(" ")).trim();
      if (sName !== name) delete s[key];
    }
    return s;
  }
  static async getByID(id, useCache) {
    let s = await Story.getAll(useCache);
    for (let key in s) {
      let sID = key.slice(key.lastIndexOf(" ")).trim();
      if (sID !== id) delete s[key];
    }
    return s;
  }
  //Passage functions
  createPassage({title, tags, text, positionDescriptor}) {
    //@TODO add default positionDescriptor
    this.#data.passages[name] = new Passage({title, tags, text, positionDescriptor});
    this.#recalculateAttrs();
    this.emit("update");
  }
  addPassage(passageObj) {
    if (passageObj instanceof Passage) this.#data.passages[name] = passageObj;
  }
  updatePassage({name, tags, text, positionDescriptor}) {
    if (this.#data.passages[name] instanceof Passage) this.#data.passages[name].update({name, tags, text, positionDescriptor});
    this.emit("update");
  }
  getPassage(name) {
    return this.#data.passages[name];
  }
  hasPassage(name) {
    return this.#data.passages[name] instanceof Passage;
  }
  deletePassage(name) {
    if (name in this.#data.passages) delete this.#data.passages[name];
    this.#recalculateAttrs();
    this.emit("update");
  }
  //Tag functions
  createTag(name, color) {
    this.#data.tags[name] = {
      color: color
    };
  }
  deleteTag(name) {
    if (name in this.#data.tags) delete this.#data.tags[name];
  }
  //private utils
  #applyData = data => {
    if (this.#validateData(data)) this.#data = data;
    this.#recalculateAttrs();
  }
  #applyAttrs = attrs => {
    console.log(attrs);
    if (this.#validateAttributes(attrs)) {
      console.log("validated");
      for (let key in attrs) if (typeof attrs[key] === "string") attrs[key].trim();
      this.#attributes = attrs;
    };
    if (this.#attributes.date_modified) this.#attributes.date_modified = new Date(this.#attributes.date_modified);
    if (this.#attributes.date_created) this.#attributes.date_created = new Date(this.#attributes.date_created);
  }
  #recalculateAttrs = () => {
    this.#attributes.passages = Object.keys(this.#data.passages).length;
    this.#attributes.date_modified = new Date();
  }
  #updateAttrs = () => {
    this.#attributes.passages = this.#attributes.passages ? this.#attributes.passages : Object.keys(this.#data.passages).length;
    this.#attributes.date_created = this.#attributes.date_created ?  this.#attributes.date_created : new Date();
    this.#attributes.date_modified = new Date();
  }
  static #loadOneAttrsFromDir = async (dir) => {
    let attrs = await userData.requireJSON(`stories/${dir}/attributes.json`);
    console.log(attrs);
    let s = new Story(attrs); //cache
    console.log(s);
    return s;
  }
}