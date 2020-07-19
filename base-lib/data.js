/* 
 * This is library for maintainig folders and files
 * 
 */
//Dependencies
const fs = require("fs");
const path = require("path");
//Container
var dataLib = {};
//Base directory
baseDir = path.join(__dirname, "..");
//checker
function checker(path) {
    if (path.indexOf(baseDir) !== 0) throw new Error("File operations outside "+baseDir+" are not allowed!");
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
dataLib.directoryContents = function (dir) {
    return new Promise((resolve, reject) => {
        if (dir) {
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
                } else reject(new Error("Error reading " + dir + " contents!"));
            });
        } else reject(new Error("No params!"));
    });
};
dataLib.requireJSON = async function(dir) {
    return await JSONlib.requireJSON(path.join(baseDir, dir));
};
dataLib.read = function (dir) {
    return new Promise((resolve, reject) => {
        if (dir) {
            checker(path.join(baseDir, dir));
            fs.readFile(path.join(baseDir, dir), "utf-8", (err, data) => {
                if (!err && data) resolve(data);
                else reject(new Error("Error reading!\n" + dir));
            });
        } else reject(new Error("No params!"));
    });
};
//Export the module
module.exports = dataLib;