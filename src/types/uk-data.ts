export interface UkAirfield {
	id: number;
	code: string;
	controllers: UkController[];
}

export interface UkController {
	id: number;
	callsign: string;
	frequency: string;
}
