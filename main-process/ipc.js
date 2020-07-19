const { ipcMain, app, BrowserWindow, webContents } = require('electron');
const data = {
    appPath: app.getAppPath(),
    userData: app.getPath("userData")
}
var lib = {};
lib.setMain = function(id) {
    let win = BrowserWindow.fromId(id);
    Object.defineProperty(lib, "mainWindow", {
        value: win,
        writable: false,
        configurable: false
    });
};
lib.init = function() {
    ipcMain.handle("get-data", async (event, name) => {
        return data[name];
    });
    ipcMain.handle("main-window-tools", async (event, obj) => {
        if (typeof obj.method === "string" && obj.method in lib.mainWindow) {
            let args = [];
            if (Array.isArray(obj.args)) args = obj.args;
            return lib.mainWindow[obj.method](...args);
        }
    });
    lib.windowEvents();
};
lib.windowEvents = function() {
    lib.mainWindow.on("enter-full-screen", () => {
        lib.mainWindow.webContents.send("window-event", "enter-full-screen");
    });
    lib.mainWindow.on("leave-full-screen", () => {
        lib.mainWindow.webContents.send("window-event", "leave-full-screen");
    });
    lib.mainWindow.on("maximize", () => {
        lib.mainWindow.webContents.send("window-event", "maximize");
    });
    lib.mainWindow.on("unmaximize", () => {
        lib.mainWindow.webContents.send("window-event", "unmaximize");
    });
};
module.exports = lib;
