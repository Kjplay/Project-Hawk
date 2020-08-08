const { ipcMain, app, BrowserWindow } = require('electron');
const data = {
    appPath: app.getAppPath(),
    userData: app.getPath("userData")
}
var lib = {};
lib.init = function() {
    ipcMain.handle("get-data", async (event, name) => {
        return data[name];
    });
    ipcMain.handle("window-tools", async (event, obj) => {
        let win = BrowserWindow.fromWebContents(event.sender);
        if (typeof obj.method === "string" && obj.method in win) {
            let args = [];
            if (Array.isArray(obj.args)) args = obj.args;
            return win[obj.method](...args);
        }
    });
    app.on("browser-window-created", (_, win) => {
        lib.windowEvents(win);
    });
};
lib.windowEvents = function(win) {
    win.on("enter-full-screen", () => {
        win.webContents.send("window-event", "enter-full-screen");
    });
    win.on("leave-full-screen", () => {
        win.webContents.send("window-event", "leave-full-screen");
    });
    win.on("maximize", () => {
        win.webContents.send("window-event", "maximize");
    });
    win.on("unmaximize", () => {
        win.webContents.send("window-event", "unmaximize");
    });
};
module.exports = lib;
