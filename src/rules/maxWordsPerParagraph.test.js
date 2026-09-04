import { test } from 'node:test'
import assert from 'node:assert/strict'
import { maxWordsPerParagraph } from './maxWordsPerParagraph.js'

const WIN_PATH = String.raw`a b c C:\Users\me\x.txt d`
const fifty = Array.from({ length: 50 }, (_, i) => 'w' + i).join(' ') + '.'

// Every match, exactly: [index, text, count]. text starts at the first word past the limit.
const cases = [
	// name                                        text                          options       matches
	['empty',                                      '',                           {},           []],
	['only blank lines',                           '\n\n  \n',                   {},           []],
	['short paragraph',                            'Run the tests.',             {},           []],
	['exactly fifty words',                        fifty,                        {},           []],
	['fifty-one words',                            'Now ' + fifty,               {},           [[190, 'w49.', 51]]],
	['lines inside one paragraph count together',  'Now\n' + fifty,              {},           [[190, 'w49.', 51]]],
	['two paragraphs, only the long one',          'Now ' + fifty + '\n\nShort one.', {},      [[190, 'w49.', 51]]],
	['at the limit',                               'One two three.',             { limit: 3 }, []],
	['one past the limit',                         'One two three four.',        { limit: 3 }, [[14, 'four.', 4]]],
	['upper case',                                 'ONE TWO THREE FOUR.',        { limit: 3 }, [[14, 'FOUR.', 4]]],
	['the match starts at the very start',         'Run the tests.',             { limit: 0 }, [[0, 'Run the tests.', 3]]],
	['no words, so no match at limit zero',        '... --- ???',                { limit: 0 }, []],
	['the match runs to the very end',             'a b c d',                    { limit: 3 }, [[6, 'd', 4]]],
	['two matches, exact places',                  'a b c d\n\ne f g h',         { limit: 3 }, [[6, 'd', 4], [15, 'h', 4]]],
	['the match spans a line break',               'a b\nc d',                   { limit: 1 }, [[2, 'b\nc d', 4]]],
	['a line break inside one paragraph',          'a b\nc d',                   { limit: 3 }, [[6, 'd', 4]]],
	['punctuation next to the match',              'a b c (d).',                 { limit: 3 }, [[7, 'd).', 4]]],
	['punctuation is not a word',                  'One, two, three!!!',         { limit: 3 }, []],
	['hyphens and apostrophes keep one word',      "don't e-mail ASD-STE100",    { limit: 3 }, []],
	['a decimal point keeps one word',             'take 3.14 now',              { limit: 3 }, []],
	['digits count as words',                      'a 1 b 2',                    { limit: 3 }, [[6, '2', 4]]],
	['leading spaces shift the index',             '   a b c d',                 { limit: 3 }, [[9, 'd', 4]]],
	['trailing spaces are outside the match',      'a b c d   ',                 { limit: 3 }, [[6, 'd', 4]]],
	['a blank line ends the paragraph',            'a b c d\n\ne f',             { limit: 3 }, [[6, 'd', 4]]],
	['the second paragraph is the long one',       'e f\n\na b c d',             { limit: 3 }, [[11, 'd', 4]]],
	// name                                       text                                          options       matches
	['whitespace and a tab only',                 '   \t\n  ',                                  {},           []],
	['one letter, limit zero',                    'a',                                          { limit: 0 }, [[0, 'a', 1]]],
	['one word, no punctuation at all',           'stop',                                       { limit: 0 }, [[0, 'stop', 1]]],
	['tabs divide the words',                     'a\tb\tc\td',                                 { limit: 3 }, [[6, 'd', 4]]],
	['a CRLF break stays inside the paragraph',   'a b c\r\nd e',                               { limit: 3 }, [[7, 'd e', 5]]],
	['a CRLF blank line splits the text',         'a b c d\r\n\r\ne f g h',                     { limit: 3 }, [[6, 'd', 4], [17, 'h', 4]]],
	['a no-break space divides two words',        'a b c d e',                             { limit: 3 }, [[6, 'd e', 5]]],
	['accented words',                            'un deux trois quatre café',                  { limit: 3 }, [[14, 'quatre café', 5]]],
	['Cyrillic words',                            'один два три четыре пять',                   { limit: 3 }, [[13, 'четыре пять', 5]]],
	['CJK words',                                 '一 二 三 四 五',                              { limit: 3 }, [[6, '四 五', 5]]],
	['an emoji next to the match is not a word',  'a b c 🚀 d',                                  { limit: 3 }, [[9, 'd', 4]]],
	['a heading marker is not a word',            '## Title one two three four',                { limit: 3 }, [[17, 'three four', 5]]],
	['a dash list marker is not a word',          '- item one two three four',                  { limit: 3 }, [[15, 'three four', 5]]],
	['a number list marker is a word',            '1. item one two three four',                 { limit: 3 }, [[12, 'two three four', 6]]],
	['a heading and then a long paragraph',       '# Title\n\na b c d',                         { limit: 3 }, [[15, 'd', 4]]],
	['list lines make one paragraph',             '- a\n- b\n- c\n- d',                         { limit: 3 }, [[14, 'd', 4]]],
	['bold stars stay inside the word',           'a b c **bold** d',                           { limit: 4 }, [[15, 'd', 5]]],
	['backtick code counts as words',             'a b c `rm -rf` d',                           { limit: 3 }, [[7, 'rm -rf` d', 6]]],
	['a markdown link counts as one word',        'a b c [text](http://x.io/p) d',              { limit: 3 }, [[7, 'text](http://x.io/p) d', 5]]],
	['table pipes are not words',                 '| a | b | c | d | e |',                      { limit: 3 }, [[14, 'd | e |', 5]]],
	['a quote marker is not a word',              '> quote one two three four',                 { limit: 3 }, [[16, 'three four', 5]]],
	['snake case is one word',                    'a b c my_var_name d',                        { limit: 3 }, [[6, 'my_var_name d', 5]]],
	['camel case is one word',                    'a b c myVarName d',                          { limit: 3 }, [[6, 'myVarName d', 5]]],
	['a Windows path is one word',                WIN_PATH,                                     { limit: 3 }, [[6, WIN_PATH.slice(6), 5]]],
	['a URL is one word',                         'a b c https://x.io/a.b/c d',                 { limit: 3 }, [[6, 'https://x.io/a.b/c d', 5]]],
	['an email address is one word',              'a b c me@x.io d',                            { limit: 3 }, [[6, 'me@x.io d', 5]]],
	['a version number is one word',              'a b c v1.2.3 d',                             { limit: 3 }, [[6, 'v1.2.3 d', 5]]],
	['a hash is one word',                        'a b c 9f8e7d6 d',                            { limit: 3 }, [[6, '9f8e7d6 d', 5]]],
	['a template slot is one word',               'a b c ${slot} d',                            { limit: 3 }, [[8, 'slot} d', 5]]],
	['a shell variable is one word',              'a b c $HOME d',                              { limit: 3 }, [[7, 'HOME d', 5]]],
	['a thousands comma keeps one word',          'a b c 1,000 d',                              { limit: 3 }, [[6, '1,000 d', 5]]],
	['a percent keeps one word',                  'a b c 50% d',                                { limit: 3 }, [[6, '50% d', 5]]],
	['a dollar amount is one word',               'a b c $5 d',                                 { limit: 3 }, [[7, '5 d', 5]]],
	['a clock time is one word',                  'a b c 10:30 d',                              { limit: 3 }, [[6, '10:30 d', 5]]],
	['an ISO date is one word',                   'a b c 2026-09-04 d',                         { limit: 3 }, [[6, '2026-09-04 d', 5]]],
	['a slash date is one word',                  'a b c 9/4/2026 d',                           { limit: 3 }, [[6, '9/4/2026 d', 5]]],
	['an ordinal is one word',                    'a b c 3rd d',                                { limit: 3 }, [[6, '3rd d', 5]]],
	['quotes around the match',                   '"One two three four" he said.',              { limit: 3 }, [[15, 'four" he said.', 6]]],
	['brackets around the match',                 'a b c [d] e',                                { limit: 3 }, [[7, 'd] e', 5]]],
	['an ellipsis is not a word',                 'a b c ... d',                                { limit: 3 }, [[10, 'd', 4]]],
	['an em dash is not a word',                  'a b c — d',                                  { limit: 3 }, [[8, 'd', 4]]],
	['?! does not split a paragraph',             'a b c d?! e f g h',                          { limit: 3 }, [[6, 'd?! e f g h', 8]]],
	['trailing dots stay in the match',           'a b c d...',                                 { limit: 3 }, [[6, 'd...', 4]]],
	['two sentences count together',              'One two three. Four five six seven.',        { limit: 3 }, [[15, 'Four five six seven.', 7]]],
	['ALL CAPS letters count as words',           'A B C D E',                                  { limit: 3 }, [[6, 'D E', 5]]],
	['Title Case counts as words',                'One Two Three Four Five',                    { limit: 3 }, [[14, 'Four Five', 5]]],
	['contractions are one word each',            "it's isn't they're don't stop",              { limit: 3 }, [[19, "don't stop", 5]]],
	['possessives are one word each',             "the tool's James' output here",              { limit: 3 }, [[18, 'output here', 5]]],
	['a semicolon does not divide the words',     'a b c; d e',                                 { limit: 3 }, [[7, 'd e', 5]]],
	['the passive voice is still counted',        'The file has been moved by the team.',       { limit: 3 }, [[13, 'been moved by the team.', 8]]],
	// traps: a run that looks like a word and is not one
	['two dashes are not a word',                 'a b c -- d',                                 { limit: 4 }, []],
	['three stars are not a word',                'a b c *** d',                                { limit: 4 }, []],
	['an arrow is not a word',                    'a b c => d',                                 { limit: 4 }, []],
	['three hashes are not a word',               'a b c ### d',                                { limit: 4 }, []],
	['a lone emoji is not a word',                'a b c 🚀 d',                                  { limit: 4 }, []],
	['a lone pipe is not a word',                 'a b c | d',                                  { limit: 4 }, []],
	['an ellipsis is not a word at limit four',   'a b c ... d',                                { limit: 4 }, []],
	// traps: a run that looks like punctuation and is a word
	['a bold run is a word',                      'a b c **bold** d',                           { limit: 4 }, [[15, 'd', 5]]],
	['a dollar amount is a word',                 'a b c $5 d',                                 { limit: 4 }, [[9, 'd', 5]]],
	['an ordinal is a word',                      'a b c 3rd d',                                { limit: 4 }, [[10, 'd', 5]]],
	['an underscore run is a word',               'a b c _x_ d',                                { limit: 4 }, [[10, 'd', 5]]],
	['C++ is a word',                             'a b c C++ d',                                { limit: 4 }, [[10, 'd', 5]]],
	['a template slot is a word',                 'a b c ${slot} d',                            { limit: 4 }, [[14, 'd', 5]]],
	['a letter and a digit are one word',         'a b c A1 d',                                 { limit: 4 }, [[9, 'd', 5]]],
	['a lone number and period is a word',        'a b c 1. d',                                 { limit: 4 }, [[9, 'd', 5]]],
	// options
	['options are missing',                       'Now ' + fifty,                               undefined,    [[190, 'w49.', 51]]],
	['a string limit is used as a number',        'a b c d',                                    { limit: '3' }, [[6, 'd', 4]]],
]

for (const [name, text, options, matches] of cases) {
	test(name, () => {
		const found = maxWordsPerParagraph(text, options)
		assert.deepEqual(found.map(m => [m.index, m.text, m.count]), matches)
		for (const m of found) assert.equal(text.slice(m.index, m.index + m.length), m.text, 'length')
	})
}

// The same rows again, and every other key of every match: length, limit, message, context.
for (const [name, text, options] of cases) {
	test(`every key of every match: ${name}`, () => {
		const found = maxWordsPerParagraph(text, options)
		for (const m of found) {
			assert.equal(String(text).slice(m.index, m.index + m.length), m.text, 'text is the span at index')
			assert.equal(m.length, m.text.length, 'length is the text length')
			assert.equal(m.limit, +(options?.limit ?? 50), 'limit is the option, as a number')
			assert.equal(m.message, `Cut to ${m.limit} words. This paragraph has ${m.count}.`, 'message')
			assert.equal(typeof m.count, 'number', 'count is a number')
			assert.ok(String(text).includes(m.context), 'context is part of the input')
			assert.ok(m.context.endsWith(m.text), 'the match runs to the end of its paragraph')
		}
	})
}

const twentyTwo = Array.from({ length: 22 }, (_, i) => 'w' + i).join(' ') + '.'

const fields = [
	// text                  options       field       value
	['Now ' + fifty,         {},           'count',    51],
	['Now ' + fifty,         {},           'limit',    50],
	['Now ' + fifty,         {},           'length',   4],
	['Now ' + fifty,         {},           'context',  'Now ' + fifty],
	['Now ' + fifty,         {},           'message',  'Cut to 50 words. This paragraph has 51.'],
	[twentyTwo,              { limit: 20 }, 'text',    'w20 w21.'],
	[twentyTwo,              { limit: 20 }, 'count',   22],
	[twentyTwo,              { limit: 20 }, 'message', 'Cut to 20 words. This paragraph has 22.'],
	['a b c d   ',           { limit: 3 }, 'context',  'a b c d'],
	['a b c d',              { limit: 0 }, 'message',  'Cut to 0 words. This paragraph has 4.'],
]

for (const [text, options, field, value] of fields) {
	test(`the match carries ${field} for limit ${options.limit ?? 50}`, () => assert.deepEqual(maxWordsPerParagraph(text, options)[0][field], value))
}

// The whole output, every field but message
const outputs = [
	// text                     matches                                                                                                                                            options
	['Run the tests.',          [],                                                                                                                                                 {}],
	['One two three four.',     [{ index: 14, length: 5, text: 'four.', context: 'One two three four.', count: 4, limit: 3 }],                                                       { limit: 3 }],
	['a b c d\n\ne f g h',      [{ index: 6, length: 1, text: 'd', context: 'a b c d', count: 4, limit: 3 }, { index: 15, length: 1, text: 'h', context: 'e f g h', count: 4, limit: 3 }], { limit: 3 }],
	['Run the tests.',          [{ index: 0, length: 14, text: 'Run the tests.', context: 'Run the tests.', count: 3, limit: 0 }],                                                    { limit: 0 }],
	['Now ' + fifty,            [{ index: 190, length: 4, text: 'w49.', context: 'Now ' + fifty, count: 51, limit: 50 }],                                                            {}],
	[twentyTwo,                 [{ index: 70, length: 8, text: 'w20 w21.', context: twentyTwo, count: 22, limit: 20 }],                                                              { limit: 20 }],
]

for (const [text, matches, options] of outputs) {
	test(`maxWordsPerParagraph output for ${JSON.stringify(text)}`, () => assert.deepEqual(maxWordsPerParagraph(text, options).map(({ message, ...m }) => m), matches))
}

// The whole output again, for the rows that mix markdown, code and Unicode
const more = [
	// text                                 matches                                                                                                                             options
	['## Title one two three four',         [{ index: 17, length: 10, text: 'three four', context: '## Title one two three four', count: 5, limit: 3 }],                          { limit: 3 }],
	['a b c ${slot} d',                     [{ index: 8, length: 7, text: 'slot} d', context: 'a b c ${slot} d', count: 5, limit: 3 }],                                           { limit: 3 }],
	['un deux trois quatre café',           [{ index: 14, length: 11, text: 'quatre café', context: 'un deux trois quatre café', count: 5, limit: 3 }],                           { limit: 3 }],
	['a b c d\r\n\r\ne f g h',              [{ index: 6, length: 1, text: 'd', context: 'a b c d', count: 4, limit: 3 }, { index: 17, length: 1, text: 'h', context: 'e f g h', count: 4, limit: 3 }], { limit: 3 }],
	['a b c d',                             [{ index: 6, length: 1, text: 'd', context: 'a b c d', count: 4, limit: 3 }],                                                         { limit: '3' }],
	['- a\n- b\n- c\n- d',                  [{ index: 14, length: 1, text: 'd', context: '- a\n- b\n- c\n- d', count: 4, limit: 3 }],                                             { limit: 3 }],
]

for (const [text, matches, options] of more) {
	test(`maxWordsPerParagraph full output for ${JSON.stringify(text)} at limit ${options.limit}`, () => assert.deepEqual(maxWordsPerParagraph(text, options).map(({ message, ...m }) => m), matches))
}

// Every match of every row points at its own text.
test('index and length always cut out the match text', () => {
	for (const [name, text, options] of cases) {
		for (const m of maxWordsPerParagraph(text, options)) assert.equal(String(text).slice(m.index, m.index + m.length), m.text, name)
	}
	for (const [text, options] of fields) {
		for (const m of maxWordsPerParagraph(text, options)) assert.equal(String(text).slice(m.index, m.index + m.length), m.text, text)
	}
})

// A bad limit must not stop the rule. The rule coerces the text only, so it must guard the limit too.
test('a NaN limit gives no match', () => assert.deepEqual(maxWordsPerParagraph('a b c d', { limit: NaN }), []))
test('a null text gives no match', () => assert.deepEqual(maxWordsPerParagraph(null, { limit: 0 }), []))
test('a number text is read as text', () => assert.deepEqual(maxWordsPerParagraph(12345, { limit: 0 }).map(m => [m.index, m.text, m.count]), [[0, '12345', 1]]))

// Length extremes.
test('a long paragraph', () => {
	const text = Array.from({ length: 400 }, (_, i) => 'w' + i).join(' ') + '.'
	const found = maxWordsPerParagraph(text, {})
	assert.equal(found.length, 1)
	assert.equal(found[0].count, 400)
	assert.equal(found[0].index, text.indexOf('w50'))
	assert.equal(text.slice(found[0].index, found[0].index + found[0].length), found[0].text)
})
