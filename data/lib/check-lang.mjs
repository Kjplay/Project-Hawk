"use strict";
/*
Module used for language operiations
@TO-DO:
- useLang() -> cleaner code
- Promise -> async function wherever possible
- throwing instead of rejecting
- add string splice to utils
@FUTURE:
- in ES 2020 use String.matchAll() - currently not supported in chromium
@CONSIDER:
- use <lang code"EN" expression="something"></lang> elements for live changes
- lang.translate() working with lang elements
*/
//dependencies
const userData = libs.req("userData");
const utils = libs.req("utils");
const joinPath = libs.req("joinPath");
const data = libs.req("data");
//custom vars
var loadedObj;
var current;
const omitted = ["SCRIPT", "CANVAS", "IMG"]; //omitted html tags - have to be upper case
const forbiddenAttrs = ["no-lang"]; //forbidden attributes - case sensitive
const parsedPath = "config-data/lang-data.json";
//utility
var splice = function (string, idx, rem, str) {
  return string.slice(0, idx) + str + string.slice(idx + Math.abs(rem));
};

//load Object to memory
export async function loadObject(config) {
  let { code, pack } = config;
  let obj = await data.requireJSON(joinPath("config-data/lang", pack));
  loadedObj = obj.data;
  current = code;
  return loadedObj;
}
//make list of all avabile languages and their packs
export function langList() {
  return new Promise(async function (resolve, reject) {
    var packs = [];
    var names = [];
    var langConfig = await userData.requireJSON(parsedPath);
    for (let p in langConfig.packages) {
      packs.push(p.code);
      names.push(p.name)
    }
    resolve({
      codes: packs,
      names: names
    });
  });
}
//process element/string for lang phrases - try to use loaded object/current/default
export function useLang(element, lang) {
  return new Promise(async function (resolve, reject) {
    var langConfig = await userData.requireJSON(parsedPath);
    if (typeof lang == "string") {
      if (current !== lang) {
        if (!(lang in langConfig.packages)) return reject(new Error("Non exisiting language requested!"));
        await loadObject(langConfig.packages[lang]);
      } 
    } else {
      if (!current) await loadObject(langConfig.packages[langConfig.current]);
      resolve(processLang(element));
    }
  });
};
//actual element processing
export function processLang(element) {
  if (element.nodeType === Node.ELEMENT_NODE) element = [element];
  if (element instanceof Array || element instanceof NodeList) {
    element.forEach(function (el) {
      if (!(forbiddenAttrs.every(attr => { return !el.hasAttribute(attr); })) || omitted.includes(el.tagName)) return;
      el.childNodes.forEach(function (el) {
        switch (el.nodeType) { //CONTENTS
          case Node.ELEMENT_NODE:
            if (!(forbiddenAttrs.every(attr => { return !el.hasAttribute(attr); })) || omitted.includes(el.tagName)) return;
            processLang(el);
            break;
          case Node.TEXT_NODE:
            el.nodeValue = replaceString(el.nodeValue, loadedObj);
            break;
          default:
            break; //do nothing
        }
      });
      for (let attr of el.attributes) {
        attr.value = replaceString(attr.value, loadedObj);
      }
    });
    return element;
  } else if (typeof element === "string") {
    return replaceString(element, loadedObj);
  }
};
//actual text processing
export function replaceString(input, obj) {
  var reg = /\[lang:(.*?)\]/i;
  let match, index, len, exp, Case;
  while (input.search(reg) >= 0) {
    match = input.match(reg)[0];
    index = input.match(reg).index;
    len = match.length;
    exp = match.replace(/([\]\s]|\[lang:)/gi, "");
    if (obj[exp.toLowerCase()]) {
      let rep = utils.matchCase(exp, obj[exp.toLowerCase()]);
      input = splice(input, index, len, rep);}
    else input = splice(input, index, len, exp);
  }
  return input;
};
//get or set dafault
export function defaultLang(def) {
  return new Promise(async function (resolve, reject) {
    if (typeof def === "string" && def !== "") {
      let obj = {
        default: def
      };
      let langConfig = await userData.requireJSON(parsedPath);
      if (!(def in langConfig.packages)) return reject(new Error("Cannot set invalid default!"));
      await userData.updateJSON(parsedPath, obj);
      resolve(obj.default);
    } else {
      let obj = await userData.requireJSON(parsedPath);
      resolve(obj.default);
    }
  });
};
//get or set current
export function currentLang(code, load) {
  return new Promise(async function (resolve, reject) {
    if (typeof code === "string" && code !== "") {
      let obj = {
        current: code
      };
      let langConfig = await userData.requireJSON(parsedPath);
      if (!(code in langConfig.packages)) return reject(new Error("Cannot set invalid current!"));
      await userData.updateJSON(parsedPath, obj)
    } else {
      let obj = await userData.requireJSON(parsedPath);
      resolve(obj.current);
    }
  });
};
//get certain lang pharse
export function getPhrase(lang, phrases) {
  return new Promise(async function (resolve, reject) {
    phrases = phrases instanceof Array ? phrases : [phrases];
    let out = [];
    if (typeof lang !== "string") return reject(new Error("Lang wasn't specified!"));
    if (lang === current) {
      for (let phrase of phrases) {
        out.push(loadedObj[phrase]);
      }
      resolve(out);
    } else {
      var langConfig = await userData.requireJSON(parsedPath);
      if (!(lang in langConfig.packages)) return reject(new Error("Invalid lang!"));
      var langdata = await data.requireJSON(joinPath("config-data/lang", langConfig.packages[lang].pack));
      for (let phrase of phrases) {
        out.push(langdata.data[phrase]);
      }
      resolve(out);
    }
  });
};