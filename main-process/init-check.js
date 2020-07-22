"use strict";
//Dependencies
const dataLib = require("../base-lib/userData");
const JSONlib = require("../base-lib/JSONlib");
const path = require("path");
const fs = require("fs");
const { app } = require("electron");
const baseDir = app.getPath("userData");
const configChecker = require("./config-checker");
const userData = require("../base-lib/userData");
//import evaluateConfig from "../data/lib/check-lang.mjs";
//Container
var check = {};
//Init function
check.init = function () {
  return new Promise(async function (resolve, reject) {
    try {
      let tree = await JSONlib.requireJSON(path.join(__dirname, "../config-data/foldertree.json"));
      await check.folders(tree);
      await configChecker.checkAll();
      resolve(true);
    } catch (err) {
      reject(err);
    }
  });
};
//Folder tree checking
check.folders = function (folderTree, startpath) {
  return new Promise(async function (resolve, reject) {
    startpath = typeof startpath === "string" ? startpath + "/" : "";
    if (folderTree instanceof Object) {
      for (let key in folderTree) {
        try {
          await dataLib.mkdir(startpath+key);
          await check.folders(folderTree[key], startpath+key);
        } catch(err) {
          reject(err);
          return;
        }
      }
      resolve(true);
    } else reject(new Error("No params!"));
  });
};
check.file = function (file) {
  return new Promise((resolve, reject) => {
    fs.access(path.join(baseDir, `${file}`), err => {
      if (err) { 
        fs.access(path.join(__dirname, `../${file}`), err => {
          if (!err) {
            fs.copyFile(path.join(__dirname, `../${file}`), path.join(baseDir, `${file}`), err => {
              if (err) {
                reject(new Error("Error copying: "+path.join(__dirname, `../${file}`)));
                return;
              } else resolve(true);
            });
          } else { 
            reject(new Error("Error, does not exists: "+path.join(__dirname, `../${file}`)));
            return;
          }
        });
      } else resolve(true);
    });
  });
};
check.files = function (filesTree) {
  return new Promise(async (resolve, reject) => {
    for (let key in filesTree) {
      for (let f of filesTree[key]) {
        try {
          await check.file(`${key}/${f}`);
        } catch (e) {
          reject(e);
        }
      }
    }
    resolve(true);
  });
}
//Export the module
module.exports = check;