// Plain words. Use the plain word: "use", not "utilize".
import { phrases } from '../Phrases.js'
import { sentenceAt } from '../Sentences.js'
import { formalWords } from '../data/formalWords.js'

// each formal word, with its plain word: utilize → use
const PLAIN = new Map(Object.entries(formalWords).flatMap(([plain, formal]) => formal.map(word => [word, plain])))

/**
 * @param {string} text
 * @returns {{ index: number, length: number, text: string, context: string, message: string, alternative: string }[]}
 */
export function plainWords(text) {
	text = String(text ?? '')
	return phrases(text, PLAIN.keys()).map(m => {
		const alternative = PLAIN.get(m.entry)
		return {
			index: m.index,
			length: m.length,
			text: m.text,
			context: sentenceAt(text, m.index),
			message: `Use a plain word. Replace "${m.text}" with "${alternative}".`,
			alternative,
		}
	})
}