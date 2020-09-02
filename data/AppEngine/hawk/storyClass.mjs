/*
Story class is a class used to load, create, save and load stories inside the App
For exporting story to a playable format see StoryDispatcher (currently to do)
@TO_DO:
- data validation (eg. Passages, Tags, positionGroups, whole StoryFiles) - DONE
- PositionGroups functions
- on, once functions from emitter accesible directly as class methods - DONE
- given attributes should be trimmed - DONE
- rename Passage, migrate Story, get a copy with a different ID, edit Tag
- needsUpdate getter
- lenghten the ID - DONE
- update functions
- Story.getAll() should give only valid stories
@FUTURE:
- from chromium 83 use private methods instead of private fields as arrow functions
- More events
@CONSIDER
- throw Error on validation - NO
- validation when saving to file
*/

//dependencies
const helpers = libs.req("helpers");
const userData = libs.req("userData");
const utils = libs.req("utils");
import EventEmitter from "../../lib/emitterClass.mjs";
//constants
const allowedTagKeys = ["color"];
const allowedPosKeys = ["color", "pointsArray"];
const allowedPasKeys = ["tags", "positionGroups", "content"]; //name is the key here
const allowedAttrKeys = ["title", "author", "author", "passages", "date_created", "id", "date_modified", "hawk_version"];
const allowedDataKeys = ["tags", "positionGroups", "passages", "grid"];
//containers
var selected = null;
var container = {
  stories: {}
};
export default class HawkStory {
  constructor(attributes, data) {
    this.#applyAttrs(attributes);
    this.#applyData(data);
    this.#updateAttrs();
    container.stories[this.fullName] = this;
  }
  #attributes = {}
  #data = {
    grid: {
      w: 4000,
      h: 2000
    },
    tags: {},
    passages: {},
    positionGroups: {}
  }
  //emitter functions
  #emitter = new EventEmitter();
  on(...args) {
    this.#emitter.on(...args);
    return this;
  }
  once(...args) {
    this.#emitter.once(...args);
    return this;
  }
  //basic attributes getters
  getData() {
    return {
      id: this.id, 
      fullName: this.fullName,
      title: this.title,
      passages: this.passages,
      datemodified: this.dateModified,
      datecreated: this.dateCreated
    }
  }
  getGrid() {
    return this.#data.grid;
  }
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
    if (selected instanceof HawkStory) return selected.fullName === this.fullName;
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
    if (selected instanceof HawkStory && selected.fullName === this.fullName) selected = null;
  }
  async load() {
    try {
      let attrs = await userData.requireJSON(`stories/${this.fullName}/attributes.json`);
      let data = await userData.requireJSON(`stories/${this.fullName}/data.json`);
      this.#applyData(data);
      this.#applyAttrs(attrs);
      this.#updateAttrs();
      if (selected instanceof HawkStory) await selected.unload();
      selected = this;
    } catch (e) {
      throw e;
    }
  }
  async delete() {
    if (selected instanceof HawkStory && selected.fullName === this.fullName) selected = null;
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
    if (selected instanceof HawkStory && selected.fullName === name) selected = null;
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
    if (selected instanceof HawkStory) selected.unload();
  }
  update(attributes, data) {
    this.#applyAttrs(attributes);
    this.#applyData(data);
    this.#emitter.emit("update");
  }
  static getSelected() { //we assume selected is cached
    return selected;
  }
  static async getAll(useCache = true) { //attributes ONLY
    let cachedNames = [];
    if (useCache) cachedNames = Object.keys(container.stories);
    let names = await userData.getDirNames("stories");
    var out = {};
    for (let n of names) {
      out[n] = cachedNames.includes(n) ? container.stories[n] : await HawkStory.#loadOneAttrsFromDir(n);
    }
    return out;
  }
  static async getByName(name, useCache) {
    let s = await HawkStory.getAll(useCache);
    for (let key in s) {
      let sName = key.slice(0, key.lastIndexOf(" ")).trim();
      if (sName !== name) delete s[key];
    }
    return s;
  }
  static async getByID(id, useCache) {
    let s = await HawkStory.getAll(useCache);
    for (let key in s) {
      let sID = key.slice(key.lastIndexOf(" ")).trim();
      if (sID !== id) delete s[key];
    }
    return s;
  }
  //Passage functions
  createPassage(name, tagsArr, content) {
    this.#data.passages[name].name = name;
    this.#data.passages[name].tagsArr = tagsArr;
    this.#data.passages[name].content = content;
    this.#recalculateAttrs();
    this.#emitter.emit("update");
  }
  editPassage(name, tags, content) {
    if (Array.isArray(tags)) this.#data.passages[name].tags = tags;
    if (typeof content === "string") this.#data.passages[name].content = content;
    this.#emitter.emit("update");
  }
  getPassage(name) {
    return this.#data.passages[name];
  }
  hasPassage(name) {
    return utils.isObject(this.#data.passages[name]);
  }
  deletePassage(name) {
    if (name in this.#data.passages) delete this.#data.passages[name];
    this.#recalculateAttrs();
    this.#emitter.emit("update");
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
  //validate functions
  #validateAttributes(attrs) { //not all attributes are required
    return utils.isObject(attrs) && Object.keys(attrs).every(e => allowedAttrKeys.includes(e));
  }
  #validateData(data) {
    return utils.isObject(data) && allowedDataKeys.every(k => k in data) && this.#validateTags(data.tags) && this.#validatePositionGroups(data.positionGroups) && this.#validatePassages(data.passages);
  }
  #validatePassages(pasObj) {
    if (!utils.isObject(pasObj)) return false;
    for (let p in pasObj) if (!this.#validatePassage(p)) return false;
    return true;
  }
  #validateTags(tagsObj) {
    if (!utils.isObject(tagsObj)) return false;
    for (let t in tagsObj) if (!this.#validateTag(t)) return false;
    return true;
  }
  #validatePositionGroups(posObj) {
    if (!utils.isObject(posObj)) return false;
    for (let p in posObj) if (!this.#validatePositionGroup(p)) return false;
    return true;
  }
  #validatePassage(pasObj) {
    return utils.isObject(pasObj) && allowedPasKeys.every(pasKey => pasKey in pasObj) && Object.keys(pasObj).length === allowedPasKeys.length && pasObj.positionGroups.every(p => p in this.#data.positionGroups) && pasObj.tags.every(t => t in this.#data.tags) && typeof pasObj.content === "string";
  }
  #validateTag(tagObj) {
    return utils.isObject(tagObj) && allowedTagKeys.every(tagKey => tagKey in tagObj) && Object.keys(tagObj).length === allowedTagKeys.length;
  }
  #validatePositionGroup(posGroup) {
    return utils.isObject(posGroup) && allowedPosKeys.every(posKey => posKey in posGroup) && posGroup.pointsArray.every(point => this.#validatePoint(point)) && Object.keys(posGroup).length === allowedPosKeys.length;
  }
  #validatePoint(point) {
    return Array.isArray(point) && point.length === 2 && point.every(n => typeof n === "number");
  }
  //private utils
  #applyData(data) {
    if (this.#validateData(data)) this.#data = data;
    this.#recalculateAttrs();
  }
  #applyAttrs(attrs) {
    if (this.#validateAttributes(attrs)) {
      for (let key in attrs) if (typeof attrs[key] === "string") attrs[key].trim();
      this.#attributes = attrs;
      if (this.#attributes.date_modified) this.#attributes.date_modified = new Date(this.#attributes.date_modified);
      if (this.#attributes.date_created) this.#attributes.date_created = new Date(this.#attributes.date_created);
    };
  }
  #recalculateAttrs() {
    this.#attributes.passages = Object.keys(this.#data.passages).length;
    this.#attributes.date_modified = new Date();
  }
  #updateAttrs() {
    this.#attributes.passages = this.#attributes.passages ? this.#attributes.passages : Object.keys(this.#data.passages).length;
    this.#attributes.date_created = this.#attributes.date_created ?  this.#attributes.date_created : new Date();
    this.#attributes.date_modified = new Date();
  }
  static async #loadOneAttrsFromDir(dir)  {
    let attrs = await userData.requireJSON(`stories/${dir}/attributes.json`);
    return new HawkStory(attrs); //cache
  }
}