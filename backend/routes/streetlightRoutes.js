const express = require("express");
const router = express.Router();
const controller = require("../controllers/streetlightController");

router.get("/",controller.getLights);
router.post("/",controller.createLight);
router.put("/:id",controller.updateLight);

module.exports = router;