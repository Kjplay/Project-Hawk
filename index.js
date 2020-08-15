/*
@TODO:
- replace use of remote module in the preload to ipc DONE
*/
//dependencies
const {
  app,
  BrowserWindow,
  screen
} = require("electron");
const security = require("./main-process/security");
const check = require("./main-process/init-check");
const ipc = require("./main-process/ipc");
const path = require("path");
let mainWindow;
//settings
app.allowRendererProcessReuse = true;
//start
if (app.requestSingleInstanceLock()) {
  app.on("second-instance", () => {
    if (mainWindow instanceof BrowserWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.moveTop();
      mainWindow.focus();
    }
  });
  app.whenReady().then(async () => {
    //security measures
    security.enable();
    //files check
    await check.init();
    //actual app start
    ipc.init();
    app.on("window-all-closed", () => {
      app.quit();
    });
    //mainWindow
    let {
      width,
      height
    } = screen.getPrimaryDisplay().workAreaSize;
    width = Math.floor(width * 0.8);
    height = Math.floor(height * 0.8);
    mainWindow = new BrowserWindow({
      width: width,
      height: height,
      frame: false,
      backgroundColor: "#0f0f0f",
      show: false,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(app.getAppPath(), "data/lib/preloadMain.js"),
        enableRemoteModule: false,
        worldSafeExecuteJavaScript: true
      }
    });
    mainWindow.once("ready-to-show", () => {
      mainWindow.show();
      mainWindow.focus();
    });
    mainWindow.loadURL("file://" + path.join(__dirname, "data/html_assets/main/index.html"));
    mainWindow.once("close", () => {
      mainWindow = null;
    });
  });
} else {
  app.quit();
}