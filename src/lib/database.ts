import { createConnection, Connection } from "mysql2/promise";
import { mysqlConfig } from "../conf/mysql.js";
import { PushNotificationSubscription } from "../types/push-notification.js";
import { ukData } from "../uk-data.js";

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

	public static async getAffectedCids(callsign: string): Promise<number[]> {
		const controllersBelow = ukData.controllerCallsignTopdown.get(callsign) || [];

		let sql = "SELECT cid, callsign, topdown from watched_callsigns WHERE ? LIKE callsign";
		const values = [callsign];

		for (const controller of controllersBelow) {
			sql += " OR ? LIKE callsign";
			values.push(controller.callsign);
		}
		sql += ";";

		const rows = await this.query(sql, values);

		const affectedData = rows.map((row: { cid: number; callsign: string; topdown: number }) => {
			return {
				cid: row.cid,
				callsign: row.callsign,
				topdown: row.topdown === 1,
			};
		});

		const res: number[] = [];
		for (const row of affectedData) {
			if (row.callsign == callsign) {
				res.push(row.cid);
			} else if (row.topdown) {
				res.push(row.cid);
			}
		}
		// avoid duplicates
		return [...new Set(res)];
	}

	public static async getWebhooksFromCallsign(callsign: string, affectedCids: number[]): Promise<string[]> {
		let webhookUrls: string[] = [];

		for (const cid of affectedCids) {
			const sql = "SELECT webhook_url FROM discord_notifications WHERE cid = ?";
			const values = [cid];

			const rows = await this.query(sql, values);

			webhookUrls = webhookUrls.concat(rows.map((row: { webhook_url: string }) => row.webhook_url));
		}

		return webhookUrls;
	}

	public static async getIgnoredCids(): Promise<number[]> {
		const sql = "SELECT cid FROM ignored_cids";

		const rows = await this.query(sql);

		return rows.map((row: { cid: number }) => row.cid);
	}

	public static async registerPushNotification(cid: string, subscription: PushNotificationSubscription): Promise<void> {
		const sql = `
		INSERT INTO push_notifications (cid, endpoint, expiration_time, p256dh, auth)
		VALUES (?, ?, ?, ?, ?)
	  `;
		const values = [cid, subscription.endpoint, subscription.expirationTime, subscription.keys.p256dh, subscription.keys.auth];

		await this.query(sql, values);
	}

	public static async getPushFromCallsign(callsign: string, affectedCids: number[]): Promise<PushNotificationSubscription[]> {
		let pushSubscriptions: PushNotificationSubscription[] = [];

		for (const cid of affectedCids) {
			const sql = "SELECT * FROM push_notifications WHERE cid = ?";
			const values = [cid];

			const rows = await this.query(sql, values);

			pushSubscriptions = pushSubscriptions.concat(
				rows.map((row: { endpoint: string; expiration_time: number; p256dh: string; auth: string }) => {
					return {
						endpoint: row.endpoint,
						expirationTime: row.expiration_time,
						keys: {
							p256dh: row.p256dh,
							auth: row.auth,
						},
					};
				})
			);
		}

		return pushSubscriptions;
	}
}
