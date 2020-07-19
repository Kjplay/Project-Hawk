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
const helpers = libs.req("helpers");
const utils = libs.req("utils");
const joinPath = libs.req("joinPath");
const getData = libs.req("getData");
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
//config repair
export async function evaluateConfig(jsonObj) {
  let entries = await data.directoryContents("config/data");
  let newObj = {};
  for (let entry of entries) {
    if (entry.type !== "file") continue;
    let js = await data.requireJSON(`config-data/lang/${entry.name}`);
    newObj[js.code] = {
      "pack": entry.name,
      "name": js.fullName
    }
  }
  jsonObj["packages"] = newObj;
  return jsonObj;
}
//check if current is valid
export async function checkLang() {
  const appPath = getData("appPath");
  let langConfig = await userData.requireJSON("config-data/lang-data.json");
  if (langConfig.current) {
    let check = await helpers.exists(joinPath(appPath, `config-data/lang/${langConfig.packages[langConfig.current].pack}`));
    if (check) return true;
    else throw new Error("Missing lang package. Invalid current!");
  } else return false;
}
//load Object to memory
export async function loadObject(p, lg) {
  const appPath = await getData("appPath");
  let obj = await helpers.requireJSON(joinPath(appPath, "config-data/lang", p));
  loadedObj = obj.data;
  current = lg;
  return loadedObj;
}
//make list of all avabile languages and their packs
export function langList() {
  return new Promise(async function (resolve, reject) {
    var packs = [];
    var names = [];
    var pr = [];
    var langConfig = await userData.requireJSON(parsedPath);
    if (Object.keys(langConfig.packages).length === 0) reject(new Error("No packages avabile!"));
    for (let pack in langConfig.packages) pr.push(checkPackage(langConfig.packages[pack].pack));
    Promise.all(pr).then(data => {
      for (let i = 0; i < data.length; i++) {
        if (data[i]) {
          let pack = Object.keys(langConfig.packages)[i].toUpperCase();
          let name = langConfig.packages[Object.keys(langConfig.packages)[i]].name;
          packs.push(pack);
          names.push(name);
        }
      }
      if (packs.length > 0 && names.length > 0) {
        resolve({
          codes: packs,
          names: names
        });
      } else reject(new Error("No valid packages!")); //no packs
    });
  });
}
//check if package is valid
export async function checkPackage(reqPath) {
  const appPath = await getData("appPath");
  return await helpers.exists(joinPath(appPath, `config-data/lang/${reqPath}`));
}
//process element/string for lang phrases - try to use loaded object/current/default
export function useLang(element, lang) {
  return new Promise(async function (resolve, reject) {
    var langConfig = await userData.requireJSON(parsedPath);
    if (langConfig.current) {
      if (current !== langConfig.current && current !== "" && current) { //need to update langconfig
        await current(current);
      }
      if (lang && lang !== current) {
        let p = langConfig.packages[current];
        if (p) p = p.pack;
        else {
          reject(new Error("Invalid current - leading to non-existing object property!"));
          return;
        }
        try {
          await loadObject(p, current);
          resolve(processLang(element));
        } catch (e) {
          reject(new Error("Invalid pack!"));
          return;
        }
      } else if (lang && current === lang && current !== "" && current) {
        resolve(processLang(element));
      } else {
        if (current == langConfig.current && loadedObj instanceof Object) {
          resolve(processLang(element, current));
        } else {
          try {
            await loadObject(langConfig.packages[langConfig.current].pack, langConfig.current);
            resolve(processLang(element));
          } catch (e) {
            console.error(e);
            reject(new Error("Invalid current!"));
            return;
          }
        }
      }
    } else {
      if (lang && lang !== "") {
        let p = langConfig.packages[lang];
        if (p) p = p.pack;
        else {
          reject(new Error("Invalid lang - leading to non-existing object property!"));
          return;
        }
        try {
          await loadObject(p, lang);
          resolve(processLang(element));
        } catch (e) {
          reject(new Error("Invalid pack!"));
          return;
        }
      } else {
        try {
          await loadObject(langConfig.packages[langConfig.default].pack, langConfig.default);
          resolve(processLang(element));
        } catch (e) {
          console.error(e);
          reject(new Error("Invalid pack!"));
          return;
        }
      }
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
      try {
        let out = await userData.updateJSON(parsedPath, obj);
        resolve(out);
      } catch (e) {
        reject(new Error("Error setting default!"));
      }
    } else {
      try {
        let obj = await userData.requireJSON(parsedPath);
        resolve(obj.default);
      } catch (e) {
        reject(new Error("Missing config - fatal error!"));
      }
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
      try {
        let out = await userData.updateJSON(parsedPath, obj);
        if (load) {
          try {
            let langConfig = await userData.requireJSON(parsedPath);
            let p = langConfig.packages[current];
            if (p) p = p.pack;
            else {
              reject(new Error("Invalid current - leading to non-existing object property!"));
              return;
            }
            try {
              await loadObject(p, current);
              resolve(code);
            } catch (e) {
              reject(new Error("Invalid pack!"));
              return;
            }
          } catch (e) {
            reject(new Error("Missing config - fatal error!"));
            return;
          }
        }
        resolve(out);
      } catch (e) {
        reject(new Error("Error setting current!"));
      }
    } else {
      try {
        let obj = await userData.requireJSON(parsedPath);
        resolve(obj.current);
      } catch (e) {
        reject(new Error("Missing config - fatal error!"));
      }
    }
  });
};
//get certain lang pharse
export function getPhrase(lang, phrases) {
  return new Promise(async function (resolve, reject) {
    phrases = phrases instanceof Array ? phrases : [phrases];
    if (lang && lang === current && loadedObj instanceof Object) {
      var out = [];
      for (let phrase of phrases) {
        out.push(loadedObj[phrase]);
      }
      resolve(out);
    } else {
      try {
        var langConfig = await userData.requireJSON(parsedPath);
        checkPackage(langConfig.packages[lang].pack).then(async function (check) {
          if (check) {
            let obj = await helpers.requireJSON(joinPath(appPath, "config-data/lang", langConfig.packages[lang].pack));
            var out = [];
            for (let phrase of phrases) {
              out.push(obj[phrase]);
            }
            resolve(out);
          } else {
            reject(new Error("Invalid pack!"));
          }
        });
      } catch (e) {
        console.error(e);
        reject(new Error("Missing config - fatal error!"));
      }
    }
  });
};