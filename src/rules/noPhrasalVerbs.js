// No phrasal verbs. Use a single plain verb instead.
import { phrases, without } from '../Phrases.js'
import { sentenceAt } from '../Sentences.js'
import { phrasalVerbs } from '../data/phrasalVerbs.js'

/**
 * @param {string} text
 * @param {{ allow?: string[] }} [options]  entries to pass, e.g. a project's own terms: ['spin up']
 * @returns {{ index: number, length: number, text: string, context: string, message: string, alternatives: string[] }[]}
 */
export function noPhrasalVerbs(text, { allow = [] } = {}) {
	text = String(text ?? '')
	return phrases(text, without(Object.keys(phrasalVerbs), allow)).map(m => {
		const alternatives = phrasalVerbs[m.entry]
		return {
			index: m.index, length: m.length, text: m.text, context: sentenceAt(text, m.index),
			message: `Use one plain verb. Replace "${m.text}" with "${alternatives.join('" or "')}".`,
			alternatives,
		}
	})
}
