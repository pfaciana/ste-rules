import { test } from 'node:test'
import assert from 'node:assert/strict'
import { maxParagraphs } from './maxParagraphs.js'

const three = 'A1.\n\nB2.\n\nC3.'
const four  = 'A1.\n\nB2.\n\nC3.\n\nD4.'
const five  = 'A1.\n\nB2.\n\nC3.\n\nD4.\n\nE5.'
const seven = 'A1.\n\nB2.\n\nC3.\n\nD4.\n\nE5.\n\nF6.\n\nG7.'
const long  = Array.from({ length: 300 }, (_, i) => `word${i}`).join(' ')

// Every match, exactly: [index, text, number]. One match per paragraph past the limit.
const cases = [
	// name                                        text                        options       matches
	['empty',                                      '',                         {},           []],
	['one paragraph',                              'One.',                     {},           []],
	['four paragraphs, at the limit',              four,                       {},           []],
	['five paragraphs, one past the limit',        five,                       {},           [[20, 'E5.', 5]]],
	['seven paragraphs, exact places',             seven,                      {},           [[20, 'E5.', 5], [25, 'F6.', 6], [30, 'G7.', 7]]],
	['upper case',                                 'AAA\n\nBBB\n\nCCC\n\nDDD\n\nEEE', {},    [[20, 'EEE', 5]]],
	['limit 0 matches at the very start',          'One.\n\nTwo.',             { limit: 0 }, [[0, 'One.', 1], [6, 'Two.', 2]]],
	['the match ends the text',                    'One.\n\nTwo.',             { limit: 1 }, [[6, 'Two.', 2]]],
	['limit 2, at the limit',                      'A.\n\nB.',                 { limit: 2 }, []],
	['limit 2, one past the limit',                'A.\n\nB.\n\nC.',           { limit: 2 }, [[8, 'C.', 3]]],
	['limit above the count',                      three,                      { limit: 10 }, []],
	['a match across a line break',                'One.\n\nTwo\nlines.',      { limit: 1 }, [[6, 'Two\nlines.', 2]]],
	['punctuation next to the match',              'One.\n\n(Note: two!)',     { limit: 1 }, [[6, '(Note: two!)', 2]]],
	['single newlines make one paragraph',         'A.\nB.\nC.\nD.\nE.',       {},           []],
	['a line of spaces splits',                    'A.\n   \nB.',              { limit: 1 }, [[7, 'B.', 2]]],
	['many blank lines split once',                'A.\n\n\n\nB.',             { limit: 1 }, [[6, 'B.', 2]]],
	['a CRLF blank line splits',                   'A.\r\n\r\nB.',             { limit: 1 }, [[6, 'B.', 2]]],
	['leading blank lines are not a paragraph',    '\n\nOne.\n\nTwo.',         { limit: 1 }, [[8, 'Two.', 2]]],
	['leading spaces are off the index',           'A.\n\n   B.',              { limit: 1 }, [[7, 'B.', 2]]],
	['trailing spaces are off the length',         'A.\n\nB.   \n',            { limit: 1 }, [[4, 'B.', 2]]],
	['a trailing blank line adds no paragraph',    'A.\n\nB.\n\n',             { limit: 1 }, [[4, 'B.', 2]]],
	['the text ends with no newline',              'A.\n\nB.',                 { limit: 1 }, [[4, 'B.', 2]]],

	// empty and tiny
	['the user sends white space only',            '   \n\t\n  ',              {},           []],
	['the user sends one letter',                  'A',                        {},           []],
	['the user sends one word, no punctuation',    'stop',                     {},           []],
	['the user sends five words, no punctuation',  'one\n\ntwo\n\nthree\n\nfour\n\nfive', {}, [[23, 'five', 5]]],

	// white space and Unicode
	['a tab line splits',                          'A.\n\t\t\nB.',             { limit: 1 }, [[6, 'B.', 2]]],
	['a CRLF text splits',                         'A.\r\n\r\nSecond.',        { limit: 1 }, [[6, 'Second.', 2]]],
	['a no-break space line splits',               'A.\n\u00a0\nB.',           { limit: 1 }, [[5, 'B.', 2]]],
	['a form feed line splits',                    'A.\n\f\nB.',               { limit: 1 }, [[5, 'B.', 2]]],
	['trailing spaces before a blank line',        'A.  \n\nB.',               { limit: 1 }, [[6, 'B.', 2]]],
	['accents in the match',                       'A.\n\nCaf\u00e9\u00a0ouvert.', { limit: 1 }, [[4, 'Caf\u00e9\u00a0ouvert.', 2]]],
	['Cyrillic in the match',                      'A.\n\n\u041f\u0440\u0438\u0432\u0435\u0442 \u043c\u0438\u0440.', { limit: 1 }, [[4, '\u041f\u0440\u0438\u0432\u0435\u0442 \u043c\u0438\u0440.', 2]]],
	['CJK in the match',                           'A.\n\n\u8fd9\u662f\u6bb5\u843d\u3002', { limit: 1 }, [[4, '\u8fd9\u662f\u6bb5\u843d\u3002', 2]]],
	['an emoji next to the match',                 'A.\n\n\ud83d\ude80 Ship it.', { limit: 1 }, [[4, '\ud83d\ude80 Ship it.', 2]]],

	// markdown leftovers
	['a heading line',                             'A.\n\n## Title',           { limit: 1 }, [[4, '## Title', 2]]],
	['a dash list item',                           'A.\n\n- item',             { limit: 1 }, [[4, '- item', 2]]],
	['a numbered list item',                       'A.\n\n1. item',            { limit: 1 }, [[4, '1. item', 2]]],
	['bold marks',                                 'A.\n\n**bold**',           { limit: 1 }, [[4, '**bold**', 2]]],
	['backtick code',                              'A.\n\n`npm test`',         { limit: 1 }, [[4, '`npm test`', 2]]],
	['a markdown link',                            'A.\n\n[text](https://x.test/a)', { limit: 1 }, [[4, '[text](https://x.test/a)', 2]]],
	['a table row',                                'A.\n\n| a | b |',          { limit: 1 }, [[4, '| a | b |', 2]]],
	['a block quote',                              'A.\n\n> quote',            { limit: 1 }, [[4, '> quote', 2]]],

	// code and URLs
	['snake case and camel case',                  'A.\n\nrun_the_task and camelCase.', { limit: 1 }, [[4, 'run_the_task and camelCase.', 2]]],
	['a Windows path',                             'A.\n\nC:\\Users\\me\\file.txt', { limit: 1 }, [[4, 'C:\\Users\\me\\file.txt', 2]]],
	['an https URL',                               'A.\n\nhttps://x.test/a?b=1#c', { limit: 1 }, [[4, 'https://x.test/a?b=1#c', 2]]],
	['an email address',                           'A.\n\nmail me at a.b@x.test', { limit: 1 }, [[4, 'mail me at a.b@x.test', 2]]],
	['a version and a hash',                       'A.\n\nv1.2.3 and 9f3a1c0', { limit: 1 }, [[4, 'v1.2.3 and 9f3a1c0', 2]]],
	['a slot and a shell variable',                'A.\n\n${slot} and $HOME',  { limit: 1 }, [[4, '${slot} and $HOME', 2]]],

	// numbers and dates
	['a thousand, a percent, a price',             'A.\n\n1,000 and 50% and $5', { limit: 1 }, [[4, '1,000 and 50% and $5', 2]]],
	['a time and an ISO date',                     'A.\n\n10:30 on 2026-09-04', { limit: 1 }, [[4, '10:30 on 2026-09-04', 2]]],
	['a US date and an ordinal',                   'A.\n\n9/4/2026, the 3rd',  { limit: 1 }, [[4, '9/4/2026, the 3rd', 2]]],

	// punctuation
	['quotes around the match',                    'A.\n\n"Stop." he said',    { limit: 1 }, [[4, '"Stop." he said', 2]]],
	['brackets around the match',                  'A.\n\n[Note] (see below)', { limit: 1 }, [[4, '[Note] (see below)', 2]]],
	['an ellipsis, an em dash, and ?!',            'A.\n\nWait ... now\u2014go?!', { limit: 1 }, [[4, 'Wait ... now\u2014go?!', 2]]],

	// case
	['all capitals',                               'A.\n\nREAD THE LOG FIRST.', { limit: 1 }, [[4, 'READ THE LOG FIRST.', 2]]],
	['title case',                                 'A.\n\nRead The Log First.', { limit: 1 }, [[4, 'Read The Log First.', 2]]],

	// contractions
	['contractions in the match',                  "A.\n\nIt's the tool's log, isn't it?", { limit: 1 }, [[4, "It's the tool's log, isn't it?", 2]]],
	['possessives in the match',                   "A.\n\nJames' file, they're done.", { limit: 1 }, [[4, "James' file, they're done.", 2]]],

	// traps: it looks like a split and it is not
	['a markdown list is one paragraph',           '- a\n- b\n- c\n- d\n- e',  {},           []],
	['a table is one paragraph',                   '| a |\n| b |\n| c |\n| d |\n| e |', {},  []],
	['a code fence with no blank line',            '```\na\nb\nc\nd\n```',     {},           []],
	['five headings with no blank lines',          '# A\n# B\n# C\n# D\n# E',  {},           []],
	['a line of hyphens is not blank',             'A.\n---\nB.',              { limit: 1 }, []],
	['a zero width space line is not blank',       'A.\n\u200b\nB.',           { limit: 1 }, []],
	['a lone CR does not split',                   'A.\rB.\rC.\rD.\rE.',       {},           []],

	// traps: it looks like one block and it splits
	['a blank line inside a code fence splits',    '```\na\n\nb\n```',         { limit: 1 }, [[7, 'b\n```', 2]]],
	['a blank line inside a list splits',          '- a\n\n- b',               { limit: 1 }, [[5, '- b', 2]]],

	// length extremes
	['a long paragraph is one paragraph',          long,                       {},           []],
	['exactly at the limit of two',                'A.\n\nB.',                 { limit: 2 }, []],
	['one paragraph past the limit of two',        'A.\n\nB.\n\nC.',           { limit: 2 }, [[8, 'C.', 3]]],

	// options
	['the options are missing',                    five,                       undefined,    [[20, 'E5.', 5]]],
	['the options are an empty object',            five,                       {},           [[20, 'E5.', 5]]],
	['the limit is a string of two',               'A.\n\nB.\n\nC.',           { limit: '2' }, [[8, 'C.', 3]]],
]

for (const [name, text, options, matches] of cases) {
	test(name, () => {
		const found = maxParagraphs(text, options)
		assert.deepEqual(found.map(m => [m.index, m.text, m.number]), matches)
		for (const m of found) assert.equal(text.slice(m.index, m.index + m.length), m.text, 'length')
	})
}

const fields = [
	// text     options       field       value
	[five,      {},           'number',   5],
	[five,      {},           'total',    5],
	[five,      {},           'limit',    4],
	[five,      {},           'length',   3],
	[five,      {},           'index',    20],
	[five,      {},           'context',  five],
	[seven,     {},           'total',    7],
	[three,     { limit: 2 }, 'limit',    2],
	[three,     { limit: 2 }, 'number',   3],
	[five,      {},           'message',  'Cut to 4 paragraphs. This is paragraph 5 of 5.'],
	[seven,     {},           'message',  'Cut to 4 paragraphs. This is paragraph 5 of 7.'],
	[three,     { limit: 2 }, 'message',  'Cut to 2 paragraphs. This is paragraph 3 of 3.'],
	[three,     { limit: 0 }, 'message',  'Cut to 0 paragraphs. This is paragraph 1 of 3.'],
]

for (const [text, options, field, value] of fields) {
	test(`the match carries ${field}`, () => assert.deepEqual(maxParagraphs(text, options)[0][field], value))
}

// The whole output, every field but message
const outputs = [
	// text                  matches                                                                                                                                                                                    options
	[four,                   [],                                                                                                                                                                                        {}],
	[five,                   [{ index: 20, length: 3, text: 'E5.', context: five, number: 5, total: 5, limit: 4 }],                                                                                                     {}],
	['A.\n\nB.\n\nC.',       [{ index: 8, length: 2, text: 'C.', context: 'A.\n\nB.\n\nC.', number: 3, total: 3, limit: 2 }],                                                                                            { limit: 2 }],
	[three,                  [{ index: 5, length: 3, text: 'B2.', context: three, number: 2, total: 3 , limit: 1 }, { index: 10, length: 3, text: 'C3.', context: three, number: 3, total: 3, limit: 1 }],               { limit: 1 }],
	['One.\n\nTwo.',         [{ index: 0, length: 4, text: 'One.', context: 'One.\n\nTwo.', number: 1, total: 2, limit: 0 }, { index: 6, length: 4, text: 'Two.', context: 'One.\n\nTwo.', number: 2, total: 2, limit: 0 }], { limit: 0 }],
	[three,                  [],                                                                                                                                                                                        { limit: 10 }],
	[seven,                  [{ index: 20, length: 3, text: 'E5.', context: seven, number: 5, total: 7, limit: 4 }, { index: 25, length: 3, text: 'F6.', context: seven, number: 6, total: 7, limit: 4 }, { index: 30, length: 3, text: 'G7.', context: seven, number: 7, total: 7, limit: 4 }], {}],
]

for (const [text, matches, options] of outputs) {
	test(`maxParagraphs output for ${JSON.stringify(text)}`, () => assert.deepEqual(maxParagraphs(text, options).map(({ message, ...m }) => m), matches))
}

// Every match of every row: the span is the text
test('the span of every match is the text', () => {
	for (const [name, text, options] of cases) {
		for (const m of maxParagraphs(text, options)) assert.equal(text.slice(m.index, m.index + m.length), m.text, name)
	}
	for (const [text, , options] of outputs) {
		for (const m of maxParagraphs(text, options)) assert.equal(text.slice(m.index, m.index + m.length), m.text, JSON.stringify(text))
	}
})
