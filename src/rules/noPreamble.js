// Write only the requested text. No preamble, no summary, no closing remarks.
// The first paragraph is checked against openers, the last against closers. Lists are ours; no reference
// repo checks this. A one-paragraph text is checked against the openers only: a closer needs text before it.
import { paragraphs } from '../Paragraphs.js'
import { openers, closers } from '../data/preamble.js'

// the phrase must end on a word boundary, so "Surely" is not "sure" and "Overallocation" is not "overall"
const startsWith = (text, list) => {
	const lower = text.toLowerCase()
	return list.find(p => lower.startsWith(p) && !/[a-z]/i.test(lower.charAt(p.length)))
}

/**
 * @param {string} text
 * @returns {{ index: number, length: number, text: string, context: string, message: string, phrase: string, place: 'start'|'end' }[]}
 */
export function noPreamble(text) {
	text = String(text ?? '')
	const all = paragraphs(text)
	if (!all.length) return []
	const out = []
	const first = all[0], last = all[all.length - 1]
	const opener = startsWith(first.text, openers)
	if (opener) {
		const phrase = first.text.slice(0, opener.length)
		out.push({ index: first.index, length: first.length, text: first.text, context: text, message: `Cut the preamble. Start with the answer, not "${phrase}".`, phrase, place: 'start' })
	}
	// a closer closes something, so a one-paragraph text has no closer to check
	const closer = all.length > 1 && startsWith(last.text, closers)
	if (closer) {
		const phrase = last.text.slice(0, closer.length)
		out.push({ index: last.index, length: last.length, text: last.text, context: text, message: `Cut the closing remark. Stop when the content stops, not "${phrase}".`, phrase, place: 'end' })
	}
	return out
}
