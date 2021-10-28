
import {Suite} from "cynic"

import {fakeNoteDraft} from "./testing/fakes/fake-note-draft.js"
import {notesTestingSetup} from "./testing/notes-testing-setup.js"
import {fakeManyNoteDrafts} from "./testing/fakes/fake-many-note-drafts.js"
import {prepareNoteStatsAssertions} from "./testing/assertions/note-stats-assertions.js"
import {prepareNoteInboxAssertions} from "./testing/assertions/notes-page-assertions.js"

export default <Suite>{

	async "new count increases"() {
		const {userId, backend, frontend} = await notesTestingSetup()
		const {notesModel} = frontend
		const {notesDepositBox} = backend
		const {assertNoteCounts} = prepareNoteStatsAssertions({notesModel})

		await notesModel.loadStats()
		assertNoteCounts({newCount: 0, oldCount: 0})

		await notesDepositBox.sendNote(fakeNoteDraft(userId))
		await notesModel.loadStats()
		assertNoteCounts({newCount: 1, oldCount: 0})

		await notesDepositBox.sendNote(fakeNoteDraft(userId))
		await notesModel.loadStats()
		assertNoteCounts({newCount: 2, oldCount: 0})
	},

	async "a message for user is readable by user"() {
		const {userId, backend, frontend} = await notesTestingSetup()
		const {notesModel} = frontend
		const {notesDepositBox} = backend
		const {loadNewPage} = prepareNoteInboxAssertions({notesModel})

		const draft = fakeNoteDraft(userId)
		await notesDepositBox.sendNote(draft)

		const pageTesting = await loadNewPage({pageSize: 10, pageNumber: 0})
		pageTesting.assertNotesLength(1)
		pageTesting.assertNoteTitle(0, draft.title)
	},

	async "a message cannot be read by the wrong user"() {
		const {rando, backend, frontend} = await notesTestingSetup()
		const {notesModel} = frontend
		const {notesDepositBox} = backend
		const {loadNewPage} = prepareNoteInboxAssertions({notesModel})

		const draft = fakeNoteDraft(rando.randomId().toString())
		await notesDepositBox.sendNote(draft)

		const pageTesting = await loadNewPage({pageSize: 10, pageNumber: 0})
		pageTesting.assertNotesLength(0)
	},

	async "user can mark a message old and then new again"() {
		const {userId, backend, frontend} = await notesTestingSetup()
		const {notesModel} = frontend
		const {notesDepositBox} = backend
		const {loadNewPage, loadOldPage} = prepareNoteInboxAssertions({notesModel})

		const draft = fakeNoteDraft(userId)
		await notesDepositBox.sendNote(draft)

		{
			const pageTesting = await loadNewPage({pageSize: 10, pageNumber: 0})
			pageTesting.assertNotesLength(1)
			const {noteId} = pageTesting.notes[0]
			await notesModel.markNotesOld([noteId])
		}
		{
			const pageTesting = await loadNewPage({pageSize: 10, pageNumber: 0})
			pageTesting.assertNotesLength(0)
		}
		{
			const pageTesting = await loadOldPage({pageSize: 10, pageNumber: 0})
			pageTesting.assertNotesLength(1)
			const {noteId} = pageTesting.notes[0]
			await notesModel.markNotesNew([noteId])
		}
		{
			const newTesting = await loadNewPage({pageSize: 10, pageNumber: 0})
			const oldTesting = await loadOldPage({pageSize: 10, pageNumber: 0})
			oldTesting.assertNotesLength(0)
			newTesting.assertNotesLength(1)
		}
	},

	async "users can manage notes in bulk"() {
		const {userId, backend, frontend} = await notesTestingSetup()
		const {notesModel} = frontend
		const {notesDepositBox} = backend
		const {assertNoteCounts} = prepareNoteStatsAssertions({notesModel})
		const {loadNewPage, loadOldPage} = prepareNoteInboxAssertions({notesModel})

		const drafts = fakeManyNoteDrafts(userId, 100)
		await notesDepositBox.sendNotes(drafts)

		{
			await notesModel.loadStats()
			assertNoteCounts({newCount: 100, oldCount: 0})
			const pageTesting = await loadNewPage({pageSize: 10, pageNumber: 0})
			pageTesting.assertNotesLength(10)
			const noteIds = pageTesting.notes.map(n => n.noteId)
			await notesModel.markNotesOld(noteIds)
		}
		{
			await notesModel.loadStats()
			assertNoteCounts({newCount: 90, oldCount: 10})
			const newTesting = await loadNewPage({pageSize: 10, pageNumber: 0})
			const oldTesting = await loadOldPage({pageSize: 10, pageNumber: 0})
			newTesting.assertNotesLength(10)
			oldTesting.assertNotesLength(10)
		}
	},
}
