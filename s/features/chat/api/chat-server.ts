
import json5 from "json5"
import * as renraku from "renraku"
import {webSocketServer} from "renraku/x/websocket/socket-server.js"

import {getRando} from "../../../toolbox/get-rando.js"
import {makeChatServerCore} from "./cores/chat-server-core.js"
import {makeChatClientside} from "./services/chat-clientside.js"
import {deathWithDignity} from "../../../toolbox/death-with-dignity.js"
import {SecretConfig} from "../../../assembly/backend/types/secret-config.js"
import {mockChatPersistence} from "./cores/persistence/mock-chat-persistence.js"
import {prepareAuthPolicies} from "../../auth/policies/prepare-auth-policies.js"
import {memoryFlexStorage} from "../../../toolbox/flex-storage/memory-flex-storage.js"
import {configureMongo} from "../../../assembly/backend/configurators/configure-mongo.js"
import {assimilateCrypto} from "../../../assembly/backend/assimilators/assimilate-crypto.js"
import {assimilateDatabase} from "../../../assembly/backend/assimilators/assimilate-database.js"
import {configureTokenFunctions} from "../../../assembly/backend/configurators/configure-token-functions.js"
import {mongoChatPersistence} from "./cores/persistence/chat-persistence-mongo.js"

void async function main() {
	const {onDeath} = deathWithDignity()

	const config = json5.parse<SecretConfig>(process.env.XIOME_CONFIG)
	const rando = await getRando()
	const storage = memoryFlexStorage()

	const crypto = assimilateCrypto({
		config,
		configureTokenFunctions,
	})

	const {database} = await assimilateDatabase({
		config,
		configureMongo,
		configureMockStorage: () => storage,
	})

	const authPolicies = prepareAuthPolicies({
		config,
		appTables: database.apps,
		authTables: database.auth,
		verifyToken: crypto.verifyToken,
	})

	// const persistence = await mockChatPersistence(storage)
	const persistence = await mongoChatPersistence()

	const core = makeChatServerCore({
		rando,
		persistence,
		policy: authPolicies.anonPolicy,
	})

	const port = config?.chat?.port ?? 8000
	const server = webSocketServer({
		port,
		exposeErrors: true,
		maxPayloadSize: renraku.megabytes(1),
		acceptConnection({controls, headers, prepareClientApi}) {
			const {api, disconnect} = core.acceptNewClient({
				headers,
				controls,
				clientside: prepareClientApi<ReturnType<typeof makeChatClientside>>({
					chatClient: async() => {},
				}),
				handleDisconnect: () => {},
			})
			return {
				api,
				handleConnectionClosed: disconnect,
			}
		},
	})

	console.log(`🚀 chat server listening on port ${port}`)
	onDeath(() => server.close())
}()
