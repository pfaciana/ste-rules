// Maximum 50 words per paragraph.
import { paragraphs } from '../Paragraphs.js'
import { words, bounds } from '../Words.js'

/**
 * @param {string} text
 * @param {{ limit?: number }} [options]
 * @returns {{ index: number, length: number, text: string, context: string, message: string, count: number, limit: number }[]}  one match per long paragraph, text is the extra words past the limit
 */
export function maxWordsPerParagraph(text, { limit = 50 } = {}) {
	limit = +limit
	text = String(text ?? '')
	const out = []
	for (const p of paragraphs(text)) {
		const w = words(p.text)
		const n = w.length
		if (n > limit) {
			const start = bounds(w[limit]).index, extra = p.text.slice(start)
			out.push({ index: p.index + start, length: extra.length, text: extra, context: p.text, message: `Cut to ${limit} words. This paragraph has ${n}.`, count: n, limit })
		}
	}
	return out
}
