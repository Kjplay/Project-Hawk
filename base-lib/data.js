/* 
 * This is library for maintainig folders and files
 * 
 */
//Dependencies
const fs = require("fs");
const path = require("path");
const JSONlib = require("./JSONlib");
//Container
var dataLib = {};
//Base directory
baseDir = path.join(__dirname, "..");
//checker
function checker(path) {
    if (!path.startsWith(baseDir)) throw new Error("File operations outside "+baseDir+" are not allowed!");
}
//Check if file or dir exists
dataLib.exists = function (dir) {
    return new Promise((resolve, reject) => {
        dir = path.join(baseDir, dir);
        checker(dir);
        fs.access(dir, err => {
            if (!err) resolve(true); //always resolve - non existing file/dir is not na error!
            else resolve(false);
        })
    });
};
dataLib.directoryEntries = function (dir) {
    return new Promise((resolve, reject) => {
        if (dir) {
            let parsed = path.join(baseDir, dir);
            checker(parsed);
            fs.readdir(parsed, (err, data) => {
                if (!err && data) return resolve(data);
                reject(new Error("Error reading: "+dir));
            });
        }
    });
};
dataLib.requireJSON = async function(dir) {
    let parsed = path.join(baseDir, dir);
    checker(parsed);
    return await JSONlib.requireJSON(parsed);
};
dataLib.read = function (dir) {
    return new Promise((resolve, reject) => {
        if (dir) {
            let parsed = path.join(baseDir, dir);
            checker(parsed);
            fs.readFile(parsed, "utf-8", (err, data) => {
                if (!err && data) resolve(data);
                else reject(new Error("Error reading!\n" + dir));
            });
        } else reject(new Error("No params!"));
    });
};
//Export the module
module.exports = dataLib;