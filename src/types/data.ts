export interface Position {
	id: string;
	file: string;
	frequency: string;
	logons: string[];
	prefix: string[];
	type: string;
}

export interface Airport {
	icao: string;
	file: string;
	baseTopdown: string[];
	extendedTopdown: string[];
}
