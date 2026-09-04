// Maximum one hedge per claim. A sentence with two or more hedge words is a match.
import { sentences } from '../Sentences.js'
import { phrases } from '../Phrases.js'
import { hedges } from '../data/hedges.js'

/**
 * @param {string} text
 * @param {{ limit?: number }} [options]
 * @returns {{ index: number, length: number, text: string, context: string, message: string, count: number, limit: number, hedges: string[] }[]}  one match per sentence over the limit. text is the span of the hedges past the limit
 */
export function oneHedge(text, { limit = 1 } = {}) {
	limit = +limit
	text = String(text ?? '')
	const out = []
	for (const s of sentences(text)) {
		const found = phrases(s.text, hedges)
		if (found.length > limit) {
			const list = found.map(f => f.text)
			const first = found[limit]
			const last = found[found.length - 1]
			const span = s.text.slice(first.index, last.index + last.length)
			out.push({ index: s.index + first.index, length: span.length, text: span, context: s.text, message: `Keep one hedge. This sentence has ${list.length}: ${list.map(t => `"${t}"`).join(', ')}.`, count: list.length, limit, hedges: list })
		}
	}
	return out
}
