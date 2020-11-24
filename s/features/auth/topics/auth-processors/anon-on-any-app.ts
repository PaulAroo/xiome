
import {AppToken, AppPayload, AuthProcessorPreparations, Tables} from "./../../auth-types.js"

export function prepareAnonOnAnyApp<T extends Tables>({
			verifyToken,
			constrainTables,
		}: AuthProcessorPreparations<T>) {

	return async({appToken}: {appToken: AppToken}) => {
		const app = await verifyToken<AppPayload>(appToken)
		return {
			app,
			tables: <T>constrainTables({appId: app.appId}),
		}
	}
}
