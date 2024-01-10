import { UkAirfield, UkController } from "./types/uk-data.js";

class UkData {
	public readonly airfieldMap: Map<string, UkAirfield> = new Map(); // icao(code) -> UkAirfield
	public readonly controllerIdMap: Map<number, UkController> = new Map(); // id -> UkController
	public readonly controllerCallsignMap: Map<string, UkController> = new Map(); // callsign -> UkController
	public readonly controllerCallsignTopdown: Map<string, UkController[]> = new Map(); // callsign -> UkController[] (controllers below the pos)

	public async fetchData() {
		let rawControllers = await this.fetchJson("https://ukcp.vatsim.uk/api/controller");
		let rawAirfields = await this.fetchJson("https://ukcp.vatsim.uk/api/airfield");

		for (let rawController of rawControllers) {
			let controller: UkController = {
				id: rawController.id,
				callsign: rawController.callsign,
				frequency: rawController.frequency,
			};
			this.controllerIdMap.set(controller.id, controller);
			this.controllerCallsignMap.set(controller.callsign, controller);
		}

		for (let rawAirfield of rawAirfields) {
			let airfield: UkAirfield = {
				id: rawAirfield.id,
				code: rawAirfield.code,
				controllers: rawAirfield.controllers.map((controllerId: number) => this.controllerIdMap.get(controllerId)),
			};
			this.airfieldMap.set(airfield.code, airfield);

			const reversedTopdown = [...airfield.controllers].reverse();

			for (let i = 0; i < reversedTopdown.length; i++) {
				const controller = reversedTopdown[i];
				const controllersBelow = reversedTopdown.slice(i + 1);

				if (!controllersBelow) break;

				const existingControllerTopdown = this.controllerCallsignTopdown.get(controller.callsign);
				this.controllerCallsignTopdown.set(
					controller.callsign,
					existingControllerTopdown ? existingControllerTopdown.concat(controllersBelow) : controllersBelow
				);
			}
		}
	}

	private async fetchJson(url: string): Promise<any> {
		let res = await fetch(url);
		return await res.json();
	}
}

export const ukData = new UkData();
