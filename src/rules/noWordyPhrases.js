// No wordy phrases. Use the shorter form: "to", not "in order to".
import { phrases, without } from '../Phrases.js'
import { sentenceAt } from '../Sentences.js'
import { wordyPhrases } from '../data/wordyPhrases.js'

/**
 * @param {string} text
 * @param {{ allow?: string[] }} [options]  entries to pass, e.g. a project's own terms
 * @returns {{ index: number, length: number, text: string, context: string, message: string, alternative: string }[]}
 */
export function noWordyPhrases(text, { allow = [] } = {}) {
	text = String(text ?? '')
	return phrases(text, without(Object.keys(wordyPhrases), allow)).map(m => {
		const alternative = wordyPhrases[m.entry]
		return {
			index: m.index,
			length: m.length,
			text: m.text,
			context: sentenceAt(text, m.index),
			message: `Use fewer words. Replace "${m.text}" with "${alternative}".`,
			alternative,
		}
	})
}