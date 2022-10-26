
import Stripe from "stripe"

import {SubscriptionPricing, SubscriptionTier} from "../../../isomorphic/concepts.js"
import {SubscriptionTierRow} from "../../database/types/rows/subscription-tier-row.js"

export function buildFinalTierObject(
		tierRow: SubscriptionTierRow,
		stripePrice: Stripe.Response<Stripe.Price>,
		stripeProduct: Stripe.Response<Stripe.Product>,
	): SubscriptionTier {

	return {
		tierId: tierRow.tierId.string,
		roleId: tierRow.roleId.string,
		label: tierRow.label,
		time: tierRow.time,
		active: stripeProduct.active,
		pricing: stripePrice?.active
			? [{
				stripePriceId: stripePrice.id,
				price: stripePrice.unit_amount,
				currency: stripePrice.currency as SubscriptionPricing["currency"],
				interval: stripePrice.recurring.interval as SubscriptionPricing["interval"]
			}]
			: undefined
	}
}
