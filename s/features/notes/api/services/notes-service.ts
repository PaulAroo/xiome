
import {apiContext} from "renraku/x/api/api-context.js"
import {Policy} from "renraku/x/types/primitives/policy.js"

import {DamnId} from "../../../../toolbox/damnedb/damn-id.js"
import {UserAuth, UserMeta} from "../../../auth/types/auth-metas.js"
import {SecretConfig} from "../../../../assembly/backend/types/secret-config.js"
import {UnconstrainedTables} from "../../../../framework/api/types/table-namespacing-for-apps.js"

import {NotesTables} from "../tables/notes-tables.js"
import {NotesAuth, NotesMeta} from "../types/notes-auth.js"
import {find, findAll} from "../../../../toolbox/dbby/dbby-helpers.js"
import {Notes, NotesStats, Pagination} from "../../types/notes-concepts.js"

import {validatePagination} from "../validation/validate-pagination.js"
import {runValidation} from "../../../../toolbox/topic-validation/run-validation.js"
import {validateId} from "../../../../common/validators/validate-id.js"
import {array, boolean, each, maxLength, schema, validator} from "../../../../toolbox/darkvalley.js"

export const makeNotesService = ({
		config, basePolicy,
		notesTables: rawNotesTables,
	}: {
		config: SecretConfig
		notesTables: UnconstrainedTables<NotesTables>
		basePolicy: Policy<UserMeta, UserAuth>
	}) => apiContext<NotesMeta, NotesAuth>()({

	async policy(meta, request) {
		const auth = await basePolicy(meta, request)
		const appId = DamnId.fromString(auth.access.appId)
		return {
			...auth,
			notesTables: rawNotesTables.namespaceForApp(appId),
		}
	},

	expose: {
		
		async getNotesStats({notesTables, access}): Promise<NotesStats> {
			const {userId} = access.user
			const newCount = await notesTables.notes.count(find({
				userId: DamnId.fromString(userId),
				old: false
			}))
			const oldCount = await notesTables.notes.count(find({
				userId: DamnId.fromString(userId),
				old: true
			}))
			return {newCount, oldCount}
		},
		
		async getNewNotes(
				{notesTables, access},
				pagination: Pagination
			): Promise<Notes.Any[]> {

			const {offset, limit} = runValidation(pagination, validatePagination)
			const {userId} = access.user

			const newNotes = await notesTables.notes.read({
				...find({
					userId: DamnId.fromString(userId),
					old: false
				}),
				offset,
				limit,
				order: {time: "descend"}
			})

			return newNotes.map(note => ({
				type: "message",
				noteId: note.noteId.toString(),
				time: note.time,
				old: note.old,
				from: undefined,
				to: note.to.toString(),
				text: note.text,
				title: note.title,
				details: {},
			}))
		},

		async getOldNotes(
				{notesTables, access},
				pagination: Pagination
			): Promise<Notes.Any[]> {

			const {offset, limit} = runValidation(pagination, validatePagination)
			const {userId} = access.user

			const oldNotes = await notesTables.notes.read({
				...find({
					userId: DamnId.fromString(userId),
					old: true
				}),
				offset,
				limit,
				order: {time: "descend"}
			})

			return oldNotes.map(note => ({
				type: "message",
				noteId: note.noteId.toString(),
				time: note.time,
				old: note.old,
				from: undefined,
				to: note.to.toString(),
				text: note.text,
				title: note.title,
				details: {},
			}))
		},

		async markAllNotesOld({notesTables, access}) {
			// update every old=false note to old=true
		},

		async markNotesNewOrOld({notesTables, access}, input: {
				old: boolean
				noteIds: string[]
			}) {
			const {userId} = access.user
			const {old, noteIds: noteIdStrings} = runValidation(input, schema({
				old: boolean(),
				noteIds: validator<string[]>(
					array(),
					maxLength(1000),
					each(validateId),
				),
			}))
			const noteIds = noteIdStrings.map(id => DamnId.fromString(id))
			const notes = await notesTables.notes.read(
				findAll(noteIds, noteId => ({noteId}))
			)
			// - ensure notes belong to the current user
			// - throw an api error 400 if the notes don't belong to this user
			// - update all the notes with the appropriate old value
		}
	},
})
