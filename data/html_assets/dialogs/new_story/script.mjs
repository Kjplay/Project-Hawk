import * as dialog from "../../../lib/pop-main.mjs";
import * as storyLib from "../../../AppEngine/story-main.mjs";

function onStart(element, close) {
    let inp = element.querySelector('input[name="newStoryTitle"]');
    let btn_ok = element.querySelector('button[name="create_story"]');
    inp.focus();
    inp.addEventListener("keydown", e => {
        if (e.key == "Enter") btn_ok.click();
    });
    btn_ok.addEventListener("click" , async function() {
        let elem = inp;
        let value = elem.value;
        if (value == "") {
            dialog.subSpecial("new_story", "[lang: Give_title]!");
            elem.focus();
        }
        else {
            let s = await storyLib.createAndSave({
                title: value
            });
            await storyLib.spawnStory(s);
            close();
        }
    });
    element.querySelector('button[name="cancel_creating"]').addEventListener("click", function() {
        closePromise(element).then(close).catch(() => {});
    });
}

function closePromise(element) {
    return new Promise((resolve, reject) => {
        let elem = element.querySelector('input[name="newStoryTitle"]');
        let value = elem.value;
        if (value != "") {
            dialog.confirm("[lang: Sure_cancelling]?", ans => {
                if (ans) resolve(ans);
                else reject(ans);
            });
        } else resolve(true);
    });
}
export { onStart, closePromise }