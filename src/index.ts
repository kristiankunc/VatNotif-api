import express from "express";
import { Vatsim } from "./vatsim.js";

const app = express();
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

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
