
import {
    bind as logoBind
} from "../../logo-canvas.mjs";
import * as panels from "../../../lib/panels.mjs";
import * as storyLib from "../../../AppEngine/story-main.mjs";
logoBind(document.querySelector(`main[name="menu"] canvas[graphic="logo"]`), "white");
panels.once("showed-first", e => {
    if (e.name == "menu") storyLib.spawnAll();
});