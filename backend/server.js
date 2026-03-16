const express = require("express");
const cors = require("cors");
const sql = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/streetlights", async (req, res) => {

    try{
        const result = await sql.query("SELECT * FROM Streetlights");
        res.json(result.recordset);
    }
    catch(err){
        res.send(err);
    }

});

app.post("/streetlights", async (req,res)=>{

    const {location} = req.body;

    try{

        await sql.query`
        INSERT INTO Streetlights
        (location, ambient_light, traffic_density, brightness, energy_usage, status)
        VALUES
        (${location},50,20,40,32,'Active')
        `;

        res.send("Streetlight added");

    }catch(err){
        res.send(err);
    }

});

app.put("/streetlights/:id", async (req,res)=>{

    const id = req.params.id;
    const {ambient_light,traffic_density} = req.body;

    let brightness = 40;

    if(ambient_light < 30 && traffic_density > 50){
        brightness = 100;
    }
    else if(ambient_light < 50){
        brightness = 70;
    }

    const energy = brightness * 0.8;

    try{

        await sql.query`
        UPDATE Streetlights
        SET ambient_light=${ambient_light},
            traffic_density=${traffic_density},
            brightness=${brightness},
            energy_usage=${energy}
        WHERE id=${id}
        `;

        res.send("Streetlight updated");

    }catch(err){
        res.send(err);
    }

});

app.listen(5000,()=>{
    console.log("Server running on port 5000");
});