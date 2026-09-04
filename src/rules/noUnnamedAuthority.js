// No unnamed authority. Name the source or cut the claim.
import { phrases } from '../Phrases.js'
import { authority } from '../data/authority.js'
import { sentenceAt } from '../Sentences.js'

/**
 * @param {string} text
 * @returns {{ index: number, length: number, text: string, context: string, message: string, phrase: string }[]}
 */
export function noUnnamedAuthority(text) {
	text = String(text ?? '')
	return phrases(text, authority).map(m => ({
		index: m.index, length: m.length, text: m.text, context: sentenceAt(text, m.index), phrase: m.text,
		message: `Name the source, or cut the claim. "${m.text}" names no one.`,
	}))
}
