"use strict";
/*
Library for making custom on click actions
@TO-DO:
- Multiple actions, in order, unsuccesful one prevent oher from executing
*/

//Dependecies
import * as dialog from "./pop-main.mjs";
import * as panels from "./panels.mjs";

//variables for focus trapping
let focusable;
let trapped;
//actionMap - to be separate lib
const actionMap = {
  "undo-panel": panels.undo,
  "back-panel": panels.backPanel
};
Object.freeze(actionMap);


function init(element) { //selector can be: selector string, jquery object, html node object
  let dialogs = element.querySelectorAll("[dialog]");
  let p = element.querySelectorAll("[panel]");
  let a = element.querySelectorAll("[action]");
  for (let node of dialogs) {
    node.removeEventListener("click", dialogHandler);
    node.addEventListener("click", dialogHandler);
  }
  for (let node of p) {
    node.removeEventListener("click", panelHandler);
    node.addEventListener("click", panelHandler);
  }
  for (let node of a) {
    node.removeEventListener("click", actionHandler);
    node.addEventListener("click", actionHandler);
  }
}

//handlers
function resizeHandler(element, ...func) {
  return function handler(e) {
    if (element) {
      element.height = element.scrollHeight;
      element.width = element.scrollWidth;
    } else {
      window.removeEventListener("resize", resizeHandler(element, ...func));
    }
  }
}
function actionHandler(e) {
  e.preventDefault();
  let atr = this.getAttribute("action");
  if (atr in actionMap) {
    actionMap[atr]();
  }
}

function dialogHandler(e) {
  e.preventDefault();
  let atr = this.getAttribute("dialog");
  dialog.linkPop(atr);
}

function panelHandler(e) {
  e.preventDefault();
  let atr = this.getAttribute("panel");
  try {
    panels.showPanel(atr);
  } catch (e) {
    console.error("Panel action unsuccesful", this, e);
  }
};

function focusHandler(e) {
  if (e.key !== "Tab") return;
  e.preventDefault();
  for (let i = 0; i < focusable.length; i++) {
    if (focusable[i] == document.activeElement) {
      if (!e.shiftKey) {
        if (i + 1 < focusable.length) focusable[i + 1].focus();
        else focusable[0].focus();
        return;
      } else {
        if (i > 0) focusable[i - 1].focus();
        else focusable[focusable.length - 1].focus();
        return;
      }
    }
  }
  focusable[0].focus();
}

async function trapFocus(elem, soft, callback) {
  document.activeElement.blur();
  trapped = elem;
  focusable = elem.querySelectorAll("input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), object:not([disabled]), a[href], [tabindex]")
  document.addEventListener("keydown", focusHandler);
};

async function releaseFocus(noEnd) {
  document.removeEventListener("keydown", focusHandler);
  trapped = null;
};

function isTrapped(elem) {
  return trapped == elem;
}
function bindToResize(element, ...func) {
  window.addEventListener("resize", resizeHandler(element, ...func));
}
function unBindToResize(element, ...func) {
  window.removeEventListener("resize", resizeHandler(element, ...func));
}
export {
  init,
  trapFocus,
  releaseFocus,
  isTrapped,
  bindToResize,
  unBindToResize
};