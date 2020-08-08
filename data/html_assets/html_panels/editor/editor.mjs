import HawkStory from "../../../AppEngine/hawk/storyClass.mjs";
import * as panels from "../../../lib/panels.mjs";
function EditStory() {
    let s = HawkStory.getSelected();
    if (s) {
        document.querySelector("#fullName").innerHTML = s.fullName;
    }
}
panels.on("showing", e => {
    if (e.name == "editor") EditStory();
});