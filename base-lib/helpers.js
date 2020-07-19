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
helpers.requireJSON = function (path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, "utf-8", (err, data) => {
      if (!err && data) {
        try {
          var parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(new Error("Error parsing!"));
        }
      } else {
        reject(new Error("Error opening!"+path));
      }
    });
  });
};
helpers.updateJSON = function (path, obj) {
  return new Promise(async function (resolve, reject) {
    try {
      var oldObj = await helpers.requireJSON(path);
    } catch (e) {
      reject(new Error("Path invalid!"));
      return;
    }
    if (!obj instanceof Object) {
      reject(new Error("No param!"));
      return;
    }
    for (let key in obj) {
      oldObj[key] = obj[key];
    }
    fs.open(path, "w", (err, fd) => {
      if (!err && fd) {
        fs.write(fd, JSON.stringify(oldObj), err => {
          fs.close(fd, function() {
            if (!err) {
              resolve(oldObj);
            } else {
              reject(new Error("Error writing!"));
            }
          });
        });
      } else {
        fs.close(fd, function() {
          reject(new Error("Error opening!"));
        });
      }
    });
  });
}
helpers.replaceJSON = function (path, obj) {
  return new Promise((resolve, reject) => {
    fs.open(path, "w", (err, fd) => {
      if (!err && fd) {
        fs.write(fd, JSON.stringify(obj), err => {
          if (!err) {
            fs.close(fd, function() {
              resolve(obj);
            });
          } else {
            fs.close(fd, function() {
              reject(new Error("Error writing!"));
            });
          }
        });
      } else {
        fs.close(fd, function() {
          reject(new Error("Error opening!"));
        });
      }
    });
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
helpers.exists = function(parsedPath) {
  return new Promise((resolve, reject) => {
    fs.access(parsedPath, fs.constants.R_OK, err => {
      if (!err) resolve(true);
      else resolve(false);
    });
  });
}
//Export the module
module.exports = helpers;