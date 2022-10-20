
import {SubscriptionTier, SubscriptionPlan, SubscriptionDetails, SubscriptionStatus} from "../../../isomorphic/concepts.js"

export interface TierBasics {
	tier: SubscriptionTier
	plan: SubscriptionPlan
	mySubscriptionDetails: SubscriptionDetails[]
}

export enum TierButton {
	Buy,
	Upgrade,
	Downgrade,
	Pay,
	Cancel,
	Renew,
}

export interface TierInteractivity {
	button: TierButton
	action: () => Promise<void>
}

export interface TierContext {
	subscription: SubscriptionDetails | undefined
	tierIndex: number
	status: SubscriptionStatus
	subscribedTierIndex: number | undefined
	isSubscribedToThisTier: boolean
	isAnotherTierInPlanUnpaid: boolean
}
