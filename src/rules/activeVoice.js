// Use the active voice. A be-verb, an optional -ly adverb, then a past participle is passive.
// Ported from vale-stuffbucket internal/rules/passive_voice.go, MIT, with its three lists in participles.js.
// The named-agent variant rides on top: a passive followed by "by" names an agent, which is the case the rule forbids.
// Limit: "is closed" the adjective reads as passive. The notParticiples and edAdjectives lists cover the common false hits.
import { words, key, strip, bounds } from '../Words.js'
import { sentenceAt } from '../Sentences.js'
import { beVerbs, irregular, notParticiples, edAdjectives, contractions } from '../data/participles.js'

const BE = new Set(beVerbs)
// punctuation on the end of a word: "was." or "by," is not bare, so it cannot join the next word
const BARE = /[^\p{L}\p{N}]$/u
// the be-verb of a word, or undefined: is, was, or the one inside a contraction such as it's or isn't
const beVerb = k => BE.has(k) ? k : contractions[k.replace(/’/g, "'")]
const IRREGULAR = new Set(irregular)
const NOT = new Set([...notParticiples, ...edAdjectives])
// the words that open an agent after "by": articles and pronouns. A capital word counts too, checked in place
const AGENT = new Set(['a', 'an', 'the', 'me', 'us', 'you', 'him', 'her', 'them', 'it', 'my', 'our', 'your', 'his', 'their', 'its', 'this', 'that', 'these', 'those', 'some', 'one', 'someone', 'everyone', 'anyone', 'nobody'])

const isParticiple = w => (w.endsWith('ed') && !NOT.has(w)) || IRREGULAR.has(w)

/** every passive construction: { index, length, text, context, be, participle, agent } where agent is true when "by" follows */
export function passives(text) {
	const out = []
	const list = words(text)
	for (let i = 0; i < list.length - 1; i++) {
		// a be-verb with punctuation on it, "It was. Deleted", ends the pattern. So does an adverb with one
		if (!beVerb(key(list[i].text)) || BARE.test(list[i].text)) continue
		let j = i + 1
		if (key(list[j].text).endsWith('ly') && list[j + 1]) { if (BARE.test(list[j].text)) continue; j++ }
		const w = key(list[j].text)
		if (!isParticiple(w)) continue
		const index = bounds(list[i]).index, end = bounds(list[j]).end
		const next = list[j + 1], after = list[j + 2]
		// "by" names the agent only inside the same sentence, "was fixed by us", not "was fixed. By then",
		// and only when a name, an article, or a pronoun follows: "by Ann", "by the team", "by us".
		// "by noon", "by hand", "by 10%" name a time or a means. Known miss: "by Monday" reads as a name.
		const agent = next !== undefined && key(next.text) === 'by' && !BARE.test(next.text) && !BARE.test(list[j].text)
			&& after !== undefined && (/^\p{Lu}/u.test(strip(after.text)) || AGENT.has(key(after.text)))
		out.push({ index, length: end - index, text: text.slice(index, end), context: sentenceAt(text, index), be: strip(list[i].text), participle: strip(list[j].text), agent })
		i = j
	}
	return out
}

/**
 * Every passive is a match.
 * @param {string} text
 * @returns {{ index: number, length: number, text: string, context: string, be: string, participle: string, agent: boolean, message: string }[]}
 */
export function activeVoice(text) {
	text = String(text ?? '')
	return passives(text).map(m => ({ ...m, message: `Use the active voice. Name who does the action, not "${m.text}".` }))
}

/**
 * A passive is allowed only when no agent is named. "was fixed by the team" is the match.
 * @param {string} text
 * @returns {{ index: number, length: number, text: string, context: string, be: string, participle: string, message: string }[]}
 */
export function passiveWithNamedAgent(text) {
	text = String(text ?? '')
	return passives(text).filter(m => m.agent).map(({ agent, ...m }) => ({ ...m, message: `The agent is named, so use the active voice: not "${m.text} by".` }))
}
