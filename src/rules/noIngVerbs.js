// Do not use -ing words as verbs. A be-verb followed by an -ing word is the progressive form.
// Check from stazelabs-ste internal/lint/rules_syntax.go, MIT. The allow list of -ing nouns is from
// vale-stuffbucket internal/rules/ing_forms.go, MIT.
// Limit: an -ing verb with no be-verb before it, "Running the tests shows", is not caught. That needs a tagger.
import { words, key, strip, bounds } from '../Words.js'
import { sentenceAt } from '../Sentences.js'
import { beVerbs, contractions } from '../data/participles.js'
import { ingNouns } from '../data/ingNouns.js'

const BE = new Set(beVerbs)
// the be-verb of a word, or undefined: is, was, or the one inside a contraction such as it's or isn't
const beVerb = k => BE.has(k) ? k : contractions[k.replace(/’/g, "'")]
const NOUNS = new Set(ingNouns)

/**
 * @param {string} text
 * @returns {{ index: number, length: number, text: string, context: string, message: string, be: string, verb: string }[]}
 */
export function noIngVerbs(text) {
	text = String(text ?? '')
	const out = []
	const list = words(text)
	for (let i = 1; i < list.length; i++) {
		const w = key(list[i].text), prev = key(list[i - 1].text)
		if (!w.endsWith('ing') || w.length < 5 || NOUNS.has(w) || !beVerb(prev)) continue
		const index = bounds(list[i - 1]).index, end = bounds(list[i]).end
		// the pair is progressive only inside one sentence: "is reading", not "what it is. Reading helps"
		if (/[^\p{L}\p{N}]$/u.test(list[i - 1].text)) continue
		const be = strip(list[i - 1].text), verb = strip(list[i].text), found = text.slice(index, end)
		out.push({ index, length: end - index, text: found, context: sentenceAt(text, index), message: `Use the simple form, not "${found}".`, be, verb })
	}
	return out
}
