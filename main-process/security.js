const {
  app
} = require("electron");

var lib = {};

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
      if (!parsedUrl.startsWith(`file://${__dirname}`)) {
        e.preventDefault();
      }
    });
    contents.on('will-attach-webview', (e, webPreferences, params) => {
      delete webPreferences.preload
      delete webPreferences.preloadURL
      webPreferences.nodeIntegration = false
      webPreferences.enableRemoteModule = false;
      if (!params.src.startsWith(`file://${__dirname}`)) {
        e.preventDefault()
      }
    });
    contents.on('new-window', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      if (!parsedUrl.startsWith(`file://${__dirname}`)) {
        e.preventDefault();
      }
    });
  });
};
module.exports = lib;