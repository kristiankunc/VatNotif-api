export type Controller = {
	cid: number;
	name: string;
	callsign: string;
	frequency: string;
	facility: number;
	rating: number;
	server: string;
	visualRange: number;
	textAtis: string[] | null;
	lastUpdated: Date;
	logonTime: Date;
};
