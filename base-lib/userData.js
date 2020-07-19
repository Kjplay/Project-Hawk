/* 
 * This is library for maintainig folders and files
 * 
 */
//Dependencies
const fs = require("fs");
const path = require("path");
const helpers = require("./helpers");
const { ipcRenderer, app } = require("electron");

var dataLib = {};
//Container
let baseDir = process.type === "browser" ? app.getPath("userData") : null; //only once
async function setBase() {
    baseDir = await ipcRenderer.invoke("get-data", "userData");
}
if (!baseDir) setBase();
//Base directory
function checker(path) {
    if (path.indexOf(baseDir) !== 0) throw new Error("File operations outside " + baseDir + " are not allowed!");
}

//Check if file or dir exists
dataLib.exists = function (dir) {
    return new Promise((resolve, reject) => {
        checker(path.join(baseDir, dir));
        fs.access(path.join(baseDir, dir), err => {
            if (!err) resolve(true); //always resolve - non existing file/dir is not na error!
            else resolve(false);
        })
    });
};
//Create or update the file
dataLib.save = function (dir, data) {
    return new Promise((resolve, reject) => {
        if (dir && data) {
            checker(path.join(baseDir, dir));
            fs.open(path.join(baseDir, dir), "w", (err, fd) => {
                if (!err && fd) {
                    fs.writeFile(fd, data, err => {
                        fs.close(fd, function () {
                            if (!err) resolve(data);
                            else reject(new Error("Error writing!\n" + dir));
                        });
                    });
                } else {
                    fs.close(fd, function () {
                        reject(new Error("Error opening!\n" + dir));
                    });
                }
            });
        } else {
            fs.close(fd, function () {
                reject(new Error("No params!"));
            });
        }
    });
};
//Read file (utf-8)
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
//Make a directory
dataLib.mkdir = function (dir) {
    return new Promise(async function (resolve, reject) {
        if (dir) {
            checker(path.join(baseDir, dir));
            let exists = await dataLib.exists(dir);
            if (!exists) {
                fs.mkdir(path.join(baseDir, dir), err => {
                    if (!err) resolve(true);
                    else reject(new Error("Error creaating " + dir + " directory!"));
                });
            } else resolve(true);
        } else reject(new Error("No params!"));
    });
};
//Delete file/folder
dataLib.delete = function (dir) {
    return new Promise(async function (resolve, reject) {
        if (dir) {
            checker(path.join(baseDir, dir));
            let exists = await dataLib.exists(dir);
            if (exists) {
                fs.stat(path.join(baseDir, dir), function (err, stats) {
                    if (!err && stats) {
                        if (stats.isDirectory()) {
                            fs.rmdir(path.join(baseDir, dir), {
                                recursive: true
                            }, function (err) {
                                if (!err) resolve(true);
                                else reject(err);
                            });
                        } else {
                            fs.unlink(path.join(baseDir, dir), err => {
                                if (!err) resolve(true);
                                else reject(new Error("Error deleting!\n" + dir));
                            });
                        }
                    } else reject(err);
                });
            } else resolve(true);
        } else reject(new Error("No params!"));
    });
};
dataLib.requireJSON = function (dir) {
    return new Promise((resolve, reject) => {
        helpers.requireJSON(path.join(baseDir, dir)).then(data => {
            resolve(data);
        }).catch(e => {
            reject(e);
        });
    });
};
dataLib.updateJSON = function (dir, obj) {
    return new Promise((resolve, reject) => {
        helpers.updateJSON(path.join(baseDir, dir), obj).then(data => {
            resolve(data);
        }).catch(e => {
            reject(e);
        });
    });
};
dataLib.replaceJSON = function (dir, obj) {
    return new Promise((resolve, reject) => {
        helpers.replaceJSON(path.join(baseDir, dir), obj).then(data => {
            resolve(data);
        }).catch(e => {
            reject(e);
        });
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
dataLib.getDirNames = function (dir) {
    return new Promise((resolve, reject) => {
        if (dir) {
            checker(path.join(baseDir, dir));
            fs.readdir(path.join(baseDir, dir), {
                withFileTypes: true
            }, (err, data) => {
                if (!err && data instanceof Array) {
                    data = data.filter(f => f.isDirectory());
                    data = data.map(f => f.name);
                    resolve(data);
                } else reject(new Error("Error reading " + dir + " dirnames!"));
            });
        } else reject(new Error("No params!"));
    });
};
//Export the module
module.exports = dataLib;