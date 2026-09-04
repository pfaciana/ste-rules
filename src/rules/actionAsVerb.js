// Describe an action with a verb, not a noun. "perform a validation" hides "validate".
// Ported from stazelabs-ste internal/lint/rules_syntax.go, MIT: a weak verb, then within two words a noun
// with a nominal ending that is not a concrete thing.
import { words, key, strip, bounds } from '../Words.js'
import { sentenceAt } from '../Sentences.js'
import { weakVerbs, suffixes, concrete } from '../data/actionNouns.js'

const WEAK = new Set(weakVerbs)
const CONCRETE = new Set(concrete)
const isActionNoun = w => suffixes.some(s => w.endsWith(s)) && !CONCRETE.has(w)

/**
 * @param {string} text
 * @returns {{ index: number, length: number, text: string, context: string, message: string, verb: string, noun: string }[]}
 */
export function actionAsVerb(text) {
	text = String(text ?? '')
	const out = []
	const list = words(text)
	for (let i = 0; i < list.length; i++) {
		if (!WEAK.has(key(list[i].text))) continue
		for (let j = i + 1; j <= i + 3 && j < list.length; j++) {
			const w = key(list[j].text)
			if (!isActionNoun(w)) continue
			const index = bounds(list[i]).index, end = bounds(list[j]).end
			const verb = strip(list[i].text), noun = strip(list[j].text), match = text.slice(index, end)
			out.push({ index, length: end - index, text: match, context: sentenceAt(text, index), message: `Use the verb behind "${noun}", not "${match}".`, verb, noun })
			i = j
			break
		}
	}
	return out
}
