const {
  app
} = require("electron");
const path = require("path");

var lib = {};
const parsedPath = path.join(__dirname, "..");
lib.enable = function () {
  app.on('web-contents-created', (_, contents) => {
    let ses = contents.session;
    if (ses) {
      ses.setPermissionRequestHandler((_, l, callback) => {
        callback(false);
      });
    }
    contents.on('will-navigate', (e, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl)
      if (!parsedUrl.startsWith(parsedPath)) {
        e.preventDefault();
      }
    });
    contents.on('will-attach-webview', (e, webPreferences, params) => {
      delete webPreferences.preload
      delete webPreferences.preloadURL
      webPreferences.nodeIntegration = false
      webPreferences.enableRemoteModule = false;
      if (!params.src.startsWith(parsedPath)) {
        e.preventDefault()
      }
    });
    contents.on('new-window', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      if (!parsedUrl.startsWith(parsedPath)) {
        e.preventDefault();
      }
    });
  });
};
module.exports = lib;