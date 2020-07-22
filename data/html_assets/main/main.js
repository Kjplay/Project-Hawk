import * as lang from "../../lib/check-lang.mjs";
import * as panels from "../../lib/panels.mjs";

//import modules from "../dialog-scripts/index.mjs"; //for sync loading scripts
import {
  init as frameInit
} from "../../../base-lib/frame.mjs";
lang.useLang(document.querySelector("html")).then(async () => {
  frameInit();
  await panels.showPanel("menu", {transition: "fadeIn"});
});