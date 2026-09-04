// Maximum 4 paragraphs per response. A response-only rule: a whole document may have more.
import { paragraphs } from '../Paragraphs.js'

/**
 * @param {string} text
 * @param {{ limit?: number }} [options]
 * @returns {{ index: number, length: number, text: string, context: string, message: string, number: number, total: number, limit: number }[]}  one match per paragraph past the limit
 */
export function maxParagraphs(text, { limit = 4 } = {}) {
	limit = +limit
	text = String(text ?? '')
	const all = paragraphs(text)
	return all.slice(limit).map((p, i) => {
		const number = limit + i + 1, total = all.length
		return {
			index: p.index, length: p.length, text: p.text, context: text,
			message: `Cut to ${limit} paragraphs. This is paragraph ${number} of ${total}.`,
			number, total, limit,
		}
	})
}
