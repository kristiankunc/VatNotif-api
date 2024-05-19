export function normaliseCallsign(callsign: string): string {
	return callsign.toUpperCase().replace(/_+/g, "_");
}
