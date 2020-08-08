"use strict";
/*
Library for custom dialogs
@TODO:
- cache opened dialogs
*/
//dependencies
import * as lang from "./check-lang.mjs";
import * as UI from "./ui-menu.mjs";
const data = libs.req("data");
//custom private vars
var subTimeouts = [];
var currentIndex = 1;
var mainCover = false;
const cached = {};
//functions
async function createPopUp(options) {
  options = options instanceof Object ? options : {};
  if (currentIndex === 1) {
    let mainC = document.getElementById("main_cover");
    mainC.hidden = false;
    window.requestAnimationFrame(() => {
      mainC.style.opacity = 1;
    });
    mainCover = true;
  }
  document.querySelector("main[current]").style.filter = 'grayscale(0.8)';
  currentIndex++;
  let coverName = "cover_" + currentIndex;
  let buttonName = "btn_ok" + currentIndex;
  let buttonCancelName = "btn_cancel" + currentIndex;
  let closeName = "close_" + currentIndex;
  options.content = typeof options.content === "string" ? options.content : "[lang: Dialogs_error]";
  options.hasOkButton = typeof options.hasOkButton === "boolean" ? options.hasOkButton : true;
  options.hasCancelButton = typeof options.hasCancelButton === "boolean" ? options.hasCancelButton : false;
  options.hasCloseBar = typeof options.hasCloseBar === "boolean" && !options.hasOkButton && !options.hasCancelButton ? options.hasCloseBar : false;
  let html = `<div class="popUp">`;
  if (options.hasCloseBar) html += `<div class="closebar"><div class="inline-container" style="width: 50px;"><div class="close-icon left top fontello i-flex f-center f-al-c" tabindex="0" name="${closeName}"><span>&#59403;</span></div></div></div>`;
  html += `<div class="popContainer"><span class="content superPadding">${options.content}</span></div>`
  if (options.hasOkButton || options.hasCancelButton) html += `<div class="buttons">`;
  if (options.hasOkButton) html += `<button class="btn_ok" name="${buttonName}">[lang: OK]</button>`;
  if (options.hasCancelButton) html += `<button class="btn_cancel" name="${buttonCancelName}">[lang: No]</button>`;
  if (options.hasOkButton || options.hasCancelButton) html += `</div>`;
  html += `</div>`;

  let c = document.createElement("div");
  c.setAttribute("name", coverName);
  c.classList.add("cover");
  let popUpname = typeof options.name === "string" ? options.name : `popup_${currentIndex}`;
  c.setAttribute("popUpName", popUpname);
  c.innerHTML = html;
  html = c;

  let titleElem = html.querySelector("dialog-title");
  if (titleElem && options.hasCloseBar) {
    let t = document.createElement("span");
    t.classList.add("popTitle")
    t.innerHTML = titleElem.innerHTML;
    html.querySelector("div.closebar").prepend(t);
    titleElem.remove();
  }
  html.hidden = true;
  let cvL = document.querySelectorAll("div.cover");
  if (cvL.length > 0) {
    cvL = cvL[cvL.length - 1];
    cvL.style.opacity = 0.4;
  }
  let mainC = document.getElementById("main_cover");
  mainC.parentNode.insertBefore(html, mainC);
  await lang.useLang(html);
  html.hidden = false;
  let elem = document.querySelector(`div.cover[popUpName="${popUpname}"]`);
  await UI.trapFocus(elem);
  html.style.animation = "fadeInAndScale 0.2s ease";
  let cover = document.querySelector(`div[name="${coverName}"]`);
  cover.style.zIndex = currentIndex;
  return cover;
}
async function closePopUp(name) {
  let mainC = document.getElementById("main_cover");
  let elem = document.querySelector(`div.cover[popUpName="${name}"]`);
  if (elem !== null) {
    UI.releaseFocus();
    elem.style.animation = "fadeOutAndScale 0.2s ease";
    setTimeout(() => {
      elem.remove();
      let cvL = document.querySelectorAll("div.cover");
      if (cvL.length > 0) {
        cvL = cvL[cvL.length - 1];
        cvL.style.opacity = 1;
      }
      currentIndex--;
      if (currentIndex === 1) {
        mainC.style.opacity = "";
        setTimeout(() => {
          mainC.hidden = true;
        }, 200);
        document.querySelector("main[current]").style.filter = "";
        mainCover = false;
      }
    }, 190);
  }
}
async function popUp(text, callback) {
  let cover = await createPopUp({
    hasOkButton: true,
    content: text
  });
  cover.querySelector(`button.btn_ok`).addEventListener("click", function () {
    if (callback) callback();
    let name = cover.getAttribute("popUpName");
    closePopUp(name);
  }, {
    once: true
  });
};
async function confirm(text, callback) {
  let cover = await createPopUp({
    hasOkButton: true,
    hasCancelButton: true,
    content: text
  });
  cover.querySelector(`button.btn_ok`).addEventListener("click", function () {
    if (typeof callback === "function") callback(true);
    let name = cover.getAttribute("popUpName");
    closePopUp(name);
  }, {
    once: true
  });
  cover.querySelector(`button.btn_cancel`).addEventListener("click", function () {
    if (callback) callback(false);
    let name = cover.getAttribute("popUpName");
    closePopUp(name);
  }, {
    once: true
  });
};
async function subSpecial(name, message, time) {
  time = typeof time === "number" ? time : 3000;
  for (let t of subTimeouts) {
    if (t.name == name) clearTimeout(t.nr);
  }
  let old = document.querySelectorAll(`div[popUpName="${name}"] div[subName="${name}"]`);
  if (old) old.forEach(e => {
    e.style.opacity = 0;
    setTimeout(() => {
      e.remove();
    }, 300);
  });
  let html = `<div class="center click-through">${message}</div>`;
  let el = document.createElement("div");
  el.setAttribute("subName", name);
  el.classList.add("subPop", "click-through");
  el.innerHTML = html;
  html = el;
  let elem = document.querySelector(`div[popUpName="${name}"] span.content`);
  elem.parentNode.insertBefore(html, elem.nextSibling);
  await lang.useLang(html);
  html.style.opacity = 1;
  let nr = setTimeout(() => {
    let index = subTimeouts.findIndex(t => t.nr === nr);
    if (index !== -1) subTimeouts.splice(index, 1);
    let elem = document.querySelector(`div[popUpName="${name}"] div[subName="${name}"]`);
    elem.style.opacity = 0;
    setTimeout(() => {
      elem.remove();
    }, 300);
  }, time);
  subTimeouts.push({
    name: name,
    nr: nr
  });
}
async function specialPop(htmlContent, name, closePromise, onStart) {
  if (!(name in cached)) {
    Object.defineProperty(cached, name, {
      value: Object.freeze({htmlContent, closePromise, onStart}),
      configurable: false, 
      writable: false
    });
  }
  let cover = await createPopUp({
    name: name,
    hasCloseBar: true,
    hasOkButton: false,
    hasCancelButton: false,
    content: htmlContent
  });
  let close = cover.querySelector(`div.close-icon`);
  close.addEventListener("keypress", function (e) {
    if (e.keyCode == 13) close.click();
  });
  close.addEventListener("click", function () {
    if (closePromise !== undefined) {
      closePromise(cover.querySelector("span.content")).then(() => {
        closePopUp(name);
      }).catch(text => {
        if (text) popUp(text);
      });
    } else closePopUp(name);
  });
  if (onStart) {
    onStart(cover.querySelector("span.content"), function () {
      closePopUp(name);
    });
  }
};
async function linkPop(name) {
  let dialogData;
  if (name in cached) {
    let { htmlContent, closePromise, onStart } = cached[name];
    specialPop(htmlContent, name, closePromise, onStart);
  } else {
    if (await data.exists(`data/html_assets/dialogs/${name}.html`)) {
      dialogData = await data.read(`data/html_assets/dialogs/${name}.html`);
      specialPop(dialogData, name);
    } else if (await data.exists(`data/html_assets/dialogs/${name}/index.html`)) {
      dialogData = await data.read(`data/html_assets/dialogs/${name}/index.html`);
      try {
        let { onStart, closePromise } = await import(`../html_assets/dialogs/${name}/script.mjs`);
        specialPop(dialogData, name, closePromise, onStart);
      } catch (e) {
        specialPop(dialogData, name);
      }
    } else popUp();
  }
};
export {
  popUp,
  confirm,
  specialPop,
  linkPop,
  subSpecial
}