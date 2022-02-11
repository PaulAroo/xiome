
import {restricted} from "@chasemoskal/snapstate"

import {ops} from "../../../../framework/ops.js"
import {Service} from "../../../../types/service.js"
import {makeStoreState} from "../state/make-store-state.js"
import {makeStoreAllowance} from "../utils/make-store-allowance.js"
import {makeBillingService} from "../../api/services/billing-service.js"
import {TriggerCheckoutPopup} from "../../types/store-popups.js"

export function makeBillingSubmodel({
		snap, allowance, billingService, triggerCheckoutPaymentMethodPopup,
	}: {
		snap: ReturnType<typeof makeStoreState>
		allowance: ReturnType<typeof makeStoreAllowance>
		billingService: Service<typeof makeBillingService>
		triggerCheckoutPaymentMethodPopup: TriggerCheckoutPopup
	}) {

	async function loadPaymentMethodDetails() {
		return ops.operation({
			promise: billingService.getPaymentMethodDetails(),
			setOp: op => snap.state.billing.paymentMethodOp = op,
		})
	}

	async function initialize() {
		if (ops.isNone(snap.state.billing.paymentMethodOp)) {
			await loadPaymentMethodDetails()
		}
	}

	async function checkoutPaymentMethod() {
		const {stripeSessionId, stripeSessionUrl} =
			await billingService.checkoutPaymentMethod()
		await triggerCheckoutPaymentMethodPopup({stripeSessionId, stripeSessionUrl})
		await loadPaymentMethodDetails()
	}

	return {
		allowance,
		state: snap.readable,
		snap: restricted(snap),
		initialize,
		loadPaymentMethodDetails,
		checkoutPaymentMethod,
	}
}
