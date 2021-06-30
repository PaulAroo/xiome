
import {SecretConfig} from "./types/secret-config.js"
import {day, minute} from "../../toolbox/goodtimes/times.js"

export const mockConfig = (): SecretConfig => ({
	server: {
		port: 4999,
		detailedLogs: true,
	},
	platform: {
		technician: {
			email: "chasemoskal@gmail.com",
		},
		appDetails: {
			appId: "7nsgfgbP8PqcgNYk9hYxWdDcznTxndqpBG7WJDD9rpyCXHJg",
			label: "Xiome Cloud",
			home: "http://localhost:5000/x/",
			origins: [
				"http://localhost:5000",
			],
		},
	},
	email: "mock-console",
	database: "mock-localstorage",
	stripe: "mock-mode",
	crypto: {
		keys: "mock-mode",
		tokenLifespans: {
			login: 5 * minute,
			refresh: 30 * day,
			access: 5 * minute,
			external: 5 * minute,
		},
	},
})
