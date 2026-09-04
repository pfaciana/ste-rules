import { test } from 'node:test'
import assert from 'node:assert/strict'
import { noSemicolons } from './noSemicolons.js'

// Every match, exactly: [index, text, context]. One match per ASCII semicolon, in text order.
const cases = [
	// name                                text                                      matches
	['empty',                              '',                                       []],
	['plain sentence',                     'Run the tests.',                         []],
	['one semicolon',                      'Run the tests; then commit.',            [[13, ';', 'Run the tests; then commit.']]],
	['at the very start',                  '; then commit.',                         [[0, ';', '; then commit.']]],
	['at the very end',                    'Run the tests;',                         [[13, ';', 'Run the tests;']]],
	['the semicolon is the whole text',    ';',                                      [[0, ';', ';']]],
	['two semicolons, exact places',       'A; b; c.',                               [[1, ';', 'A; b; c.'], [4, ';', 'A; b; c.']]],
	['two sentences, one context each',    'A; b. C; d.',                            [[1, ';', 'A; b.'], [7, ';', 'C; d.']]],
	['two paragraphs, one context each',   'A;\n\nB;',                               [[1, ';', 'A;'], [5, ';', 'B;']]],
	['across a line break',                'Run the tests;\nthen commit.',           [[13, ';', 'Run the tests;\nthen commit.']]],
	['punctuation right before',           'Stop!; go.',                             [[5, ';', 'Stop!; go.']]],
	['inside brackets',                    'Do this (a; b) now.',                    [[10, ';', 'Do this (a; b) now.']]],
	['upper case',                         'RUN THE TESTS; THEN COMMIT.',            [[13, ';', 'RUN THE TESTS; THEN COMMIT.']]],
	['inline code is not skipped',         'Use `a; b` inline.',                     [[6, ';', 'Use `a; b` inline.']]],
	['code line',                          'const a = 1;',                           [[11, ';', 'const a = 1;']]],
	['three semicolons',                   'a; b; c; d',                             [[1, ';', 'a; b; c; d'], [4, ';', 'a; b; c; d'], [7, ';', 'a; b; c; d']]],
	['near miss, a colon',                 'Run the tests: then commit.',            []],
	['near miss, a comma',                 'Run the tests, then commit.',            []],
	['near miss, a Greek question mark',   'Run the tests; then commit.',            []],
	['near miss, a fullwidth semicolon',   'Run the tests； then commit.',            []],
	// empty and tiny
	['whitespace only',                    '   ',                                    []],
	['one letter',                         'a',                                      []],
	['one word, no punctuation',           'Run',                                    []],
	['no punctuation at all',              'Run the tests',                          []],
	['the semicolon padded by spaces',     '  ;  ',                                  [[2, ';', ';']]],
	['two semicolons in a row',            ';;',                                     [[0, ';', ';;'], [1, ';', ';;']]],
	// whitespace and Unicode
	['a tab inside the sentence',          'Run\tthe tests; go.',                    [[13, ';', 'Run\tthe tests; go.']]],
	['a CRLF inside the sentence',         'Run;\r\ngo.',                            [[3, ';', 'Run;\r\ngo.']]],
	['a CRLF blank line splits it',        'A;\r\n\r\nB;',                           [[1, ';', 'A;'], [7, ';', 'B;']]],
	['a no-break space inside',            'Run\u00A0the tests; go.',                [[13, ';', 'Run\u00A0the tests; go.']]],
	['an accent before the semicolon',     'Caf\u00E9; go.',                         [[4, ';', 'Caf\u00E9; go.']]],
	['Cyrillic before the semicolon',      'Привет; иди.',                           [[6, ';', 'Привет; иди.']]],
	['CJK around the semicolon',           '\u4F60\u597D; \u8D70',                   [[2, ';', '\u4F60\u597D; \u8D70']]],
	['an emoji on both sides',             '\u{1F680};\u{1F680}',                    [[2, ';', '\u{1F680};\u{1F680}']]],
	// markdown leftovers
	['a heading',                          '## Title; sub',                          [[8, ';', '## Title; sub']]],
	['a dash list item',                   '- item; two',                            [[6, ';', '- item; two']]],
	['a number list item',                 '1. item; two',                           [[7, ';', '1. item; two']]],
	['bold markers',                       '**bold**; go.',                          [[8, ';', '**bold**; go.']]],
	['a link',                             '[text](url); go.',                       [[11, ';', '[text](url); go.']]],
	['a table row',                        '| a | b; c |',                           [[7, ';', '| a | b; c |']]],
	['a quote line',                       '> quote; more',                          [[7, ';', '> quote; more']]],
	// code and URLs
	['snake_case',                         'do_it; now',                             [[5, ';', 'do_it; now']]],
	['camelCase',                          'doIt; now',                              [[4, ';', 'doIt; now']]],
	['a Windows path',                     'C:\\Users\\a; go.',                      [[10, ';', 'C:\\Users\\a; go.']]],
	['an https URL',                       'https://x.com/a; go.',                   [[15, ';', 'https://x.com/a; go.']]],
	['an email',                           'a@b.com; go.',                           [[7, ';', 'a@b.com; go.']]],
	['a version number',                   'v1.2.3; go.',                            [[6, ';', 'v1.2.3; go.']]],
	['a hash',                             'a1b2c3d; go.',                           [[7, ';', 'a1b2c3d; go.']]],
	['a slot',                             '${slot}; go.',                           [[7, ';', '${slot}; go.']]],
	['a shell variable',                   '$HOME; go.',                             [[5, ';', '$HOME; go.']]],
	// numbers and dates
	['a thousands number',                 '1,000; go.',                             [[5, ';', '1,000; go.']]],
	['a percent',                          '50%; go.',                               [[3, ';', '50%; go.']]],
	['a price',                            '$5; go.',                                [[2, ';', '$5; go.']]],
	['a clock time',                       '10:30; go.',                             [[5, ';', '10:30; go.']]],
	['an ISO date',                        '2026-09-04; go.',                        [[10, ';', '2026-09-04; go.']]],
	['a slashed date',                     '9/4/2026; go.',                          [[8, ';', '9/4/2026; go.']]],
	['an ordinal',                         '3rd; go.',                               [[3, ';', '3rd; go.']]],
	// punctuation
	['quotes before the semicolon',        '"Stop"; go.',                            [[6, ';', '"Stop"; go.']]],
	['an ellipsis before',                 'Wait...; go.',                           [[7, ';', 'Wait...; go.']]],
	['an em dash before',                  'Wait\u2014; go.',                        [[5, ';', 'Wait\u2014; go.']]],
	['a question and exclamation before',  'Stop?!; go.',                            [[6, ';', 'Stop?!; go.']]],
	['a period right before',              'Stop.; go.',                             [[5, ';', 'Stop.; go.']]],
	// case
	['Title Case',                         'Run The Tests; Then Commit.',            [[13, ';', 'Run The Tests; Then Commit.']]],
	// contractions
	['contractions on both sides',         "It's; don't.",                           [[4, ';', "It's; don't."]]],
	['possessives on both sides',          "the tool's; James' car.",                [[10, ';', "the tool's; James' car."]]],
	// the rule's own traps
	['an HTML entity holds one',           '&amp;; go.',                             [[4, ';', '&amp;; go.'], [5, ';', '&amp;; go.']]],
	['a CSS rule',                         'CSS: a { color: red; }',                 [[19, ';', 'CSS: a { color: red; }']]],
	['a for loop',                         'for (i=0; i<n; i++)',                    [[8, ';', 'for (i=0; i<n; i++)'], [13, ';', 'for (i=0; i<n; i++)']]],
	['near miss, an Arabic semicolon',     'Run the tests\u061B then commit.',       []],
	['near miss, a reversed semicolon',    'Run the tests\u204F then commit.',       []],
	['near miss, a small semicolon',       'Run the tests\uFE54 then commit.',       []],
	['near miss, the word semicolon',      'Do not write a semicolon here.',         []],
	['near miss, a colon and a comma',     'Run: the tests, then commit.',           []],
]

for (const [name, text, matches] of cases) {
	test(name, () => {
		const found = noSemicolons(text)
		assert.deepEqual(found.map(m => [m.index, m.text, m.context]), matches)
		for (const m of found) assert.equal(text.slice(m.index, m.index + m.length), m.text, 'length')
	})
}

const fields = [
	// text                     field       value
	['Run; go. Next one.',      'context',  'Run; go.'],
	['Run; go. Next one.',      'length',   1],
	['Run; go. Next one.',      'text',     ';'],
	['Run; go. Next one.',      'message',  'Cut the semicolon. Write two sentences.'],
	[';',                       'message',  'Cut the semicolon. Write two sentences.'],
]

for (const [text, field, value] of fields) {
	test(`the match carries ${field}`, () => assert.deepEqual(noSemicolons(text)[0][field], value))
}

// The whole output, every field but message
const outputs = [
	// text                              matches
	['Run the tests.',                   []],
	['Run the tests; then commit.',      [{ index: 13, length: 1, text: ';', context: 'Run the tests; then commit.' }]],
	[';',                                [{ index: 0, length: 1, text: ';', context: ';' }]],
	['A; b; c.',                         [{ index: 1, length: 1, text: ';', context: 'A; b; c.' }, { index: 4, length: 1, text: ';', context: 'A; b; c.' }]],
	['A; b. C; d.',                      [{ index: 1, length: 1, text: ';', context: 'A; b.' }, { index: 7, length: 1, text: ';', context: 'C; d.' }]],
	['Do this (a; b) now.',              [{ index: 10, length: 1, text: ';', context: 'Do this (a; b) now.' }]],
	['  ;  ',                            [{ index: 2, length: 1, text: ';', context: ';' }]],
	['## Title; sub',                    [{ index: 8, length: 1, text: ';', context: '## Title; sub' }]],
	['for (i=0; i<n; i++)',              [{ index: 8, length: 1, text: ';', context: 'for (i=0; i<n; i++)' }, { index: 13, length: 1, text: ';', context: 'for (i=0; i<n; i++)' }]],
	['a@b.com; go.',                     [{ index: 7, length: 1, text: ';', context: 'a@b.com; go.' }]],
	['\u{1F680};\u{1F680}',              [{ index: 2, length: 1, text: ';', context: '\u{1F680};\u{1F680}' }]],
]

for (const [text, matches] of outputs) {
	test(`noSemicolons output for ${JSON.stringify(text)}`, () => assert.deepEqual(noSemicolons(text).map(({ message, ...m }) => m), matches))
}

// The text argument with a wrong type. The code coerces the text only.
const types = [
	// name                text        matches
	['null',               null,       []],
	['undefined',          undefined,  []],
	['a number',           1000,       []],
	['a number as text with no semicolon', 123, []],
]

for (const [name, text, matches] of types) {
	test(`text type: ${name}`, () => assert.deepEqual(noSemicolons(text), matches))
}

// The rule takes no options. An extra argument must change nothing.
const options = [
	// name              option
	['missing',          undefined],
	['an empty object',  {}],
	['a knob at zero',   { maxWords: 0 }],
	['a wrong type',     'nonsense'],
	['null',             null],
]

for (const [name, option] of options) {
	test(`options ${name} change nothing`, () => {
		assert.deepEqual(noSemicolons('A; b.', option), [{ index: 1, length: 1, text: ';', context: 'A; b.', message: 'Cut the semicolon. Write two sentences.' }])
	})
}

test('a sentence of exactly twenty words', () => {
	const text = 'one two three four five six seven eight nine ten; eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty.'
	assert.deepEqual(noSemicolons(text).map(m => [m.index, m.length, m.text, m.context]), [[text.indexOf(';'), 1, ';', text]])
})

test('a sentence of twenty one words', () => {
	const text = 'one two three four five six seven eight nine ten; eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty extra.'
	assert.deepEqual(noSemicolons(text).map(m => [m.index, m.length, m.text]), [[text.indexOf(';'), 1, ';']])
})

test('a long paragraph with one semicolon', () => {
	const text = `${'word '.repeat(300)}stop; go.`
	const found = noSemicolons(text)
	assert.equal(found.length, 1)
	assert.equal(found[0].index, text.indexOf(';'))
	assert.equal(found[0].context, text)
})

test('every match slices back to its own text', () => {
	for (const [, text] of cases) {
		for (const m of noSemicolons(text)) assert.equal(text.slice(m.index, m.index + m.length), m.text)
	}
	for (const [text] of outputs) {
		for (const m of noSemicolons(text)) assert.equal(text.slice(m.index, m.index + m.length), m.text)
	}
})

test('the context always holds the semicolon it points at', () => {
	for (const [, text] of cases) {
		for (const m of noSemicolons(text)) assert.ok(m.context.includes(';'), text)
	}
})
