import fs from "fs";
import { Airport, Position } from "./types/data.js";

export class AirspaceData {
	public positions: Position[] = [];
	public airports: Airport[] = [];

	public airportsMap: Map<string, Airport> = new Map();
	public positionsMap: Map<string, Position> = new Map();

	public airportFiles: Map<string, string> = new Map();
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

				this.airportFiles.set(airport.icao, fileId);
			}

			for (const position of this.positions) {
				this.positionsMap.set(`${fileId}_${position.id}`, position);
			}

			for (const airport of this.airports) {
				this.airportsMap.set(`${fileId}_${airport.icao}`, airport);
			}
		}
	}

	public getAerodromeTopdown(icao: string): Map<string, Position> {
		const res = new Map();

		const airportFileId = this.airportFiles.get(icao);
		if (!airportFileId) return res;

		const airport = this.airportsMap.get(`${airportFileId}_${icao}`);
		if (!airport) return res;

		for (const position of airport.baseTopdown) {
			res.set(`${icao}_${position}`, null);
		}
		for (const position of airport.extendedTopdown) {
			res.set(position, this.positionsMap.get(`${airportFileId}_${position}`));
		}

		return res;
	}
}

// export const airspaceData = new AirspaceData();
