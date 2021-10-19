
import {Question} from "../../../api/types/questions-and-answers.js"

export function sortQuestions(questions: Question[], myUserId?: string) {

	const myQuestions: Question[] = []
	const otherQuestions: Question[] = []
	const defaultTimeFactor: number = 86400000

	for (const question of questions) {
		const isMine = myUserId && question.authorUserId === myUserId
		if (isMine)
			myQuestions.push(question)
		else
			otherQuestions.push(question)
	}

	function valueOfVotesInTime(votes: number, timeFactor: number) {
		const value = votes*timeFactor
		return Math.log(value) / Math.LN10;
	}

	function sortingFunction(a: Question, b: Question) {
		const promoteA = -1
		const promoteB = 1
		
		const scoreA = a.timePosted + valueOfVotesInTime(a.likes, 1*defaultTimeFactor) - valueOfVotesInTime(a.reports, 2*defaultTimeFactor)
		const scoreB = b.timePosted + valueOfVotesInTime(b.likes, 1*defaultTimeFactor) - valueOfVotesInTime(b.reports, 2*defaultTimeFactor)


		if (scoreA > scoreB) return promoteA
		if (scoreB < scoreA) return promoteB

		// if (a.reports < b.reports) return promoteA
		// if (a.reports > b.reports) return promoteB

		// if (a.timePosted > b.timePosted) return promoteA
		// if (a.timePosted < b.timePosted) return promoteB

		return 0
	}

	return [
		...myQuestions.sort(sortingFunction),
		...otherQuestions.sort(sortingFunction),
	]
}
