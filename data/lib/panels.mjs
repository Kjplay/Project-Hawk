"use strict";
/*
this is a library for managing contents of the main window without actually invoking new BrowserWindow()
@CONSIDER
- restartPanel()
*/
//dependecies
const dataLib = libs.req("data");
const utils = libs.req("utils");
import * as UI from "./ui-menu.mjs";
import * as dialog from "./pop-main.mjs";
import * as lang from "./check-lang.mjs";
import EventEmitter from "./emitterClass.mjs";
//private containers
var panelStack = [];
var prePanels = [];
const emitter = new EventEmitter();
//have to wrap it in functions bc of #privateFields error
function on(...args) {
  emitter.on(...args);
}

function once(...args) {
  emitter.once(...args);
}

async function directShow(elem, name, isFirst, configObj) {
  let {
    transition
  } = configObj;
  transition = typeof transition === "string" ? transition : "fadeInAndScale";
  let j = prePanels.findIndex(e => e.name === name);
  if (j !== -1) prePanels.splice(j, 1);
  let cur = document.querySelector("main[current]");
  if (cur !== null) {
    cur.removeAttribute("current");
    setTimeout(() => {
      cur.hidden = true;
    }, 400);
  }
  elem.hidden = true;
  document.querySelector("control-frame").appendChild(elem);
  await lang.useLang(elem);
  UI.init(elem);
  elem.setAttribute("current", "");
  elem.hidden = false;
  if (transition !== "instant") {
    elem.style.animation = "";
    elem.style.animation = `${transition} 0.3s ease-out`;
  }
  if (isFirst) emitter.emit(`showing-first`, { name });
  emitter.emit(`showing`, { name });
  if (transition !== "instant") await utils.delay(400);
  panelStackOn(name);
  if (isFirst) emitter.emit(`showed-first`, { name });
  emitter.emit(`showed`, { name });
  return true;
}
async function showPanel(name, configObj) {
  configObj = utils.isObject(configObj) ? configObj : {};
  let {
    forceLoad,
    transition
  } = configObj;
  let i = prePanels.findIndex(x => x.name === name);
  if (i !== -1) {
    await directShow(prePanels[i].elem, name, true, configObj);
  } else {
    let elem = document.querySelector(`main[name="${name}"]`);
    if (elem === null) {
      let panelElem = await preparePanel(name, configObj);
      await directShow(panelElem.elem, panelElem.name, true, configObj);
    } else if (!elem.hasAttribute("current")) {
      if (forceLoad) {
        deletePanel(name);
        elem = await preparePanel(name);
        await directShow(elem.elem, elem.name, true, configObj);
      } else await directShow(elem, name, false, configObj);
    } else if (forceLoad) {
      try {
        await undo();
      } catch (e) {
        elem.style.animation = "fadeOutAndScale 0.4s ease";
        setTimeout(() => {
          deletePanel(name);
        }, 400);
      }
      let newElem = await preparePanel(name);
      await directShow(newElem.elem, newElem.name, true, configObj);
    }
  }
  return true;
}

function awaitScript(src, h, module) {
  return new Promise(resolve => {
    if (!src) resolve();
    else {
      let s = document.createElement("script");
      s.onload = function () {
        resolve();
      }
      if (module) s.setAttribute("type", "module");
      h.appendChild(s);
      s.src = src;

    }
  })
}

function awaitAllScripts(scripts, h) {
  return new Promise(resolve => {
    let promises = [];
    for (let e of scripts) {
      let p = awaitScript(e.src, h, e.module);
      promises.push(p);
    }
    Promise.all(promises).then(() => {
      resolve();
    });
  });
}
async function preparePanel(name) {
  var panelData;
  let panelPath = await dataLib.exists(`data/html_assets/html_panels/${name}.html`) ? `${name}.html` : `${name}/index.html`
  try {
    panelData = await dataLib.read(`data/html_assets/html_panels/${panelPath}`);
  } catch (e) {
    console.error(e);
    dialog.popUp(`Error opening ${name} panel!`);
    throw new Error(`Error opening ${name} panel!`);
  }
  let html = document.createElement("main");
  html.setAttribute("name", name);
  html.innerHTML = panelData;
  let srcs = [];
  for (let s of html.querySelectorAll("script[src]")) {
    srcs.push({
      src: s.getAttribute("src"),
      module: s.getAttribute("type") === "module"
    });
    s.remove();
  }
  for (let s of html.querySelectorAll(`link[rel="stylesheet"]`)) {
    let e = document.createElement("style");
    e.setAttribute("scoped", "");
    e.innerHTML = `@import url("${s.getAttribute("href")}");`;
    s.outerHTML = e.outerHTML;
  }
  for (let s of html.querySelectorAll("style:not([scoped])")) s.setAttribute("scoped", "");
  html.hidden = true;
  document.querySelector("control-frame").append(html);
  await awaitAllScripts(srcs, html);
  emitter.emit(`prepared`, { name });
  prePanels.push({
    name: name,
    elem: html
  });
  return {
    name: name,
    elem: html
  };
}

function panelStackOn(name) {
  let i = panelStack.findIndex(e => e.name === name);
  if (i !== -1) panelStack.splice(i, 1);
  panelStack.push({
    name: name,
    current: true
  });
}

function deletePanel(name) {
  let m = document.querySelector(`main[name="${name}"]`);
  if (m) m.remove();
  let i = panelStack.findIndex(e => e.name === name);
  if (i !== -1) panelStack.splice(i, 1);
  let j = prePanels.findIndex(e => e.name === name);
  if (j !== -1) prePanels.splice(j, 1);
}
async function undo() {
  if (panelStack.length > 1) {
    let s = panelStack[panelStack.length - 2].name;
    let d = panelStack[panelStack.length - 1].name;
    await showPanel(s);
    await deletePanel(d);
    return true;
  } else throw new Error("There is no panel to undo to!");
}
async function backPanel() {
  if (panelStack.length > 1) {
    await showPanel(panelStack[panelStack.length - 2].name);
  } else throw new Error("There is no panel to go back to!");
}
export {
  showPanel,
  preparePanel,
  deletePanel,
  undo,
  backPanel,
  on,
  once
}