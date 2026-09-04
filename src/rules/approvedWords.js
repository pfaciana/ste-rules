// Opt-in: every word must be in the caller's approved list, or be a technical name the caller allows.
// The core STE check. The library ships no word list: the ASD-STE100 dictionary is ASD's document. The caller
// brings its own list in `approved`. With no list the rule is off and returns nothing. Numbers and single letters pass.
import { words, key, bounds } from '../Words.js'
import { sentenceAt } from '../Sentences.js'

/**
 * @param {string} text
 * @param {{ approved?: Iterable<string>, technicalNames?: string[] }} [options]  the approved words, and the words the project allows. Both case folded
 * @returns {{ index: number, length: number, text: string, context: string, message: string }[]}
 */
export function approvedWords(text, { approved, technicalNames = [] } = {}) {
	text = String(text ?? '')
	if (!approved) return []
	const allowed = new Set([...approved, ...technicalNames].map(key))
	const out = []
	for (const w of words(text)) {
		const k = key(w.text)
		if (!k || allowed.has(k) || /^\d/.test(k) || k.length === 1) continue
		const b = bounds(w), span = text.slice(b.index, b.end)
		out.push({ index: b.index, length: b.end - b.index, text: span, context: sentenceAt(text, b.index), message: `"${span}" is not an approved word. Use a dictionary word, or add it as a technical name.` })
	}
	return out
}
