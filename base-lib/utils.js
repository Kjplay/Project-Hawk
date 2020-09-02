var lib = {};
/**
 * @description Intended use await dealy(time) - just like sleep in C++
 * @param {number} time
 * @returns {Promise<boolean>} 
 */
lib.delay = function(time) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true);
        }, time)
    });
};
lib.isLowerCase = function(str) {
    return str === str.toLowerCase(); 
};
lib.toUpperCase = function(str){
    return str.toUpperCase();
};
lib.toLowerCase = function(str){
    return str.toLowerCase();
};
lib.isUpperCase = function(str) {
    return str === str.toUpperCase(); 
};
lib.isFirstUpperCase = function(str) {
    return str === (str.charAt(0).toUpperCase()+str.slice(1).toLowerCase());
};
lib.isFirstLowerCase = function(str) {
    return str === (str.charAt(0).toLowerCase()+str.slice(1).toUpperCase());
};
lib.determineCase = function(str) {
    if (lib.isUpperCase(str)) return "UpperCase";
    else if (lib.isLowerCase(str)) return "LowerCase";
    else if (lib.isFirstLowerCase(str)) return "FirstLowerCase";
    else if (lib.isFirstUpperCase(str)) return "FirstUpperCase";
    else return "MixedCase";
};
lib.toFirstUpperCase = function(str) {
    return str.charAt(0).toUpperCase()+str.slice(1).toLowerCase();
};
lib.toFirstLowerCase = function(str) {
    return str.charAt(0).toLowerCase()+str.slice(1).toUpperCase();
};
lib.matchCase = function(template, str) {
    let Case = lib.determineCase(template);
    if (Case !== "MixedCase") return lib["to"+Case](str);
    else return str;
};
lib.assert = function(values, types) {
    if (types.length < values.length) values = values.slice(0, types.length);
    for (let i=0;i< values.length;i++) {
        if (typeof types[i] === "string") {
            if (typeof values[i] !== types[i]) throw new Error((i+1)+"(th) argument is a(n) "+typeof values[i]+" but should be a(n) "+types[i]);
        } else if (!(values[i] instanceof types[i])) throw new Error((i+1)+"(th) argument should be an instance of "+types[i].constructor.name+"!");
    }
    return true;
};
lib.merge = function(obj1, obj2) {
    for (let key in obj2) {
        if (lib.isObject(obj1[key]) && lib.isObject(obj2[key])) obj1[key] = lib.merge(obj1[key], obj2[key]);
        else obj1[key] = obj2[key];
    }
    return obj1;
};
/**
 * @param {object} e 
 */
lib.isObject = function(e) {
    return e instanceof Object && !(e instanceof Array) && typeof e !== "function";
};
/**
 * @description Same as Array.splice(), but for strings
 * @param {string} string 
 * @param {number} idx 
 * @param {number} rem 
 * @param {string} [str=""] 
 */
lib.splice = function (string, idx, rem, str="") {
    return string.slice(0, idx) + str + string.slice(idx + Math.abs(rem));
};
lib.stringTester = function(str, options) {
    options = lib.isObject(options) ? options : {};
    
};
module.exports = lib;