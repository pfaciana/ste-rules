// Flags the perfect tense: "have fixed", "has run", "had written".
// Write the simple past instead: "fixed", "ran", "wrote".
//
// "have" can also mean "own". The rule must not flag that.
// So it flags the pair only when the next word shows a verb:
//   We have fixed the bug.    flagged, "the" follows
//   We have limited time.     passes, a noun follows
//
// The known misses and the known false hits are in noPerfectTense.test.js.
// The idea is from agent-ste src/ste/checks.gleam, MIT.
import { words, key, strip, bounds } from '../Words.js'
import { sentenceAt } from '../Sentences.js'
import { irregular, notParticiples } from '../data/participles.js'

// past verbs with no -ed: "written", "run", "made"
const IRREGULAR_VERBS = new Set(irregular)
// words that end in -ed but are not verbs: "need", "speed", "hundred"
const NOT_VERBS = new Set(notParticiples)

// have, has, had, and the short forms. "it's" and "I'd" stay out: they can also mean "it is" and "I would"
const HAVE = new Set(['have', 'has', 'had', "i've", "we've", "you've", "they've", "haven't", "hasn't", "hadn't"])
// words that can sit between have and the verb: "have not fixed", "has already run"
const IN_BETWEEN = new Set(['not', 'never', 'already', 'just'])
// words that show a verb when they come next: "fixed the bug", "received it", "moved to /tmp"
const VERB_SIGNALS = new Set(['a', 'an', 'the', 'this', 'that', 'these', 'those', 'it', 'them', 'him', 'her', 'us', 'me',
	'you', 'my', 'our', 'your', 'his', 'their', 'its', 'to', 'in', 'on', 'at', 'for', 'from', 'with', 'into'])
// words that describe a range before "to", not an action: "limited to no", "mixed to positive"
const RANGE_WORDS = new Set(['limited', 'mixed'])

const isHave = word => HAVE.has(key(word.text).replace(/’/g, "'"))
const isVerb = word => {
	const k = key(word.text)
	return (k.endsWith('ed') && !NOT_VERBS.has(k)) || IRREGULAR_VERBS.has(k)
}
const startsWithCapital = word => /^\p{Lu}/u.test(strip(word.text))
const endsWithPunctuation = word => /[^\p{L}\p{N}]$/u.test(word.text)
const endsSentence = word => /[.!?][^\p{L}\p{N}]*$/u.test(word.text)

/**
 * @param {string} text
 * @returns {{ index: number, length: number, text: string, context: string, message: string, auxiliary: string, participle: string }[]}
 */
export function noPerfectTense(text) {
	text = String(text ?? '')
	const all = words(text)
	const found = []

	for (let i = 0; i < all.length - 1; i++) {
		const have = all[i]
		if (!isHave(have) || endsWithPunctuation(have)) continue

		// step over one word in between: "have not fixed"
		let verbAt = i + 1
		if (IN_BETWEEN.has(key(all[verbAt].text)) && !endsWithPunctuation(all[verbAt]) && all[verbAt + 1]) verbAt++
		const verb = all[verbAt]
		const after = all[verbAt + 1]

		if (!isVerb(verb)) continue
		// a name, not a verb: "have Ted to thank"
		if (startsWithCapital(verb) && !startsWithCapital(have)) continue
		// a range, not a verb: "have limited to no visibility"
		if (after && key(after.text) === 'to' && RANGE_WORDS.has(key(verb.text))) continue
		// a comma or a bracket after the verb breaks the pair: "We have finished, so we can go."
		if (endsWithPunctuation(verb) && !endsSentence(verb)) continue
		// a noun after the verb: "We have limited time."
		if (!endsSentence(verb) && after && !VERB_SIGNALS.has(key(after.text))) continue

		const start = bounds(have).index
		const end = bounds(verb).end
		const pair = text.slice(start, end)
		found.push({
			index: start,
			length: end - start,
			text: pair,
			context: sentenceAt(text, start),
			message: `Use the simple past, not the perfect "${pair}".`,
			auxiliary: strip(have.text),
			participle: strip(verb.text),
		})
		i = verbAt
	}
	return found
}