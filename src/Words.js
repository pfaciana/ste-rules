// Words of plain text. A word is a run of non-whitespace characters, whole: "run," is a word, and so are
// snake_case, C++, 1,000, $5.00, https://x.com/a. Nothing is cut. `index` points at the run in the input.
// A run with no letter and no digit, "-", "...", "**", is not a word.
// A lookup does not compare the word itself. It compares its key: the run with punctuation trimmed from both
// ends, case folded. key('Stop.') is 'stop'. The rules and Phrases.js call key() at the compare, never before.

const RUN = /\S+/gu
const EDGE = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu

/**
 * @param {string} text
 * @returns {{ text: string, index: number }[]}
 */
export function words(text) {
	text = String(text ?? '')
	return Array.from(text.matchAll(RUN), m => ({ text: m[0], index: m.index })).filter(w => /[\p{L}\p{N}]/u.test(w.text))
}

/** @param {string} text */
export function wordCount(text) {
	text = String(text ?? '')
	return words(text).length
}

/** the word with punctuation trimmed from both ends, case kept: strip('(GC),') is 'GC' */
export function strip(text) {
	return text.replace(EDGE, '')
}

/** the lookup form of a word: trimmed at both ends, case folded. key('Stop.') is 'stop' */
export function key(text) {
	return strip(text).toLowerCase()
}

/**
 * The span of the word a match points at: the run without the punctuation at its ends. `index` and `end` are
 * absolute in the same text the word came from. bounds({ text: '(GC),', index: 4 }) is { index: 5, end: 7 }
 * @param {{ text: string, index: number }} w
 * @returns {{ index: number, end: number }}
 */
export function bounds(w) {
	const lead = /^[^\p{L}\p{N}]*/u.exec(w.text)[0].length
	const trail = /[^\p{L}\p{N}]*$/u.exec(w.text)[0].length
	return lead + trail >= w.text.length ? { index: w.index, end: w.index + w.text.length } : { index: w.index + lead, end: w.index + w.text.length - trail }
}
