// No wordy phrases. Use the shorter form: "to", not "in order to".
import { phrases } from '../Phrases.js'
import { sentenceAt } from '../Sentences.js'
import { wordyPhrases } from '../data/wordyPhrases.js'

/**
 * @param {string} text
 * @returns {{ index: number, length: number, text: string, context: string, message: string, alternative: string }[]}
 */
export function noWordyPhrases(text) {
	text = String(text ?? '')
	return phrases(text, Object.keys(wordyPhrases)).map(m => {
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