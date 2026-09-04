// Give pronouns clear referents. Prefer "this rule" over a bare "this".
// A sentence that starts with it, this, these, those, or they, directly followed by a verb, is bare.
// Pronoun set from asd-ste100-checker ste100/rules/semantic.py, Apache-2.0. The verb list is ours.
// Limit: a bare pronoun in the middle of a sentence is not caught.
import { sentences } from '../Sentences.js'
import { words, key, strip, bounds } from '../Words.js'
import { pronouns, bareVerbs } from '../data/pronouns.js'

const PRONOUNS = new Set(pronouns)
const VERBS = new Set(bareVerbs)

/**
 * @param {string} text
 * @returns {{ index: number, length: number, text: string, context: string, message: string, pronoun: string, verb: string }[]}
 */
export function clearPronouns(text) {
	text = String(text ?? '')
	const out = []
	for (const s of sentences(text)) {
		const [first, second] = words(s.text)
		if (!first || !second || !PRONOUNS.has(key(first.text)) || !VERBS.has(key(second.text))) continue
		const index = s.index + bounds(first).index, end = s.index + bounds(second).end
		const pronoun = strip(first.text), verb = strip(second.text)
		out.push({ index, length: end - index, text: text.slice(index, end), context: s.text, message: `Say what "${pronoun}" refers to: "${pronoun} <noun> ${verb}".`, pronoun, verb })
	}
	return out
}
