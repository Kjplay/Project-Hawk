const data = require("../base-lib/data");
const userData = require("../base-lib/userData");
const { app } = require("electron");
var lib = {};
lib.checkAll = async function() {
  //lang
  let langConfig = {};
  if (await userData.exists("config-data/lang-data.json")) langConfig = await userData.requireJSON("config-data/lang-data.json");
  let newConfig = await lib.langConfig(langConfig);
  await userData.replaceJSON("config-data/lang-data.json", newConfig);
  return;
};
lib.langConfig = async function(jsonObj) {
  let entries = await data.directoryEntries("config-data/lang");
  let newObj = {};
  for (let entry of entries) {
    let js = await data.requireJSON(`config-data/lang/${entry}`);
    newObj[js.code.toUpperCase()] = {
      "pack": entry,
      "name": js.fullName,
      "code": js.code.toUpperCase()
    };
  }
  jsonObj.packages = newObj;
  if (!(jsonObj.default in jsonObj.packages)) jsonObj.default = "EN";
  if (typeof jsonObj.current != "string" || !(jsonObj.current in jsonObj.packages)) {
    let code = app.getLocaleCountryCode().toUpperCase();
    if (code in jsonObj.packages) jsonObj.current = code;
    else jsonObj.current = jsonObj.default;
  }
  return jsonObj;
}
module.exports = lib;