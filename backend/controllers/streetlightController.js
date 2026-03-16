const model = require("../models/streetlightModel");

exports.getLights = (req,res)=>{
    model.getAllLights((err,result)=>{
        if(err) throw err;
        res.json(result);
    });
};

exports.createLight = (req,res)=>{

    const data = {
        location:req.body.location,
        ambient_light:50,
        traffic_density:20,
        brightness:40,
        energy_usage:32,
        status:"Active"
    };

    model.createLight(data,(err,result)=>{
        if(err) throw err;
        res.json(result);
    });
};

exports.updateLight = (req,res)=>{

    const {ambient_light,traffic_density} = req.body;

    let brightness = 30;

    if(ambient_light < 30 && traffic_density > 50){
        brightness = 100;
    }
    else if(ambient_light < 50){
        brightness = 70;
    }
    else{
        brightness = 40;
    }

    const energy = brightness * 0.8;

    const data = {
        ambient_light,
        traffic_density,
        brightness,
        energy_usage:energy
    };

    model.updateLight(req.params.id,data,(err,result)=>{
        if(err) throw err;
        res.json(result);
    });
};