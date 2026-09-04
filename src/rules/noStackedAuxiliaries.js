// No stacked auxiliaries. "will have been", "has been being". From the rule text; two or more
// auxiliaries in a row is the match. One exception: an approved modal, then "be", is the simple future or an
// approved modal with the infinitive. "will be", "can be", "must be" pass. "should be" and "has been" do not.
import { words, key, strip, bounds } from '../Words.js'
import { sentenceAt } from '../Sentences.js'

const AUX = new Set(['have', 'has', 'had', 'been', 'being', 'be', 'will', 'would', 'shall', 'should', 'may', 'might', 'could', 'can', 'must', 'do', 'does', 'did'])
const APPROVED = new Set(['will be', 'can be', 'must be'])

/**
 * @param {string} text
 * @returns {{ index: number, length: number, text: string, context: string, message: string, auxiliaries: string[] }[]}
 */
export function noStackedAuxiliaries(text) {
	text = String(text ?? '')
	const out = []
	const list = words(text)
	for (let i = 0; i < list.length; i++) {
		if (!AUX.has(key(list[i].text)) || /[^\p{L}\p{N}]$/u.test(list[i].text)) continue
		let j = i
		// a stack is a run of bare auxiliaries: a comma on the word, "may, might", or a dash between, "has — been", breaks it
		while (j + 1 < list.length && AUX.has(key(list[j + 1].text)) && !/[^\p{L}\p{N}]$/u.test(list[j].text) && /^\s*$/.test(text.slice(list[j].index + list[j].text.length, list[j + 1].index))) j++
		if (j > i) {
			const index = bounds(list[i]).index, end = bounds(list[j]).end
			const auxiliaries = list.slice(i, j + 1).map(w => strip(w.text))
			if (APPROVED.has(auxiliaries.map(key).join(' '))) { i = j; continue }
			out.push({ index, length: end - index, text: text.slice(index, end), context: sentenceAt(text, index), message: `Use one auxiliary, not "${auxiliaries.join(' ')}".`, auxiliaries })
		}
		i = j
	}
	return out
}
