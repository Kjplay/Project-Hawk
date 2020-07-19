import Story from "../../../AppEngine/storyClass.mjs";
import * as panels from "../../../lib/panels.mjs";
function EditStory() {
    let s = Story.getSelected();
    if (s) {
        document.querySelector("#fullName").innerHTML = s.fullName;
    }
}
panels.on("showing-editor", EditStory);