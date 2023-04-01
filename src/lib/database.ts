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

		sql = "SELECT webhook_url FROM discord_notifications WHERE cid = ?";
		values = [affectedCids];

		rows = await this.query(sql, values);

		const webhookUrls = rows.map((row: { webhook_url: string }) => row.webhook_url);

		return webhookUrls;
	}
}
