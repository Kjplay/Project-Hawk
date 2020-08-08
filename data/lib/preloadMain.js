const {
    contextBridge,
    ipcRenderer
} = require("electron");
const path = require("path");
const EventEmitter = require('events');
const Emitter = new EventEmitter();
const exposed = {
    "data": require(path.join(__dirname, "../../base-lib/data")),
    "helpers": require(path.join(__dirname, "../../base-lib/helpers")),
    "userData": require(path.join(__dirname, "../../base-lib/userData")),
    "utils": require(path.join(__dirname, "../../base-lib/utils")),
    "joinPath": path.join,
    "getData": getData,
    "winTools": winTools,
    "windowEvent": {
        "on": function(...args) {
            Emitter.on(...args);
        },
        "off": function(...args) {
            Emitter.off(...args);
        },
        "once": function(...args) {
            Emitter.once(...args);
        }
    }
};
ipcRenderer.on("window-event", (e, name) => {
    Emitter.emit(name);
})
async function getData(name) {
    return await ipcRenderer.invoke("get-data", name);
}
async function winTools(obj) {
    return await ipcRenderer.invoke("window-tools", obj);
}
contextBridge.exposeInMainWorld("libs", {
    req: function (name) {
        if (name in exposed) return exposed[name];
        else throw new Error("Coludn't find " + name + " module!");
    }
});