// Maximum 20 words per sentence.
import { sentences } from '../Sentences.js'
import { words, bounds } from '../Words.js'

/**
 * @param {string} text
 * @param {{ limit?: number }} [options]
 * @returns {{ index: number, length: number, text: string, context: string, message: string, count: number, limit: number }[]}  one match per long sentence, text is the words past the limit
 */
export function maxWordsPerSentence(text, { limit = 20 } = {}) {
	limit = +limit
	text = String(text ?? '')
	const out = []
	for (const s of sentences(text)) {
		const w = words(s.text)
		const n = w.length
		if (n > limit) {
			const start = bounds(w[limit]).index, extra = s.text.slice(start)
			out.push({ index: s.index + start, length: extra.length, text: extra, context: s.text, message: `Cut to ${limit} words. This sentence has ${n}.`, count: n, limit })
		}
	}
	return out
}
