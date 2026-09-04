// Maximum 10 words in the last paragraph. A response-only rule.
// Intended use: a response ends with the next step, in one short line. This rule checks the length of that line.
// It cannot check the meaning: whether the line names a next step is a judgment, not a count. Pair it with a
// prompt rule, or a person, for the meaning part.
// The caller passes only the text to judge, with any trailing section already removed. This library knows no markdown.
import { paragraphs } from '../Paragraphs.js'
import { wordCount } from '../Words.js'

/**
 * @param {string} text
 * @param {{ limit?: number }} [options]
 * @returns {{ index: number, length: number, text: string, context: string, message: string, count: number, limit: number }[]}  at most one match
 */
export function maxWordsLastParagraph(text, { limit = 10 } = {}) {
	limit = +limit
	text = String(text ?? '')
	const all = paragraphs(text)
	if (!all.length) return []
	const last = all[all.length - 1]
	const n = wordCount(last.text)
	if (n <= limit) return []
	return [{ index: last.index, length: last.length, text: last.text, context: text, message: `Cut the last paragraph to ${limit} words. It has ${n}.`, count: n, limit }]
}
