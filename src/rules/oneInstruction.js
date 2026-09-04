// Maximum one instruction per sentence. "and then" or ", then" joins two instructions.
// From vale-stuffbucket internal/rules/one_instruction.go, MIT, widened from list items to every sentence.
// The semicolon case is noSemicolons.
// A sentence that opens with a condition word, "If the test fails, then rerun it", is the condition shape the
// rules ask for: condition, comma, command. Its ", then" is not a joiner. "and then" in such a sentence still is.
import { sentences } from '../Sentences.js'

const JOIN = /\band then\b|,\s*then\b/gi
const CONDITION = /^\W*(?:if|when|unless|once|after|before|while)\b/i

/**
 * @param {string} text
 * @returns {{ index: number, length: number, text: string, context: string, message: string, joiner: string }[]}  one match per joined sentence, text is the joiner span
 */
export function oneInstruction(text) {
	text = String(text ?? '')
	const out = []
	for (const s of sentences(text)) {
		const m = JOIN.exec(s.text)
		JOIN.lastIndex = 0
		if (!m) continue
		if (m[0].startsWith(',') && CONDITION.test(s.text)) continue
		const joiner = m[0].trim()
		out.push({ index: s.index + m.index, length: m[0].length, text: m[0], context: s.text, joiner, message: `Write one instruction per sentence. Split at "${joiner}".` })
	}
	return out
}
