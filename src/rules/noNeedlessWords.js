// Cut every word that adds nothing. Slop words, restatement markers, marketing words, fillers.
import { phrases } from '../Phrases.js'
import { sentenceAt } from '../Sentences.js'
import { slop, restatements, marketing, fillers } from '../data/needlessWords.js'

const kinds = new Map([
	...slop.map(e => [e, 'slop']),
	...restatements.map(e => [e, 'restatement']),
	...marketing.map(e => [e, 'marketing']),
	...fillers.map(e => [e, 'filler']),
])
const entries = [...kinds.keys()]

/**
 * @param {string} text
 * @returns {{ index: number, length: number, text: string, context: string, message: string, phrase: string, kind: 'slop'|'restatement'|'marketing'|'filler' }[]}
 */
export function noNeedlessWords(text) {
	text = String(text ?? '')
	return phrases(text, entries).map(m => {
		const found = m.text
		return {
			index: m.index, length: m.length, text: found, context: sentenceAt(text, m.index),
			message: `Cut "${found}". It adds nothing.`,
			phrase: m.entry, kind: kinds.get(m.entry),
		}
	})
}
