
import {escapeHtml} from "../escape-html.js"
import {escapeRegex} from "../escape-regex.js"

export class HtmlTemplate {
	#strings: string[]
	#values: any[]

	constructor({strings, values}) {
		this.#strings = strings
		this.#values = values
	}

	#processValue(value: any) {
		return value instanceof HtmlTemplate
			? value.toString()
			: escapeHtml(value.toString())
	}

	toString() {
		return this.#strings.reduce(
			(previous, current, index) => {
				const value = this.#values[index] ?? ""
				const safeValue = Array.isArray(value)
					? value.map(this.#processValue).join("")
					: this.#processValue(value)
				return previous + current + safeValue
			},
			""
		)
	}
}

export function html(
		strings: TemplateStringsArray,
		...values: any[]
	): HtmlTemplate {

	return new HtmlTemplate({strings, values})
}

export function render(template: HtmlTemplate) {
	return template.toString()
}

export function untab(code: string) {
	const lines = code.split(/\r|\n/)

	let baseTabLevel: number
	for (const line of lines) {
		const isOnlyWhitespace = /^\s+$/.test(line)
		if (!isOnlyWhitespace) {
			const tabMatch = line.match(/^(\t+).+/)
			if (tabMatch) {
				const tabCount = tabMatch[1].length
				baseTabLevel = baseTabLevel === undefined
					? tabCount
					: tabCount < baseTabLevel
						? tabCount
						: baseTabLevel
				if (baseTabLevel === 0)
					break
			}
		}
	}

	const rebaseTabRegex = new RegExp(`^\\t{${baseTabLevel}}`)

	return lines
		.map(line => /^\s+$/.test(line) ? "" : line)
		.map(line => line.replace(rebaseTabRegex, ""))
		.join("\n")
}
