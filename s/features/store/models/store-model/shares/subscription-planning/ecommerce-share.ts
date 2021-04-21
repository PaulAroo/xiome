
import {ops} from "../../../../../../framework/ops.js"
import {storageCache} from "../../../../../../toolbox/flex-storage/cache/storage-cache.js"
import {FlexStorage} from "../../../../../../toolbox/flex-storage/types/flex-storage.js"
import {minute} from "../../../../../../toolbox/goodtimes/times.js"
import {onesie} from "../../../../../../toolbox/onesie.js"
import {Service} from "../../../../../../types/service.js"
import {statusCheckerTopic} from "../../../../topics/status-checker-topic.js"
import {statusTogglerTopic} from "../../../../topics/status-toggler-topic.js"
import {StoreStatus} from "../../../../topics/types/store-status.js"
import {storeCore} from "../../core/store-core.js"

export function ecommerceShare({
		appId,
		storage,
		statusCheckerService,
		statusTogglerService,
		core: {state, actions},
	}: {
		appId: string
		storage: FlexStorage
		core: ReturnType<typeof storeCore>
		statusCheckerService: Service<typeof statusCheckerTopic>
		statusTogglerService: Service<typeof statusTogglerTopic>
	}) {

	const cache = storageCache({
		lifespan: 5 * minute,
		storage,
		storageKey: `cache-store-status-${appId}`,
		load: onesie(statusCheckerService.getStoreStatus),
	})

	async function fetchStoreStatus(forceFresh = false) {
		await ops.operation({
			promise: forceFresh
				? cache.readFresh()
				: cache.read(),
			setOp: op => actions.setStatus(op),
		})
	}

	async function enableEcommerce() {
		await statusTogglerService.enableEcommerce()
		actions.setStatus(ops.ready(StoreStatus.Enabled))
	}

	async function disableEcommerce() {
		await statusTogglerService.disableEcommerce()
		actions.setStatus(ops.ready(StoreStatus.Disabled))
	}

	const initialize = (() => {
		let done = false
		return async function() {
			if (!done) {
				done = true
				await fetchStoreStatus()
			}
		}
	})()

	return {
		get access() { return state.access },
		get storeStatus() { return state.status },
		initialize,
		enableEcommerce,
		disableEcommerce,
		fetchStoreStatus,
	}
}
