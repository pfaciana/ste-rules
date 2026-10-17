import { test } from 'node:test'
import assert from 'node:assert/strict'
import { maxSentencesPerParagraph } from './maxSentencesPerParagraph.js'

const six = Array.from({ length: 6 }, (_, i) => `Sentence ${i + 1}.`).join(' ')
const seven = six + ' Sentence 7.'

// Every match, exactly: [index, text, count]. text starts at the first sentence past the limit.
const cases = [
	// name                                       text                                    options         matches
	['empty',                                     '',                                     {},             []],
	['only blank lines',                          '\n\n  \n',                             {},             []],
	['one sentence',                              'Run the tests.',                       {},             []],
	['exactly six sentences',                     six,                                    {},             []],
	['seven sentences',                           seven,                                  {},             [[72, 'Sentence 7.', 7]]],
	['lines in one paragraph count together',     six + '\nSentence 7.',                  {},             [[72, 'Sentence 7.', 7]]],
	['two paragraphs, only the long one',         seven + '\n\nShort one.',               {},             [[72, 'Sentence 7.', 7]]],
	['at the limit',                              'One. Two.',                            { limit: 2 },   []],
	['one past the limit',                        'One. Two. Three.',                     { limit: 2 },   [[10, 'Three.', 3]]],
	['two past: the match runs to the end',       'One. Two. Three. Four.',               { limit: 2 },   [[10, 'Three. Four.', 4]]],
	['the match starts at the very start',        'Run the tests.',                       { limit: 0 },   [[0, 'Run the tests.', 1]]],
	['two matches, exact places',                 'One. Two. Three.\n\nFour. Five. Six.', { limit: 2 },   [[10, 'Three.', 3], [30, 'Six.', 3]]],
	['the match spans a line break',              'One. Two.\nThree. Four.',              { limit: 2 },   [[10, 'Three. Four.', 4]]],
	['! and ? end a sentence',                    'Go! Stop? Now.',                       { limit: 2 },   [[10, 'Now.', 3]]],
	['an abbreviation does not end a sentence',   'Use e.g. this. Two. Three.',           { limit: 2 },   [[20, 'Three.', 3]]],
	['a decimal does not end a sentence',         'Use 3.5 now. Two. Three.',             { limit: 2 },   [[18, 'Three.', 3]]],
	['a list marker does not end a sentence',     '1. One. Two. Three.',                  { limit: 2 },   [[13, 'Three.', 3]]],
	['no end mark is still one sentence',         'One. Two. Three',                      { limit: 2 },   [[10, 'Three', 3]]],
	['leading spaces shift the index',            '   One. Two. Three.',                  { limit: 2 },   [[13, 'Three.', 3]]],
	['trailing spaces are outside the match',     'One. Two. Three.   ',                  { limit: 2 },   [[10, 'Three.', 3]]],
	['a CRLF break stays inside the paragraph',   'One. Two.\r\nThree.',                  { limit: 2 },   [[11, 'Three.', 3]]],
	['a CRLF blank line splits the text',         'One. Two. Three.\r\n\r\nFour.',        { limit: 2 },   [[10, 'Three.', 3]]],
	['Cyrillic sentences',                        'Один. Два. Три.',                      { limit: 2 },   [[11, 'Три.', 3]]],

	// the match is NOT the paragraph. It is the sentences past the limit. agent-ste reports the paragraph start instead.
	['limit one: match starts at sentence two',   'One. Two. Three.',                     { limit: 1 },   [[5, 'Two. Three.', 3]]],
	['limit zero flags every paragraph',          'One.\n\nTwo.',                         { limit: 0 },   [[0, 'One.', 1], [6, 'Two.', 1]]],

	// a paragraph is a run of lines between blank lines, nothing else. A list marker or a heading is markup, and the
	// caller strips it first. Left in, list items are one paragraph, and a heading with no blank line joins the first sentence.
	['list items, no blank line: ONE paragraph',  '- One.\n- Two.\n- Three.',             { limit: 2 },   [[14, '- Three.', 3]]],
	['heading, no blank line, joins sentence 1',  '# Title\nOne. Two. Three.',            { limit: 2 },   [[18, 'Three.', 3]]],
	['heading, blank line: its own paragraph',    '# Title\n\nOne. Two. Three.',          { limit: 2 },   [[19, 'Three.', 3]]],

	// the sentence rules in Sentences.js move the count. One row per rule that can surprise.
	['a run of end marks is one end',             'Go?! Stop. Three.',                    { limit: 2 },   [[11, 'Three.', 3]]],
	['a closing quote stays with its sentence',   'He said "Go." Then run. Three.',       { limit: 2 },   [[24, 'Three.', 3]]],
	['a semicolon does not end a sentence',       'One; two. Three. Four.',               { limit: 2 },   [[17, 'Four.', 3]]],
	['a colon does not end a sentence',           'One: two. Three. Four.',               { limit: 2 },   [[17, 'Four.', 3]]],
	['a lower-case start is a new sentence',      'Run it. then stop. Three.',            { limit: 2 },   [[19, 'Three.', 3]]],
	['e.g. then a capital DOES end a sentence',   'See e.g. This. Two. Three.',           { limit: 2 },   [[15, 'Two. Three.', 4]]],
	['Dr. then a name does not end a sentence',   'Ask Dr. Smith. Two. Three.',           { limit: 2 },   [[20, 'Three.', 3]]],
	['Fig. 3 does not end a sentence',            'See Fig. 3 now. Two. Three.',          { limit: 2 },   [[21, 'Three.', 3]]],
	['a dotted name does not end a sentence',     'Use Node.js now. Two. Three.',         { limit: 2 },   [[22, 'Three.', 3]]],
	['a URL does not end a sentence',             'See https://x.io/a.b. Two. Three.',    { limit: 2 },   [[27, 'Three.', 3]]],
	['option B. DOES end a sentence',             'Choose option B. Two. Three.',         { limit: 2 },   [[22, 'Three.', 3]]],

	// known: a run of end marks with no word is still a sentence. wordCount says 0 words, sentences says 3.
	['dots with no word count as sentences',      '... ... ...',                          { limit: 2 },   [[8, '...', 3]]],

	// options
	['options are missing',                       seven,                                  undefined,      [[72, 'Sentence 7.', 7]]],
	['a string limit is used as a number',        'One. Two. Three.',                     { limit: '2' }, [[10, 'Three.', 3]]],
]

for (const [name, text, options, matches] of cases) {
	test(name, () => {
		const found = maxSentencesPerParagraph(text, options)
		assert.deepEqual(found.map(m => [m.index, m.text, m.count]), matches)
		for (const m of found) assert.equal(text.slice(m.index, m.index + m.length), m.text, 'length')
	})
}

// The same rows again, and every other key of every match: length, limit, message, context.
for (const [name, text, options] of cases) {
	test(`every key of every match: ${name}`, () => {
		for (const m of maxSentencesPerParagraph(text, options)) {
			assert.equal(m.length, m.text.length, 'length is the text length')
			assert.equal(m.limit, +(options?.limit ?? 6), 'limit is the option, as a number')
			assert.equal(m.message, `Cut to ${m.limit} sentences. This paragraph has ${m.count}.`, 'message')
			assert.equal(typeof m.count, 'number', 'count is a number')
			assert.ok(String(text).includes(m.context), 'context is part of the input')
			assert.ok(m.context.endsWith(m.text), 'the match runs to the end of its paragraph')
		}
	})
}

// The whole output, every field but message
const outputs = [
	// text                                 matches                                                                                                         options
	['Run the tests.',                      [],                                                                                                             {}],
	['One. Two. Three.',                    [{ index: 10, length: 6, text: 'Three.', context: 'One. Two. Three.', count: 3, limit: 2 }],                    { limit: 2 }],
	['One. Two. Three.\n\nFour. Five. Six.', [{ index: 10, length: 6, text: 'Three.', context: 'One. Two. Three.', count: 3, limit: 2 }, { index: 30, length: 4, text: 'Six.', context: 'Four. Five. Six.', count: 3, limit: 2 }], { limit: 2 }],
	[seven,                                 [{ index: 72, length: 11, text: 'Sentence 7.', context: seven, count: 7, limit: 6 }],                            {}],
]

for (const [text, matches, options] of outputs) {
	test(`maxSentencesPerParagraph output for ${JSON.stringify(text)}`, () => assert.deepEqual(maxSentencesPerParagraph(text, options).map(({ message, ...m }) => m), matches))
}

// A bad limit must not stop the rule. The rule coerces the text only, so it must guard the limit too.
test('a NaN limit gives no match', () => assert.deepEqual(maxSentencesPerParagraph('One. Two.', { limit: NaN }), []))
test('a null text gives no match', () => assert.deepEqual(maxSentencesPerParagraph(null, { limit: 0 }), []))
test('a number text is read as text', () => assert.deepEqual(maxSentencesPerParagraph(12345, { limit: 0 }).map(m => [m.index, m.text, m.count]), [[0, '12345', 1]]))

// Length extremes.
test('a long paragraph', () => {
	const text = Array.from({ length: 400 }, (_, i) => `S${i}.`).join(' ')
	const found = maxSentencesPerParagraph(text)
	assert.equal(found.length, 1)
	assert.equal(found[0].count, 400)
	assert.equal(found[0].index, text.indexOf('S6.'))
	assert.equal(text.slice(found[0].index, found[0].index + found[0].length), found[0].text)
})