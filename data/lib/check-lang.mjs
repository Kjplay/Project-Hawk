"use strict";
/*
Module used for language operations
@TODO:
- useLang() -> cleaner code DONE
- Promise -> async function wherever possible DONE
- throwing instead of rejecting DONE
- add string splice to utils DONE
@FUTURE:
- in ES 2020 use String.matchAll() DONE
@CONSIDER:
- use <lang code"EN" expression="something"></lang> elements for live changes DONE
- lang.translate() working with lang elements
@NOTE:
 - Config-checking is done in the main process, before window launches - we assume config is correct
*/
//dependencies
const userData = libs.req("userData");
const utils = libs.req("utils");
const joinPath = libs.req("joinPath");
const data = libs.req("data");
//custom vars
var loadedObj;
var current;
var config;
//constants
const omitted = ["SCRIPT", "CANVAS", "IMG"]; //omitted html tags - have to be upper case
const forbiddenAttrs = ["no-lang"]; //forbidden attributes - case sensitive
const parsedPath = "config-data/lang-data.json"; //path to config
const regex = /\[lang:\s*(\w{1,})\s*\]/gi; //regex for finding phrases

async function getConfig() {
  if (!(utils.isObject(config))) config = await userData.requireJSON(parsedPath);
  return config;
}
async function updateConfig(obj) {
  if (utils.isObject(obj)) {
    config = utils.merge(await getConfig(), obj);
    await userData.replaceJSON(parsedPath, config);
  }
}
//load Object to memory
export async function loadObject(config) {
  let {
    code,
    pack
  } = config;
  let obj = await data.requireJSON(joinPath("config-data/lang", pack));
  loadedObj = obj.data;
  current = code;
  return loadedObj;
}
//make a list of all avabile languages and their packs
export async function langList() {
  var packs = [];
  var names = [];
  var langConfig = await getConfig();
  for (let p in langConfig.packages) {
    packs.push(p.code);
    names.push(p.name)
  }
  return {
    codes: packs,
    names: names
  };
}
//process element/string for lang phrases - try to use loaded object/current
export async function useLang(element) {
    var langConfig = await getConfig();
    if (!current) await loadObject(langConfig.packages[langConfig.current]);
    if (element.tagName === "HTML") element.setAttribute("lang", current.toLowerCase());
    return processLang(element);
};
//actual element processing
function processLang(element) {
  if (element.nodeType === Node.ELEMENT_NODE) element = [element];
  if (element instanceof Array || element instanceof NodeList) {
    for (let el of element) {
      if (!(forbiddenAttrs.every(attr => {
          return !el.hasAttribute(attr);
        })) || omitted.includes(el.tagName)) return;
      for (let ch of el.childNodes) {
        if (ch.nodeType == Node.ELEMENT_NODE) processLang(ch);
        else if (ch.nodeType == Node.TEXT_NODE) replaceStringToElement(ch, loadedObj);
      }
      attributesProcessor(el, loadedObj);
    }
    return element;
  } else if (typeof element === "string") {
    return replaceString(element, loadedObj);
  }
};
//actual text processing
function replaceString(input, obj) {
  for (let m of input.matchAll(regex)) {
    let phrase;
    if (obj[m[1].toLowerCase()]) {
      phrase = obj[m[1].toLowerCase()];
      phrase = utils.matchCase(m[1], phrase);
    } else phrase = m[1];
    return utils.splice(input, m.index, m[0].length, phrase);
  }
  return null;
}
//textNode to <lang-data> element
function replaceStringToElement(textNode, obj) {
  for (let m of textNode.nodeValue.matchAll(regex)) {
    let phrase;
    if (obj[m[1].toLowerCase()]) {
      phrase = obj[m[1].toLowerCase()];
      phrase = utils.matchCase(m[1], phrase);
    } else phrase = m[1];
    let elem = document.createElement("lang-data");
    elem.setAttribute("code", current);
    elem.setAttribute("expression", m[1]);
    elem.innerHTML = phrase;
    textNode.replaceWith(textNode.nodeValue.slice(0, m.index), elem, textNode.nodeValue.slice(m.index + m[0].length));
  }
}

function attributesProcessor(element, obj) {
  let vals = [];
  for (let attr of element.attributes) {
    if (attr.name == "lang-attrs") continue;
    let out = replaceString(attr.value, obj);
    if (out) {
      vals.push(attr.name + "=" + attr.value);
      attr.value = out;
    }
  }
  if (vals.length > 0) element.setAttribute("lang-attrs", vals.join("&"));
}
//get or set dafault
export async function defaultLang(def) {
  let langConfig = await getConfig();
  if (typeof def === "string" && def !== "") {
    let obj = {
      default: def
    };
    if (!(def in langConfig.packages)) throw new Error(`Cannot set invalid default! (${def}) Valid codes: [${Object.keys(langConfig.packages).join(", ")}]`);
    await updateConfig(obj);
    return obj.default;
  } else {
    return langConfig.default;
  }
};
//get or set current
export function currentLang(code) {
  return new Promise(async function (resolve) {
    let langConfig = await getConfig();
    if (typeof code === "string" && code !== "") {
      let obj = {
        current: code
      };
      if (!(code in langConfig.packages)) throw new Error("Cannot set invalid current!");
      await updateConfig(obj);
      if (current !== code) { //unload old object
        loadedObj = null;
        current = null;
      }
    } else resolve(langConfig.current);
  });
};
//get certain lang pharse
export async function getPhrase(lang, phrases) {
  phrases = phrases instanceof Array ? phrases : [phrases];
  let out = [];
  lang = typeof lang == "string" ? lang : current;
  if (!lang) throw new Error(`Cannot get phrase! Invalid lang or not specified!`)
  if (lang === current) {
    for (let phrase of phrases) {
      out.push(loadedObj[phrase]);
    }
    return out;
  } else {
    let langConfig = await getConfig();
    if (!(lang in langConfig.packages)) throw new Error(`Invalid lang specified! (${lang}) Valid codes: [${Object.keys(langConfig.packages).join(", ")}]`);
    let langdata = await data.requireJSON(joinPath("config-data/lang", langConfig.packages[lang].pack));
    for (let phrase of phrases) {
      out.push(langdata.data[phrase]);
    }
    return out;
  }
};