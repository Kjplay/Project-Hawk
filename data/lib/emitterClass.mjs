const utils = libs.req("utils");
/*
basic EventEmitter class bc when u exposeInMainWorld 'events' module it exposes empty object
*/
export default class Emitter {
  constructor() {
    return this;
  }
  #emitFunctions = new Map();
  #onceEmit = new Map();
  on (name, handler) {
    utils.assert([...arguments], ["string", "function"]);
    if (this.#emitFunctions.has(name)) {
      let ar = this.#emitFunctions.get(name);
      this.#emitFunctions.set(name, ar.push(handler));
    } else this.#emitFunctions.set(name, [handler]);
    
  }
  once (name, handler) {
    utils.assert([...arguments], ["string", "function"]);
    if (this.#onceEmit.has(name)) {
      let ar = this.#onceEmit.get(name);
      this.#onceEmit.set(name, ar.push(handler));
    } else this.#onceEmit.set(name, [handler]);
  }
  emit (name, ...args) {
    utils.assert([name], ["string"]);
    if (this.#emitFunctions.has(name)) {
      for (let h of this.#emitFunctions.get(name)) h.call(h, ...args);
    }
    if (this.#onceEmit.has(name)) {
      for (let h of this.#onceEmit.get(name)) h.call(h, ...args);
      this.#onceEmit.delete(name);
    }
  }
  off (name) {
    utils.assert([name], ["string"]);
    if (this.#emitFunctions.has(name)) this.#emitFunctions.delete(name);
    if (this.#onceEmit.has(name)) this.#onceEmit.delete(name);
  }
};