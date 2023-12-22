import fs from "fs";
import { Airport, Position } from "./types/data.js";

export class AirspaceData {
	public positions: Position[] = [];
	public airports: Airport[] = [];

	public airportsMap: Map<string, Map<string, Airport>> = new Map(); // file<icao<airport>>
	public positionsMap: Map<string, Map<string, Position>> = new Map(); // file<id<position>>

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

			this.airportsMap.set(fileId, new Map());
			this.positionsMap.set(fileId, new Map());

			for (const position of positionsArr) {
				const validLogons = [];
				for (const prefix of position.pre) {
					validLogons.push(`${prefix}_${position.type}`);
				}

				this.positionsMap.get(fileId)?.set(position.id, {
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
				this.airportsMap.get(fileId)?.set(airport.icao, {
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

	public getAerodromeTopdown(icao: string): Map<string, Position> {
		const res = new Map();

		for (const [file, airports] of this.airportsMap) {
			if (airports.has(icao)) {
				const airport = airports.get(icao);
				for (const pos of airport?.baseTopdown || []) {
					res.set(pos, {
						id: `${icao}_${pos}`,
						file,
						frequency: "199.998",
						logons: [`${icao}_${pos}`],
						prefix: [icao],
						type: pos,
					} as Position);
				}
				for (const pos of airport?.extendedTopdown || []) {
					if (this.positionsMap.get(file)?.has(pos)) {
						res.set(pos, this.positionsMap.get(file)?.get(pos) as Position);
					}
				}
			}
		}
		return res;
	}

	public getAerodromeFrequencies(icao: string): Map<string, string> {
		const res = new Map();
		// return the frequency of all positions in its topdown above TWR
		for (const [file, airports] of this.airportsMap) {
			if (airports.has(icao)) {
				const airport = airports.get(icao);
				for (const pos of airport?.extendedTopdown || []) {
					if (this.positionsMap.get(file)?.has(pos)) {
						res.set(pos, this.positionsMap.get(file)?.get(pos)?.frequency as string);
					}
				}
			}
		}
		return res;
	}

	public getData(position: string): Position[] {
		const res = [];
		for (const [file, positions] of this.positionsMap) {
			for (const [id, pos] of positions) {
				if (pos.logons.includes(position)) res.push(pos);
			}
		}
		return res;
	}
}

export const airspaceData = new AirspaceData();
