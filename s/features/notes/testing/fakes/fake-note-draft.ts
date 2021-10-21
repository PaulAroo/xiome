
import {DraftForNote, Notes} from "../../types/notes-concepts.js"

export function fakeNoteDraft(userId: string): DraftForNote<Notes.Message> {
	return {
		type: "message",
		to: userId,
		from: undefined,
		title: "this note title is a test",
		text: "this is some test note contents",
		details: {},
	}
}
