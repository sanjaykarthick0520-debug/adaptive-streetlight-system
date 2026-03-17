const express = require("express");
const cors = require("cors");
const sql = require("./db");

const app = express();

// ✅ Allow Vercel frontend
app.use(cors({
    origin: "*", // later you can restrict to your Vercel URL
}));

app.use(express.json());

// ✅ Health check route (important for Render)
app.get("/", (req, res) => {
    res.send("Backend is running 🚀");
});

// ✅ GET all streetlights
app.get("/streetlights", async (req, res) => {
    try {
        const result = await sql.query("SELECT * FROM Streetlights");
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error fetching data" });
    }
});

// ✅ ADD streetlight
app.post("/streetlights", async (req, res) => {
    const { location } = req.body;

    try {
        await sql.query`
        INSERT INTO Streetlights
        (location, ambient_light, traffic_density, brightness, energy_usage, status)
        VALUES
        (${location},50,20,40,32,'Active')
        `;

        res.json({ message: "Streetlight added" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Insert failed" });
    }
});

// ✅ UPDATE streetlight
app.put("/streetlights/:id", async (req, res) => {
    const id = req.params.id;
    const { ambient_light, traffic_density } = req.body;

    let brightness = 40;

    if (ambient_light < 30 && traffic_density > 50) {
        brightness = 100;
    } else if (ambient_light < 50) {
        brightness = 70;
    }

    const energy = brightness * 0.8;

    try {
        await sql.query`
        UPDATE Streetlights
        SET ambient_light=${ambient_light},
            traffic_density=${traffic_density},
            brightness=${brightness},
            energy_usage=${energy}
        WHERE id=${id}
        `;

        res.json({ message: "Streetlight updated" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Update failed" });
    }
});

// ✅ IMPORTANT: Dynamic PORT (Render requirement)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});