
import {Suite, assert, expect} from "cynic"
import {appLink} from "./helpers/constants.js"
import {signupAndLogin} from "./helpers/signup-and-login.js"
import {creativeSignupAndLogin} from "./helpers/creative-signup-and-login.js"

const creativeEmail = "creative@chasemoskal.com"
const customerEmail = "customer@chasemoskal.com"

export default <Suite>{
	"sign up and login": async() => {
		await creativeSignupAndLogin(creativeEmail)
	},

	"register app": async() => {
		const {appModel} = (await creativeSignupAndLogin(creativeEmail)).models
		assert(appModel.appListLoadingView.none, "applist loading should start 'none'")

		await appModel.loadAppList()
		assert(appModel.appListLoadingView.ready, "applist should be finished loading")
		assert(appModel.appListLoadingView.payload.length === 0, "should start with zero apps")

		const {appId} = await appModel.registerApp({
			home: appLink,
			label: "My App",
		})
		assert(appModel.appListLoadingView.payload.length === 1, "should now have one app")

		await expect(async() => {
			await appModel.registerApp({
				home: "badlink",
				label: "My App",
			})
		}).throws()
		assert(appModel.appListLoadingView.payload.length === 1, "should still have one app")

		await appModel.deleteApp(appId)
		assert(appModel.appListLoadingView.payload.length === 0, "deleted app should be gone")
	},

	"create an app token, and use it to login": async() => {
		const appOrigin = new URL(appLink).origin
		const platformWindow = await creativeSignupAndLogin(creativeEmail)
		const {appModel: platformAppModel} = platformWindow.models

		const {appId} = await platformAppModel.registerApp({
			home: appLink,
			label: "My App",
		})
		assert(platformAppModel.appListLoadingView.payload.length === 1, "should now have one app")
		const app = platformAppModel.appListLoadingView.payload[0]

		const {appTokenId} = await platformAppModel.registerAppToken({
			appId,
			label: "My App Token",
			origins: [appOrigin],
		})
		const token = platformAppModel.appListLoadingView.payload[0].tokens[0]
		assert(token, "app token should exist")
		assert(typeof token.appToken === "string", "token must be string")
		assert(token.appToken.length > 10, "token string must be many characters")
		assert(token.origins.length === 1, "token must have one origin")
		assert(token.origins[0] === appOrigin, "token origin must match")

		const {appToken} = token
		const appWindow = await signupAndLogin({
			appToken,
			appLink: app.home,
			email: customerEmail,
		})
	}

	// "generate an admin account to login with": true,
	// "no-can-do": {
	// 	"can't view platform stats": true,
	// 	"can't login to other creator's apps": true,
	// 	"can't protocol zero and roll platform secrets": true,
	// },
}
