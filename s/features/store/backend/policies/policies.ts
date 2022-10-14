
import * as dbmage from "dbmage"
import * as renraku from "renraku"

import {StoreApiOptions} from "../types/options.js"
import {StripeConnectStatus} from "../../isomorphic/concepts.js"
import {fetchStripeConnectDetails} from "../utils/fetch-stripe-connect-details.js"
import {determineConnectStatus} from "../../isomorphic/utils/determine-connect-status.js"
import {helpersForManagingSubscriptions} from "../utils/helpers-for-managing-subscriptions.js"

export function makeStorePolicies<xMeta>(options: StoreApiOptions) {
	const {stripeLiaison, anonPolicy} = options

	async function connected(
			meta: xMeta,
			headers: renraku.HttpHeaders,
		) {
		const auth = await anonPolicy(meta, headers)
		const connectDetails = await fetchStripeConnectDetails({
			storeTables: auth.storeDatabase.tables,
			stripeLiaison: auth.stripeLiaison,
		})
		const connectStatus = determineConnectStatus(connectDetails)
		if (connectStatus !== StripeConnectStatus.Ready)
			throw new renraku.ApiError(
				400,
				"stripe account is not connected, and this action requires it"
			)
		const stripeLiaisonAccount = stripeLiaison
			.account(connectDetails.stripeAccountId)
		return {
			...auth,
			stripeLiaisonAccount,
			stripeAccountId: connectDetails.stripeAccountId,
		}
	}

	async function customer(
			meta: xMeta,
			headers: renraku.HttpHeaders,
		) {

		const auth = await connected(meta, headers)

		if (!auth.access.user)
			throw new renraku.ApiError(400, "user is not logged in")

		const userId = dbmage.Id.fromString(auth.access.user.userId)

		let customerRow
			= await auth
			.storeDatabase
			.tables
			.customers
			.readOne(dbmage.find({userId}))

		if (!customerRow) {
			const {id: stripeCustomerId}
				= await auth
				.stripeLiaisonAccount
				.customers
				.create({})

			customerRow = {
				userId,
				stripeCustomerId,
			}

			await auth
				.storeDatabase
				.tables
				.customers
				.create(customerRow)
		}

		const {stripeCustomerId} = customerRow
	
		return {
			...auth,
			stripeCustomerId,
		}
	}

	async function merchant(meta: xMeta, headers: renraku.HttpHeaders) {
		const auth = await connected(meta, headers)
		auth.checker.requirePrivilege("manage store")

		const connectStatus = determineConnectStatus(
			await fetchStripeConnectDetails({
				storeTables: auth.storeDatabase.tables,
				stripeLiaison: auth.stripeLiaison,
			})
		)

		if (connectStatus !== StripeConnectStatus.Ready)
			throw new renraku.ApiError(400, "stripe connect status not ready")

		const helpers = helpersForManagingSubscriptions({...options, ...auth})

		return {...auth, helpers}
	}

	return {
		anon: anonPolicy,
		connected,
		customer,
		merchant,
	}
}
