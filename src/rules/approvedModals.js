// Only the modal verbs can, will, and must. From the rule text.
// A capital May is the month when it sits mid-sentence, "on May 5", or when a number follows it at the
// sentence start, "May 5 is the date". Any other May or may is the modal.
import { phrases } from '../Phrases.js'
import { sentences } from '../Sentences.js'
import { modals } from '../data/modals.js'

const month = (text, m, s) => {
	if (m.text !== 'May') return false
	if (/[\p{L}\p{N}]/u.test(text.slice(s.index, m.index))) return true   // a word before it in the sentence
	return /^\s*\d/.test(text.slice(m.index + m.length))                    // at the start, a date
}

/**
 * @param {string} text
 * @returns {{ index: number, length: number, text: string, context: string, message: string, modal: string, alternatives: string[] }[]}  one match per other modal
 */
export function approvedModals(text) {
	text = String(text ?? '')
	const all = sentences(text)
	const out = []
	for (const m of phrases(text, Object.keys(modals))) {
		const s = all.find(x => m.index >= x.index && m.index < x.index + x.length) ?? { index: 0, text }
		if (month(text, m, s)) continue
		const modal = m.entry.toLowerCase()
		const alternatives = [modals[m.entry]]
		out.push({
			index: m.index, length: m.length, text: m.text, context: s.text,
			message: `Use only can, will, or must. Replace "${m.text}" with "${alternatives[0]}".`,
			modal, alternatives,
		})
	}
	return out
}
