const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected 🚀"))
.catch(err => console.log(err));

// ✅ Schema
const streetlightSchema = new mongoose.Schema({
  location: String,
  ambient_light: Number,
  traffic_density: Number,
  brightness: Number,
  energy_usage: Number,
  status: String
});

const Streetlight = mongoose.model("Streetlight", streetlightSchema);

// ✅ Test route
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// ✅ GET
app.get("/streetlights", async (req, res) => {
  const data = await Streetlight.find();
  res.json(data);
});

// ✅ POST
app.post("/streetlights", async (req, res) => {
  const { location } = req.body;

  const newLight = new Streetlight({
    location,
    ambient_light: 50,
    traffic_density: 20,
    brightness: 40,
    energy_usage: 32,
    status: "Active"
  });

  await newLight.save();
  res.json({ message: "Added" });
});

// ✅ PUT
app.put("/streetlights/:id", async (req, res) => {
  const { ambient_light, traffic_density } = req.body;

  let brightness = 40;

  if (ambient_light < 30 && traffic_density > 50) brightness = 100;
  else if (ambient_light < 50) brightness = 70;

  const energy = brightness * 0.8;

  await Streetlight.findByIdAndUpdate(req.params.id, {
    ambient_light,
    traffic_density,
    brightness,
    energy_usage: energy
  });

  res.json({ message: "Updated" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));