
import {SubscriptionPricing} from "../../../types/store-concepts.js"
import {validateId} from "../../../../../common/validators/validate-id.js"
import {EditPlanDraft, EditTierDraft, SubscriptionPlanDraft, SubscriptionTierDraft} from "../planning/planning-types.js"
import {boolean, branch, is, maxLength, min, minLength, number, regex, schema, string, validator, zeroWhitespace} from "../../../../../toolbox/darkvalley.js"

export const validatePriceNumber = validator<number>(
	number(),
	min(0.01),
)

export const validateLabel = validator<string>(
	string(),
	minLength(1),
	maxLength(32),
)

export const validateCurrency = validator<"usd">(
	string(),
	branch(
		is("usd"),
	),
)

export const validateInterval = validator<"month" | "year">(
	string(),
	branch(
		is("month"),
		is("year"),
	),
)

export const validateSubscriptionPricing = schema<SubscriptionPricing>({
	price: validatePriceNumber,
	currency: validateCurrency,
	interval: validateInterval,
})

export const validateBoolean = validator<boolean>(
	boolean(),
)

export const validatePricing = schema<SubscriptionPricing>({
	currency: validateCurrency,
	interval: validateInterval,
	price: validatePriceNumber,
})

export const validateNewTierDraft = schema<SubscriptionTierDraft>({
	label: validateLabel,
	pricing: validatePricing,
})

export const validateNewPlanDraft = schema<SubscriptionPlanDraft>({
	planLabel: validateLabel,
	tier: validateNewTierDraft,
})

export const validateEditPlanDraft = schema<EditPlanDraft>({
	planId: validateId,
	label: validateLabel,
	archived: validateBoolean,
})

export const validateEditTierDraft = schema<EditTierDraft>({
	tierId: validateId,
	label: validateLabel,
	active: validateBoolean,
	pricing: validatePricing,
})
