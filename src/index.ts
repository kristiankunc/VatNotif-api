import express from "express";

import { Vatsim } from "./vatsim.js";

const app = express();

const vatsim = new Vatsim();
await vatsim.initialize();

app.get("/", (req, res) => {
	res.json({ message: "VatNotif API" });
});

app.get("/controllers/online", async (req, res) => {
	res.json(vatsim.getOnlineControllers());
});

app.get("/controllers/new", async (req, res) => {
	res.json(vatsim.getNewControllers());
});

app.listen(8000, () => {
	console.log(`VatNotif API listening at http://localhost:8000`);
});
