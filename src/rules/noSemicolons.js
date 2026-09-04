// No semicolons. Write two sentences instead.

import { sentenceAt } from '../Sentences.js'

/**
 * @param {string} text
 * @returns {{ index: number, length: number, text: string, context: string, message: string }[]}  one match per semicolon
 */
export function noSemicolons(text) {
	text = String(text ?? '')
	const out = []
	for (let i = text.indexOf(';'); i >= 0; i = text.indexOf(';', i + 1)) {
		out.push({ index: i, length: 1, text: ';', context: sentenceAt(text, i), message: 'Cut the semicolon. Write two sentences.' })
	}
	return out
}
