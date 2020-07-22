/* 
 * This is library for maintainig folders and files
 * 
 */
//Dependencies
const fs = require("fs");
const path = require("path");
const JSONlib = require("./JSONlib");
const {
  ipcRenderer,
  app
} = require("electron");
const utils = require("./utils");
//Container
var dataLib = {};
//Base directory
let baseDir = process.type === "browser" ? app.getPath("userData") : null; //only once
async function setBase() {
  baseDir = await ipcRenderer.invoke("get-data", "userData");
}
if (!baseDir) setBase();
//checker function
function checker(path) {
  if (!path.startsWith(baseDir)) reject(new Error("File operations outside " + baseDir + " are not allowed!"));
}

//Check if file or dir exists
dataLib.exists = function (dir) {
  return new Promise((resolve, reject) => {
    utils.assert([dir], ["string"]);
    checker(path.join(baseDir, dir));
    fs.access(path.join(baseDir, dir), err => {
      resolve(!err); //always resolve - non existing file/dir is not na error!
    });
  });
};
//Create or update the file
dataLib.save = function (dir, data) {
  return new Promise((resolve, reject) => {
    utils.assert([dir, data], ["string", "string"]);
    checker(path.join(baseDir, dir));
    fs.open(path.join(baseDir, dir), "w", (err, fd) => {
      if (!err && fd) {
        fs.writeFile(fd, data, err => {
          fs.close(fd, function () {
            if (!err) resolve(data);
            else {
              console.log(err);
              reject(new Error("Error writing!\n" + dir));
            }
          });
        });
      } else {
        fs.close(fd, function () {
          console.log(err);
          reject(new Error("Error opening!\n" + dir));
        });
      }
    });
  });
};
//Read file (utf-8)
dataLib.read = function (dir) {
  return new Promise((resolve, reject) => {
    utils.assert([dir], ["string"]);
    checker(path.join(baseDir, dir));
    fs.readFile(path.join(baseDir, dir), "utf-8", (err, data) => {
      if (!err && data) resolve(data);
      else {
        console.error(err);
        reject(new Error("Error reading!\n" + dir));
      }
    });
  });
};
//Make a directory
dataLib.mkdir = function (dir) {
  return new Promise(async function (resolve, reject) {
    utils.assert([dir], ["string"]);
    checker(path.join(baseDir, dir));
    if (!(await dataLib.exists(dir))) {
      fs.mkdir(path.join(baseDir, dir), err => {
        if (!err) resolve(true);
        else {
          console.error(err);
          reject(new Error("Error creaating " + dir + " directory!"));
        }
      });
    } else resolve(true);
  });
};
//Delete file/folder
dataLib.delete = function (dir) {
  return new Promise(async function (resolve, reject) {
    utils.assert([dir], ["string"]);
    checker(path.join(baseDir, dir));
    if (await dataLib.exists(dir)) {
      fs.stat(path.join(baseDir, dir), function (err, stats) {
        if (!err && stats) {
          if (stats.isDirectory()) {
            fs.rmdir(path.join(baseDir, dir), {
              recursive: true
            }, function (err) {
              if (!err) resolve(true);
              else {
                console.error(err);
                reject(err);
              }
            });
          } else {
            fs.unlink(path.join(baseDir, dir), err => {
              if (!err) resolve(true);
              else {
                console.error(err);
                reject(new Error("Error deleting!\n" + dir));
              }
            });
          }
        } else {
          console.error(err);
          reject(err);
        }
      });
    } else resolve(true);
  });
};
dataLib.requireJSON = async function (dir) {
  utils.assert([dir], ["string"]);
  let parsed = path.join(baseDir, dir);
  checker(parsed);
  return await JSONlib.requireJSON(parsed);
};
dataLib.updateJSON = async function (dir, obj) {
  utils.assert([dir, obj], ["string", Object]);
  let parsed = path.join(baseDir, dir);
  checker(parsed);
  return await JSONlib.updateJSON(parsed, obj);
};
dataLib.replaceJSON = async function (dir, obj) {
  utils.assert([dir, obj], ["string", Object]);
  let parsed = path.join(baseDir, dir);
  checker(parsed);
  return await JSONlib.replaceJSON(parsed, obj);
};
dataLib.directoryContents = function (dir) {
  return new Promise((resolve, reject) => {
    utils.assert([dir], ["string"]);
    checker(path.join(baseDir, dir));
    fs.readdir(path.join(baseDir, dir), {
      withFileTypes: true
    }, (err, data) => {
      if (!err && data instanceof Array) {
        data = data.map(f => {
          return {
            name: f.name,
            type: f.isDirectory() ? "directory" : (f.isFile() ? "file" : "unknown")
          }
        });
        resolve(data);
      } else {
        console.error(err);
        reject(new Error("Error reading " + dir + " contents!"));
      }
    });
  });
};
dataLib.direcotryEntries = function (dir) {
  return new Promise((resolve, reject) => {
    if (dir) {
      let parsed = path.join(baseDir, dir);
      checker(parsed);
      fs.readdir(parsed, (err, data) => {
        if (!err && data) return resolve(data);
        reject(new Error("Error reading: \n" + dir));
      });
    }
  });
};
dataLib.getDirNames = function (dir) {
  return new Promise((resolve, reject) => {
    utils.assert([dir], ["string"]);
    checker(path.join(baseDir, dir));
    fs.readdir(path.join(baseDir, dir), {
      withFileTypes: true
    }, (err, data) => {
      if (!err && data instanceof Array) {
        data = data.filter(f => f.isDirectory());
        data = data.map(f => f.name);
        resolve(data);
      } else {
        console.error(err);
        reject(new Error("Error reading " + dir + " dirnames!"));
      }
    });
  });
};
//Export the module
module.exports = dataLib;