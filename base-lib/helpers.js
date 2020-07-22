/* 
 * 
 * 
 */
//Dependencies
const fs = require("fs");
const crypto = require("crypto");
//Container
var helpers = {};
//Parse JSON
helpers.parseJSON = function (stringObj) {
  return new Promise((resolve, reject) => {
    try {
      var obj = JSON.parse(stringObj);
      resolve(obj);
    } catch (e) {
      reject(false);
    }
  });
};
helpers.hash = function (string, encoding) {
  encoding = typeof encoding === "string" ? encoding : "hex";
  const hash = crypto.createHmac("sha256", "afasfasf"); //StRonK PaSSwOrT
  return hash.update(string).digest(encoding);
};
helpers.randomString = function (lenght) {
  var str = "",
    random;
  for (let i = 0; i < lenght; i++) {
    random = ~~(Math.random() * (61 - 0 + 1) + 0);
    if (random <= 9) {
      str += String.fromCharCode(random + 48);
    } else if (random <= 35) {
      str += String.fromCharCode(random + 55);
    } else {
      str += String.fromCharCode(random + 61);
    }
  }
  return str;
};
//Export the module
module.exports = helpers;