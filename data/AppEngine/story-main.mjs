import * as dialog from "../lib/pop-main.mjs";
import HawkStory from "./hawk/storyClass.mjs";
const dataLib = libs.req("data");
import * as lang from "../lib/check-lang.mjs";
import * as panels from "../lib/panels.mjs";
import getBlock from "../lib/block.mjs";
const utils = libs.req("utils");
const at = ["id","fullName" ,"title","passages","dateModified","dateCreated"];
let cont = {}; //for html updates
const eventMap = {
  deleter: (e, html) => {
    if (e.key == "Enter" || typeof e.key == "undefined") {
      dialog.confirm("[lang: Sure]?", ans => {
        if (ans) despawnAndDelete(html.querySelector("story"));
      });
    }
  },
  edit: async (e, storyObj) => {
    if (e.key == "Enter" || typeof e.key == "undefined") {
      await storyObj.load();
      panels.showPanel("editor");
    }
  },
  activator: (_, html, storyObj) => {
    let elem = document.querySelector("div.info-menu");
    if (elem.getAttribute("active-story") !== storyObj.fullName) {
      let si = html.querySelector("storyinfo");
      let data = {};
      for (let a of at) {
        let attr = si.getAttribute("story_"+a);
        if (attr) data[a] = attr;
      }
      updateInfo(data);
      elem.setAttribute("active-story", si.getAttribute("fullName"));
    }
    elem.style.opacity = 1;
  },
  deactivator: () => {
    let elem = document.querySelector("div.info-menu");
    elem.style.opacity = 0;
  }
};

function updateInfo(obj) {
  let e = document.querySelector('div.info-menu');
  for (let key of Object.keys(obj)) {
    let el = e.querySelector(`span[content="story_${key}"]`);
    if (el) el.innerHTML = obj[key];
  }
}

export async function spawnAll() {
  HawkStory.getAll().then(async stories => {
    for (let s in stories) {
      cont[s.fullName] = s;
      await spawnStory(stories[s]);
      await utils.delay(100);
    }
  });
}
export async function spawnStory(storyObj) { //to-do
  if (storyObj instanceof HawkStory) {
    try {
      let data = await getBlock("story_block");
      let el = document.createElement("div");
      el.classList.add("story_container");
      el.innerHTML = data;
      let html = el;
      html.hiddden = true;
      //setting info
      let info = html.querySelector("storyinfo");
      let attrs = storyObj.getData();
      for (let key of Object.keys(attrs)) info.setAttribute("story_"+key, attrs[key]);
      html.querySelector("span.real_title").innerHTML = storyObj.title;
      await lang.useLang(html);

      //events

      html.querySelector("opt.delete").addEventListener("click", e => {
        eventMap.deleter(e, html)
      });
      html.querySelector("opt.delete").addEventListener("keyup", e => {
        eventMap.deleter(e, html);
      });
      html.querySelector("opt.edit").addEventListener("click", e => {
        eventMap.edit(e, storyObj);
      });
      html.querySelector("opt.edit").addEventListener("keyup", e => {
        eventMap.edit(e, storyObj);
      });
      for (let node of html.querySelectorAll("story, opt")) {
        node.addEventListener("blur", eventMap.deactivator);
        node.addEventListener("focus", e => {
          eventMap.activator(e, html, storyObj);
        });
      }
      html.addEventListener("mouseenter", e => {
        eventMap.activator(e, html, storyObj);
      });
      html.addEventListener("mouseleave", eventMap.deactivator);

      //actual spawn

      document.querySelector("div.stories_container").append(html);
      html.hidden = false;
      html.style.animation = "fadeInAndScale 0.4s ease";
      setTimeout(function () {
        html.style.animation = "";
      }, 400);
    } catch (e) {
      console.error(e);
      dialog.popUp("[lang: story_spawn_error]");
    }
  }
}
export async function createAndSave(attrs, data) {
  let s = new HawkStory(attrs, data);
  await s.save();
  return s;
}
export async function despawnAndDelete(element) {
  let result = await HawkStory.delete(element.querySelector("storyinfo").getAttribute("story_fullname"));
  if (result) {
    element.parentNode.style.animation = "fadeInAndScale 0.4s ease reverse";
    setTimeout(function () {
      element.parentNode.remove();
    }, 400);
  }
}