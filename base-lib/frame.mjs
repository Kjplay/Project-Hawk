const winTools = libs.req("winTools");
const windowEvent = libs.req("windowEvent");
export function init() {
  try {
    document.getElementById("close").addEventListener("click", function () {
      winTools({method: "close"});
    });
    document.getElementById("maximize").addEventListener("click", async function () {
      if (await winTools({"method": "isFullScreen"})) document.getElementById("fullscreen").click();
      if (await winTools({"method": "isMaximized"})) {
        winTools({"method": "unmaximize"});
      } else {
        winTools({"method": "maximize"});
      }
    });
    document.getElementById("minimize").addEventListener("click", async function () {
      if (await winTools({"method": "isMinimized"})) {
        winTools({"method": "restore"});
      } else {
        winTools({"method": "minimize"});
      }
    });
    document.getElementById("fullscreen").addEventListener("click", async function () {
      if (await winTools({"method": "isFullScreen"})) {
        winTools({"method": "setFullScreen", "args": [false]});
      } else {
        winTools({"method": "setFullScreen", "args": [true]});
      }
    });
    windowEvent.on("enter-full-screen", () => {
      document.getElementById("fullscreen").innerHTML = `<span>&#59418;</span>`;
    });
    windowEvent.on("leave-full-screen", () => {
      document.getElementById("fullscreen").innerHTML = `<span>&#59416;</span>`;
    });
    windowEvent.on("maximize", () => {
      document.getElementById("maximize").innerHTML = `<span>&#62162;</span>`;
    });
    windowEvent.on("unmaximize", () => {
      document.getElementById("maximize").innerHTML = `<span>&#62160;</span>`;
    });
  } catch (e) {
    console.error(e);
    winTools({method: "close"});
    throw new Error("Error enabling basic frame functions!");
  }
}