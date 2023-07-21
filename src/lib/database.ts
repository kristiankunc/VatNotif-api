import { createConnection, Connection } from "mysql2/promise";
import { mysqlConfig } from "../conf/mysql.js";

export class Database {
	private static async connect(): Promise<Connection> {
		return await createConnection({
			host: mysqlConfig.host,
			port: mysqlConfig.port,
			user: mysqlConfig.username,
			password: mysqlConfig.password,
			database: mysqlConfig.database,
		});
	}

	private static async disconnect(connection: Connection): Promise<void> {
		connection.end();
	}

	private static async query(sql: string, values?: any[]): Promise<any> {
		const connection = await this.connect();
		const [rows] = await connection.execute(sql, values);
		await this.disconnect(connection);

		return rows;
	}

	public static async getWebhooksFromCallsign(callsign: string): Promise<string[]> {
		let sql = "SELECT cid FROM watched_callsigns WHERE callsign = ?";
		let values = [callsign];

		let rows = await this.query(sql, values);

		const affectedCids = rows.map((row: { cid: string }) => row.cid);

		let webhookUrls: string[] = [];

		for (const cid of affectedCids) {
			sql = "SELECT webhook_url FROM discord_notifications WHERE cid = ?";
			values = [cid];

			rows = await this.query(sql, values);

			webhookUrls = webhookUrls.concat(rows.map((row: { webhook_url: string }) => row.webhook_url));
		}

		return webhookUrls;
	}

	public static async getIgnoredCids(): Promise<number[]> {
		const sql = "SELECT cid FROM ignored_cids";

		const rows = await this.query(sql);

		return rows.map((row: { cid: number }) => row.cid);
	}

	public static async registerPushNotification(cid: string, subscription: any): Promise<void> {
		const query = `
		INSERT INTO push_notifications (cid, endpoint, expiration_time, p256dh, auth)
		VALUES (?, ?, ?, ?, ?)
	  `;
		const values = [cid, subscription.endpoint, subscription.expirationTime, subscription.keys.p256dh, subscription.keys.auth];

		await this.query(query, values);
	}
}
