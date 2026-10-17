// Find entries of a word or phrase list in text. Ported from agent-simple-english
// src/engine/phrase-matcher.ts (MIT): case-folded whole words, a phrase is its words in order with only
// whitespace between them. The longest entry wins at one position, and matches never overlap.
import { words, key, bounds } from './Words.js'

/**
 * The entries not in `allow`, compared as keys: without(list, ['Spin Up']) drops 'spin up'. A rule's `allow` option.
 * @param {Iterable<string>} entries
 * @param {Iterable<string>} [allow]
 * @returns {Iterable<string>}
 */
export function without(entries, allow) {
	const skip = new Set(Array.from(allow ?? [], e => key(String(e))))
	return skip.size ? Array.from(entries).filter(e => !skip.has(key(e))) : entries
}

/**
 * @param {string} text
 * @param {Iterable<string>} entries   words or phrases, e.g. ['utilise', 'in order to']
 * @returns {{ index: number, length: number, text: string, entry: string }[]}
 */
export function phrases(text, entries) {
	text = String(text ?? '')
	const byFirst = new Map()
	for (const entry of entries) {
		const parts = entry.split(/\s+/).map(key).filter(Boolean)
		if (!parts.length) continue
		const list = byFirst.get(parts[0]) ?? byFirst.set(parts[0], []).get(parts[0])
		list.push({ entry, parts })
	}
	for (const list of byFirst.values()) list.sort((a, b) => b.parts.length - a.parts.length)

	const tokens = words(text)
	const out = []
	for (let i = 0; i < tokens.length; i++) {
		const candidates = byFirst.get(key(tokens[i].text))
		if (!candidates) continue
		const hit = candidates.find(c => c.parts.every((part, k) => {
			const t = tokens[i + k]
			if (!t || key(t.text) !== part) return false
			// only whitespace between the words of a phrase: a comma on the word before, "other, words", breaks it,
			// and so does a dash between them, "shut — down"
			if (k === 0) return true
			const prev = tokens[i + k - 1]
			return !/[^\p{L}\p{N}]$/u.test(prev.text) && /^\s*$/.test(text.slice(prev.index + prev.text.length, t.index))
		}))
		if (!hit) continue
		const last = tokens[i + hit.parts.length - 1]
		const index = bounds(tokens[i]).index, end = bounds(last).end
		out.push({ index, length: end - index, text: text.slice(index, end), entry: hit.entry })
		i += hit.parts.length - 1
	}
	return out
}
