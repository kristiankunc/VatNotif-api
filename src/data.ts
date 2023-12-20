import fs from "fs";
import { Airport, Position } from "./types/data.js";

export class AirspaceData {
	public positions: Position[] = [];
	public airports: Airport[] = [];

	private static defaultTopdown = {
		base: ["DEL", "GND", "TWR"],
		extended: ["F_APP", "APP"],
	};

	constructor() {
		const dataFiles = fs.readdirSync("./vatglasses-data/data");
		for (const file of dataFiles) {
			const fileId = file.split(".")[0];
			const data = JSON.parse(fs.readFileSync(`./vatglasses-data/data/${file}`, "utf8"));
			const positionsArr = Object.entries(data.positions).map(([id, value]) => {
				return { id, ...(value as any) };
			});

			for (const position of positionsArr) {
				const validLogons = [];
				for (const prefix of position.pre) {
					validLogons.push(`${prefix}_${position.type}`);
				}
				this.positions.push({
					id: position.id,
					file: fileId,
					frequency: position.frequency,
					logons: validLogons,
					prefix: position.pre,
					type: position.type,
				} as Position);
			}

			const airportsArr = Object.entries(data.airports).map(([icao, value]) => {
				return { icao, ...(value as any) };
			});

			for (const airport of airportsArr) {
				this.airports.push({
					icao: airport.icao,
					file: fileId,
					baseTopdown: (airport.default ? airport.default : true)
						? (AirspaceData.defaultTopdown.base as string[])
						: (AirspaceData.defaultTopdown.base.concat(AirspaceData.defaultTopdown.extended) as string[]),
					extendedTopdown: airport.topdown || [],
				} as Airport);
			}
		}
	}

	public getAerodromeTopdown(icao: string): Position[] {
		const airport = this.airports.find((airport) => airport.icao === icao);
		console.log(airport);
		if (!airport) {
			return [];
		}

		// return only extendedtopdown
		return airport.extendedTopdown.map((position) => this.positions.find((pos) => pos.id === position && airport.file === pos.file) as Position);
	}

	public getCallsignTopdown(callsign: string): { icao: string[][]; data: string[] } | null {
		const splits = callsign.split("_");
		const dataCallsign = this.positions.find((position) => position.prefix.includes(splits[0]) && position.type === splits[splits.length - 1]);

		if (!dataCallsign) {
			return null;
		}

		const airports = this.airports.filter((airport) => airport.file === dataCallsign.file && airport.extendedTopdown.includes(dataCallsign.id));

		const res: { icao: string[][]; data: string[] } = {
			icao: [],
			data: [],
		};
		for (const airport of airports) {
			const aiportIcao: string[] = [];
			airport.baseTopdown.map((position) => `${airport.icao}_${position}`).forEach((position) => aiportIcao.push(position));
			res.icao.push(aiportIcao);

			// get valid logon callsigns from the airporrt.extendedTopdown callsigns, get only ones BELOW the current callsign nad no duplicates
			airport.extendedTopdown.map((position) => this.positions.find((pos) => pos.id === position && airport.file === pos.file) as Position);
			const validLogons = airport.extendedTopdown
				.map((position) => this.positions.find((pos) => pos.id === position && airport.file === pos.file) as Position)
				.filter((position) => position.logons.indexOf(dataCallsign.id) < position.logons.indexOf(dataCallsign.id))
				.filter((position, index, self) => self.indexOf(position) === index);
			validLogons.forEach((position) => res.data.push(position.id));

			res.icao.push(aiportIcao);
		}

		return res;
	}
}

export const airspaceData = new AirspaceData();
