// No ambiguous abbreviations. Common ones such as HTML, URL, API are allowed.
// A run of 2 to 5 capitals, with digits allowed after the first, is an abbreviation. It passes when it
// sits in the allowed list. It fails otherwise, with the full term when the ambiguous list knows it.
// A shouted sentence, every word upper case, is skipped: "RUN THE TESTS NOW" holds no abbreviation.
import { words, strip, bounds } from '../Words.js'
import { sentences } from '../Sentences.js'
import { ambiguous, allowed } from '../data/abbreviations.js'

const ABBREVIATION = /^[A-Z][A-Z0-9]{1,4}$/
const ALLOWED = new Set(allowed)

// ponytail: a one-word sentence is never a shout, so "GC." alone still gets checked
const shouted = ws => ws.length > 1 && ws.every(w => w.text === w.text.toUpperCase())

/**
 * @param {string} text
 * @param {{ allow?: string[] }} [options]  extra allowed abbreviations, e.g. a project's own names
 * @returns {{ index: number, length: number, text: string, context: string, message: string, full: string|null }[]}
 */
export function noAmbiguousAbbreviations(text, { allow = [] } = {}) {
	text = String(text ?? '')
	const extra = new Set(allow)
	const out = []
	for (const s of sentences(text)) {
		const ws = words(s.text)
		if (shouted(ws)) continue
		for (const w of ws) {
			const t = strip(w.text)
			if (!ABBREVIATION.test(t) || ALLOWED.has(t) || extra.has(t)) continue
			const full = ambiguous[t] ?? null, b = bounds(w)
			out.push({
				index: s.index + b.index, length: b.end - b.index, text: t, context: s.text, full,
				message: full ? `Write the full term: "${full}", not "${t}".` : `Write the full term, not "${t}".`,
			})
		}
	}
	return out
}
