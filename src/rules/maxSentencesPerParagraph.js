// Maximum 6 sentences per paragraph. The ASD-STE100 cap for a paragraph.
import { paragraphs } from '../Paragraphs.js'
import { sentences } from '../Sentences.js'

/**
 * @param {string} text
 * @param {{ limit?: number }} [options]
 * @returns {{ index: number, length: number, text: string, context: string, message: string, count: number, limit: number }[]}  one match per long paragraph, text is the sentences past the limit
 */
export function maxSentencesPerParagraph(text, { limit = 6 } = {}) {
	limit = +limit
	text = String(text ?? '')
	const out = []
	for (const p of paragraphs(text)) {
		const s = sentences(p.text)
		const n = s.length
		if (n > limit) {
			const start = s[limit].index, extra = p.text.slice(start)
			out.push({ index: p.index + start, length: extra.length, text: extra, context: p.text, message: `Cut to ${limit} sentences. This paragraph has ${n}.`, count: n, limit })
		}
	}
	return out
}