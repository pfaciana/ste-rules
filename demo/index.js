// A consumer of ste-rules: four rules over a plain text file, every match as `index rule: message`.
// Usage: node index.js notes.txt
import { readFileSync } from 'node:fs'
import { noSemicolons, maxWordsPerSentence, noPhrasalVerbs, activeVoice } from '#ste-rules'

const rules = { noSemicolons, maxWordsPerSentence, noPhrasalVerbs, activeVoice }

/** every match of the four rules, as `{ index, rule, message }`, sorted by index */
export function check(text) {
	const out = []
	for (const [rule, fn] of Object.entries(rules)) for (const m of fn(text)) out.push({ index: m.index, rule, message: m.message })
	return out.sort((a, b) => a.index - b.index)
}

if (process.argv[2]) console.log(check(readFileSync(process.argv[2], 'utf8')).map(m => `${m.index} ${m.rule}: ${m.message}`).join('\n'))
