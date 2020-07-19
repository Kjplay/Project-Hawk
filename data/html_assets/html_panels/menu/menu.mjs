
import {
    bind as logoBind
} from "../../logo-canvas.mjs";
import * as panels from "../../../lib/panels.mjs";
import * as storyLib from "../../../AppEngine/story-main.mjs";
logoBind(document.querySelector(`main[name="menu"] canvas[graphic="logo"]`), "white");
const winTools = libs.req("winTools");
panels.once("showed-first-menu", function () {
    window.requestAnimationFrame(() => {
        winTools({"method": "show"});
    });
    storyLib.spawnAll();
});