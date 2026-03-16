const db = require("../db");

exports.getAllLights = (callback)=>{
    db.query("SELECT * FROM streetlights", callback);
};

exports.createLight = (data,callback)=>{
    db.query("INSERT INTO streetlights SET ?", data, callback);
};

exports.updateLight = (id,data,callback)=>{
    db.query("UPDATE streetlights SET ? WHERE id=?", [data,id], callback);
};