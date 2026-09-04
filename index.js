// ste-rules: Simplified Technical English and plain-language rules for plain text. One function per rule. Text in, matches out.
// Every rule returns [{ index, length, text, context, message }], empty on pass. See docs/reference.md.

// counts
export { noSemicolons } from './src/rules/noSemicolons.js'
export { maxWordsPerSentence } from './src/rules/maxWordsPerSentence.js'
export { maxWordsPerParagraph } from './src/rules/maxWordsPerParagraph.js'
export { maxParagraphs } from './src/rules/maxParagraphs.js'
export { maxWordsLastParagraph } from './src/rules/maxWordsLastParagraph.js'

// word lists
export { approvedModals } from './src/rules/approvedModals.js'
export { noPhrasalVerbs } from './src/rules/noPhrasalVerbs.js'
export { noUnnamedAuthority } from './src/rules/noUnnamedAuthority.js'
export { noAmbiguousAbbreviations } from './src/rules/noAmbiguousAbbreviations.js'
export { noNeedlessWords } from './src/rules/noNeedlessWords.js'
export { oneHedge } from './src/rules/oneHedge.js'

// heuristics, with false hits
export { noIngVerbs } from './src/rules/noIngVerbs.js'
export { activeVoice, passiveWithNamedAgent } from './src/rules/activeVoice.js'
export { actionAsVerb } from './src/rules/actionAsVerb.js'
export { noStackedAuxiliaries } from './src/rules/noStackedAuxiliaries.js'
export { clearPronouns } from './src/rules/clearPronouns.js'
export { noPreamble } from './src/rules/noPreamble.js'
export { oneInstruction } from './src/rules/oneInstruction.js'

// opt-in
export { approvedWords } from './src/rules/approvedWords.js'

// the text helpers, for callers that build their own rules
export { sentences, sentenceAt } from './src/Sentences.js'
export { paragraphs } from './src/Paragraphs.js'
export { words, wordCount } from './src/Words.js'
export { phrases } from './src/Phrases.js'
