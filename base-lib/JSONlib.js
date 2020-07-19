//Dependencies
const fs = require("fs");
//Container
var lib = {};
//Parse JSON
lib.parseJSON = function (stringObj) {
  return new Promise((resolve, reject) => {
    try {
      var obj = JSON.parse(stringObj);
      resolve(obj);
    } catch (e) {
      reject(false);
    }
  });
};
lib.requireJSON = function (path) {
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
lib.updateJSON = function (path, obj) {
  return new Promise(async function (resolve, reject) {
    try {
      var oldObj = await lib.requireJSON(path);
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
lib.replaceJSON = function (path, obj) {
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
module.exports = lib;