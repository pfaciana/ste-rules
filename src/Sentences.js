// Sentence splitter for plain text. Ported from agent-simple-english src/engine/sentences.ts (MIT),
// with its markdown parts left out: links, emphasis, headings. What stays is the plain-text core:
// - a sentence ends at . ! ? followed by closing quotes or brackets, then whitespace or the end
// - a blank line ends a sentence
// - a period inside e.g., i.e., etc., vs., Fig., No. is not an end, unless a capital word follows
// - a period after a title, Dr., Mr., Mrs., Ms., Prof., Sr., Jr., St., is not an end. A name follows it
// - a period after a single capital letter is an end: "Choose option B.", "Press Q.". An initial, "J. Smith", splits
// - a period between digits is a decimal
import { paragraphs } from './Paragraphs.js'

const CLOSERS = new Set(['"', "'", '’', '”', '»', '›', ')', ']', '}'])
const TITLES = ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'Prof.', 'Sr.', 'Jr.', 'St.']
const ABBREVIATIONS = ['e.g.', 'i.e.', 'etc.', 'vs.', 'Fig.', 'No.', ...TITLES]
const DESIGNATORS = new Set(['Fig.', 'No.'])
const TITLE = new Set(TITLES)

/** true when the period at `i` sits inside a listed abbreviation or an initial, so it does not end a sentence */
function periodIsInternal(text, i, end) {
	// what follows: skip closers and whitespace to the next content word
	let j = i + 1
	while (j < end && (CLOSERS.has(text[j]) || /\s/.test(text[j]))) j++
	const next = j < end ? text.slice(j).match(/^[\p{L}\p{N}][\p{L}\p{N}-]*/u)?.[0] ?? text[j] : undefined
	// decimal: digit . digit
	if (/\d/.test(text[i - 1] ?? '') && /\d/.test(text[i + 1] ?? '')) return true
	// a list marker: digits, then the period, at a line start. "1. Run it." is one sentence
	if (/\d/.test(text[i - 1] ?? '') && /(?:^|\n)[ \t]*\d+$/.test(text.slice(Math.max(0, i - 12), i))) return true
	// a dotted run: a letter on both sides, U.S.A., a.m., Node.js. Its last period ends a sentence only when a
	// capital word follows: "the U.S.A. at noon" holds, "the U.S.A. Then" splits
	if (/\p{L}/u.test(text[i - 1] ?? '') && /\p{L}/u.test(text[i + 1] ?? '')) return true
	if (text[i - 2] === '.' && /\p{L}/u.test(text[i - 1] ?? '') && next !== undefined && !/[A-Z]/.test(next[0])) return true
	for (const abbr of ABBREVIATIONS) {
		const start = i - abbr.length + 1
		if (start < 0 || text.slice(start, i + 1) !== abbr) continue
		if (/[\p{L}\p{N}_.]/u.test(text[start - 1] ?? '')) continue          // part of a longer word
		if (next === undefined) return j >= end && end >= text.length         // abbreviation at the very end
		if (TITLE.has(abbr)) return true                                       // a title, then a name: Dr. Smith
		if (!/[A-Z]/.test(next[0])) return true                                // lower case follows: internal
		if (DESIGNATORS.has(abbr)) return /^[A-Z0-9](?:[A-Z0-9-]{0,2})$/.test(next)   // Fig. A, No. 7
		return false
	}
	// a single capital letter before the period ends the sentence: "Choose option B.", "Press Q.", "Set it to N."
	// Those are common in technical text. An initial in a name, "J. Smith", is rare, and it splits: the
	// fragment "J." is one word with no verb, so no rule reads it wrong.
	return false
}

/**
 * Split text into sentences. Each has the trimmed text and its index and length in the input.
 * A sentence never crosses a blank line. Line breaks inside a sentence stay in its text.
 * @param {string} text
 * @returns {{ text: string, index: number, length: number }[]}
 */
export function sentences(text) {
	text = String(text ?? '')
	const out = []
	for (const p of paragraphs(text)) {
		const end = p.index + p.length
		let start = p.index
		for (let i = p.index; i < end; i++) {
			const ch = text[i]
			if (ch !== '.' && ch !== '!' && ch !== '?') continue
			let j = i + 1
			while (j < end && (text[j] === '.' || text[j] === '!' || text[j] === '?')) j++
			if (j === i + 1 && ch === '.' && periodIsInternal(text, i, end)) continue
			while (j < end && CLOSERS.has(text[j])) j++
			if (j < end && !/\s/.test(text[j])) { i = j - 1; continue }    // "3.5x" or "a.b": not an end
			push(out, text, start, j)
			start = j
			i = j - 1
		}
		push(out, text, start, end)
	}
	return out
}

function push(out, text, start, end) {
	const slice = text.slice(start, end)
	const lead = slice.length - slice.trimStart().length
	const trimmed = slice.trim()
	if (trimmed) out.push({ text: trimmed, index: start + lead, length: trimmed.length })
}

/**
 * The sentence that holds an offset, for the `context` of a match. The whole text when no sentence holds it.
 * @param {string} text
 * @param {number} index
 * @returns {string}
 */
export function sentenceAt(text, index) {
	text = String(text ?? '')
	return sentences(text).find(s => index >= s.index && index < s.index + s.length)?.text ?? text
}
