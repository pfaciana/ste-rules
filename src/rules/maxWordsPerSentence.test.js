import { test } from 'node:test'
import assert from 'node:assert/strict'
import { maxWordsPerSentence } from './maxWordsPerSentence.js'

const twenty = 'one two three four five six seven eight nine ten one two three four five six seven eight nine ten.'
const twentyTwo = 'one two three four five six seven eight nine ten one two three four five six seven eight nine ten alpha beta.'
const WIN_PATH = String.raw`a b c C:\Users\me\x.txt d`

// Every match, exactly: [index, text, count]. text is the words past the limit, to the end of the sentence.
const cases = [
	// name                                  text                                          options       matches
	['empty',                                '',                                           {},           []],
	['short sentence',                       'Run the tests.',                             {},           []],
	['exactly twenty words',                 twenty,                                       {},           []],
	['twenty-one words',                     'Now ' + twenty,                              {},           [[98, 'ten.', 21]]],
	['twenty-two words, default limit',      twentyTwo,                                    {},           [[98, 'alpha beta.', 22]]],
	['limit zero, match at the very start',  'One two three four.',                        { limit: 0 }, [[0, 'One two three four.', 4]]],
	['at the limit',                         'One two three.',                             { limit: 3 }, []],
	['one past the limit',                   'One two three four.',                        { limit: 3 }, [[14, 'four.', 4]]],
	['limit above the word count',           'One two three four.',                        { limit: 10 }, []],
	['upper case',                           'ONE TWO THREE FOUR.',                        { limit: 3 }, [[14, 'FOUR.', 4]]],
	['match at the very end',                'Stop now. One two three four.',              { limit: 3 }, [[24, 'four.', 4]]],
	['across a line break',                  'One two three four\nfive six.',              { limit: 3 }, [[14, 'four\nfive six.', 6]]],
	['punctuation next to the match',        'One two three, "four" five.',                { limit: 3 }, [[16, 'four" five.', 5]]],
	['two long sentences, exact places',     'One two three four. Five six seven eight.',  { limit: 3 }, [[14, 'four.', 4], [35, 'eight.', 4]]],
	['one long, one short',                  'One two three four. Stop.',                  { limit: 3 }, [[14, 'four.', 4]]],
	['a blank line splits sentences',        'One two three four\n\nFive six seven eight', { limit: 3 }, [[14, 'four', 4], [35, 'eight', 4]]],
	['! and ? end a sentence',               'One two three four! Five six seven eight?',  { limit: 3 }, [[14, 'four!', 4], [35, 'eight?', 4]]],
	['a closer after the period',            '(One two three four.) Five six seven eight.', { limit: 3 }, [[15, 'four.)', 4], [37, 'eight.', 4]]],
	['leading space is trimmed',             '   One two three four.',                     { limit: 3 }, [[17, 'four.', 4]]],
	['trailing space is trimmed',            'One two three four.   ',                     { limit: 3 }, [[14, 'four.', 4]]],
	['no terminator at the end',             'One two three four',                         { limit: 3 }, [[14, 'four', 4]]],
	['e.g. does not end the sentence',       'One two e.g. three four five.',              { limit: 3 }, [[13, 'three four five.', 6]]],
	['i.e. does not end the sentence',       'One two i.e. three four five.',              { limit: 3 }, [[13, 'three four five.', 6]]],
	['vs. does not end the sentence',        'One two vs. three four five.',               { limit: 3 }, [[12, 'three four five.', 6]]],
	['etc. before a capital ends it',        'One two etc. Three four five.',              { limit: 2 }, [[8, 'etc.', 3], [24, 'five.', 3]]],
	['Fig. A does not end the sentence',     'See Fig. A and the other parts.',            { limit: 3 }, [[11, 'and the other parts.', 7]]],
	['No. 7 does not end the sentence',      'See No. 7 and the other parts.',             { limit: 3 }, [[10, 'and the other parts.', 7]]],
	['a decimal does not end the sentence',  'Cost is 3.5 dollars per unit.',              { limit: 3 }, [[12, 'dollars per unit.', 6]]],
	['an initial ends the sentence, the count restarts', 'Ask J. Smith for the new build.', { limit: 3 }, [[21, 'new build.', 5]]],
	['a hyphenated word is one word',        'One two e-mail.',                            { limit: 3 }, []],
	['an apostrophe word is one word',       "One two don't.",                             { limit: 3 }, []],
	['punctuation is not a word',            'One, two, three!',                           { limit: 3 }, []],
	// name                                       text                                          options       matches
	['whitespace only',                           '   \t\n  ',                                  {},           []],
	['one letter, limit zero',                    'a',                                          { limit: 0 }, [[0, 'a', 1]]],
	['one word, no punctuation at all',           'stop',                                       { limit: 0 }, [[0, 'stop', 1]]],
	['tabs divide the words',                     'a\tb\tc\td',                                 { limit: 3 }, [[6, 'd', 4]]],
	['a CRLF break stays inside the sentence',    'a b c d\r\ne f',                             { limit: 3 }, [[6, 'd\r\ne f', 6]]],
	['a CRLF blank line splits the text',         'a b c d\r\n\r\ne f g h',                     { limit: 3 }, [[6, 'd', 4], [17, 'h', 4]]],
	['a no-break space divides two words',        'a b c d e',                       { limit: 3 }, [[6, 'd e', 5]]],
	['accented words',                            'un deux trois quatre café',                  { limit: 3 }, [[14, 'quatre café', 5]]],
	['Cyrillic words',                            'один два три четыре пять',                   { limit: 3 }, [[13, 'четыре пять', 5]]],
	['CJK words',                                 '一 二 三 四 五',                              { limit: 3 }, [[6, '四 五', 5]]],
	['an emoji next to the match is not a word',  'a b c 🚀 d',                                  { limit: 3 }, [[9, 'd', 4]]],
	['a heading marker is not a word',            '## Title one two three four',                { limit: 3 }, [[17, 'three four', 5]]],
	['a dash list marker is not a word',          '- item one two three four',                  { limit: 3 }, [[15, 'three four', 5]]],
	['a number list marker is a word',            '1. item one two three four',                 { limit: 3 }, [[12, 'two three four', 6]]],
	['bold stars stay inside the word',           'a b c **bold** d',                           { limit: 4 }, [[15, 'd', 5]]],
	['backtick code counts as words',             'a b c `rm -rf` d',                           { limit: 3 }, [[7, 'rm -rf` d', 6]]],
	['a markdown link counts as one word',        'a b c [text](http://x.io/p) d',              { limit: 3 }, [[7, 'text](http://x.io/p) d', 5]]],
	['table pipes are not words',                 '| a | b | c | d | e |',                      { limit: 3 }, [[14, 'd | e |', 5]]],
	['a quote marker is not a word',              '> quote one two three four',                 { limit: 3 }, [[16, 'three four', 5]]],
	['snake case is one word',                    'a b c my_var_name d',                        { limit: 3 }, [[6, 'my_var_name d', 5]]],
	['camel case is one word',                    'a b c myVarName d',                          { limit: 3 }, [[6, 'myVarName d', 5]]],
	['a Windows path is one word',                WIN_PATH,                                     { limit: 3 }, [[6, WIN_PATH.slice(6), 5]]],
	['a URL is one word',                         'a b c https://x.io/a.b/c d',                 { limit: 3 }, [[6, 'https://x.io/a.b/c d', 5]]],
	['a URL with a final period ends it',         'See a b https://x.io/p. Then one two three four.', { limit: 3 }, [[8, 'https://x.io/p.', 4], [37, 'three four.', 5]]],
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
	['an ellipsis is not a word, and it splits',  'a b c ... d',                                { limit: 3 }, []],
	['an em dash is not a word',                  'a b c — d',                                  { limit: 3 }, [[8, 'd', 4]]],
	['?! ends the sentence',                      'a b c d?! e f g h',                          { limit: 3 }, [[6, 'd?!', 4], [16, 'h', 4]]],
	['trailing dots stay in the match',           'a b c d...',                                 { limit: 3 }, [[6, 'd...', 4]]],
	['ALL CAPS letters count as words',           'A B C D E',                                  { limit: 3 }, [[6, 'D E', 5]]],
	['Title Case counts as words',                'One Two Three Four Five',                    { limit: 3 }, [[14, 'Four Five', 5]]],
	['the match is capitalized at a new start',   'One two three. Four five six seven.',        { limit: 3 }, [[29, 'seven.', 4]]],
	['contractions are one word each',            "it's isn't they're don't stop",              { limit: 3 }, [[19, "don't stop", 5]]],
	['possessives are one word each',             "the tool's James' output here",              { limit: 3 }, [[18, 'output here', 5]]],
	['Node.js does not end the sentence',         'We use a Node.js build here now.',           { limit: 3 }, [[9, 'Node.js build here now.', 7]]],
	['St. does not end the sentence',             'Meet a b St. Louis today now.',              { limit: 3 }, [[9, 'St. Louis today now.', 7]]],
	['a semicolon does not end the sentence',     'a b c; d e',                                 { limit: 3 }, [[7, 'd e', 5]]],
	['the passive voice is still counted',        'The file has been moved by the team.',       { limit: 3 }, [[13, 'been moved by the team.', 8]]],
	// traps: a run that looks like a word and is not one
	['two dashes are not a word',                 'a b c -- d',                                 { limit: 4 }, []],
	['three stars are not a word',                'a b c *** d',                                { limit: 4 }, []],
	['an arrow is not a word',                    'a b c => d',                                 { limit: 4 }, []],
	['three hashes are not a word',               'a b c ### d',                                { limit: 4 }, []],
	['a lone emoji is not a word',                'a b c 🚀 d',                                  { limit: 4 }, []],
	['a lone pipe is not a word',                 'a b c | d',                                  { limit: 4 }, []],
	// traps: a run that looks like punctuation and is a word
	['a bold run is a word',                      'a b c **bold** d',                           { limit: 4 }, [[15, 'd', 5]]],
	['a dollar amount is a word',                 'a b c $5 d',                                 { limit: 4 }, [[9, 'd', 5]]],
	['an ordinal is a word',                      'a b c 3rd d',                                { limit: 4 }, [[10, 'd', 5]]],
	['an underscore run is a word',               'a b c _x_ d',                                { limit: 4 }, [[10, 'd', 5]]],
	['C++ is a word',                             'a b c C++ d',                                { limit: 4 }, [[10, 'd', 5]]],
	['a template slot is a word',                 'a b c ${slot} d',                            { limit: 4 }, [[14, 'd', 5]]],
	['a letter and a digit are one word',         'a b c A1 d',                                 { limit: 4 }, [[9, 'd', 5]]],
	['a version number is a word',                'a b c v1.2.3 d',                             { limit: 4 }, [[13, 'd', 5]]],
	// options
	['options are missing',                       'Now ' + twenty,                              undefined,    [[98, 'ten.', 21]]],
	['a string limit is used as a number',        'a b c d',                                    { limit: '3' }, [[6, 'd', 4]]],
]

for (const [name, text, options, matches] of cases) {
	test(name, () => {
		const found = maxWordsPerSentence(text, options)
		assert.deepEqual(found.map(m => [m.index, m.text, m.count]), matches)
		for (const m of found) assert.equal(text.slice(m.index, m.index + m.length), m.text, 'length')
	})
}

// The same rows again, and every other key of every match: length, limit, message, context.
for (const [name, text, options] of cases) {
	test(`every key of every match: ${name}`, () => {
		const found = maxWordsPerSentence(text, options)
		for (const m of found) {
			assert.equal(String(text).slice(m.index, m.index + m.length), m.text, 'text is the span at index')
			assert.equal(m.length, m.text.length, 'length is the text length')
			assert.equal(m.limit, +(options?.limit ?? 20), 'limit is the option, as a number')
			assert.equal(m.message, `Cut to ${m.limit} words. This sentence has ${m.count}.`, 'message')
			assert.equal(typeof m.count, 'number', 'count is a number')
			assert.ok(String(text).includes(m.context), 'context is part of the input')
			assert.ok(m.context.endsWith(m.text), 'the match runs to the end of its sentence')
		}
	})
}

const fields = [
	// text                        options       field       value
	['Now ' + twenty,              {},           'count',    21],
	['Now ' + twenty,              {},           'limit',    20],
	['One two three four.',        { limit: 3 }, 'limit',    3],
	['One two three four.',        { limit: 3 }, 'length',   5],
	[twentyTwo,                    {},           'text',     'alpha beta.'],
	['Then stop. Now ' + twenty,   {},           'context',  'Now ' + twenty],
	['One two three four. Stop.',  { limit: 3 }, 'context',  'One two three four.'],
	['Now ' + twenty,              {},           'message',  'Cut to 20 words. This sentence has 21.'],
	['One two three four.',        { limit: 3 }, 'message',  'Cut to 3 words. This sentence has 4.'],
]

for (const [text, options, field, value] of fields) {
	test(`the match carries ${field}`, () => assert.deepEqual(maxWordsPerSentence(text, options)[0][field], value))
}

// The whole output, every field but message
const outputs = [
	// text                                         matches                                                                                                                                                                                             options
	['Run the tests.',                              []],
	['One two three four.',                         [{ index: 14, length: 5, text: 'four.', context: 'One two three four.', count: 4, limit: 3 }],                                                                                                        { limit: 3 }],
	['One two three four. Five six seven eight.',   [{ index: 14, length: 5, text: 'four.', context: 'One two three four.', count: 4, limit: 3 }, { index: 35, length: 6, text: 'eight.', context: 'Five six seven eight.', count: 4, limit: 3 }],        { limit: 3 }],
	['One two three four.',                         [{ index: 0, length: 19, text: 'One two three four.', context: 'One two three four.', count: 4, limit: 0 }],                                                                                          { limit: 0 }],
	['One two three four.',                         [],                                                                                                                                                                                                  { limit: 10 }],
	[twentyTwo,                                     [{ index: 98, length: 11, text: 'alpha beta.', context: twentyTwo, count: 22, limit: 20 }]],
]

for (const [text, matches, options] of outputs) {
	test(`maxWordsPerSentence output for ${JSON.stringify(text)}`, () => assert.deepEqual(maxWordsPerSentence(text, options).map(({ message, ...m }) => m), matches))
}

// The whole output again, for the rows that mix markdown, code and Unicode
const more = [
	// text                                 matches                                                                                                                             options
	['## Title one two three four',         [{ index: 17, length: 10, text: 'three four', context: '## Title one two three four', count: 5, limit: 3 }],                          { limit: 3 }],
	['a b c ${slot} d',                     [{ index: 8, length: 7, text: 'slot} d', context: 'a b c ${slot} d', count: 5, limit: 3 }],                                           { limit: 3 }],
	['un deux trois quatre café',           [{ index: 14, length: 11, text: 'quatre café', context: 'un deux trois quatre café', count: 5, limit: 3 }],                           { limit: 3 }],
	['a b c d\r\n\r\ne f g h',              [{ index: 6, length: 1, text: 'd', context: 'a b c d', count: 4, limit: 3 }, { index: 17, length: 1, text: 'h', context: 'e f g h', count: 4, limit: 3 }], { limit: 3 }],
	['a b c d',                             [{ index: 6, length: 1, text: 'd', context: 'a b c d', count: 4, limit: 3 }],                                                         { limit: '3' }],
	['a b c 🚀 d',                           [{ index: 9, length: 1, text: 'd', context: 'a b c 🚀 d', count: 4, limit: 3 }],                                                       { limit: 3 }],
]

for (const [text, matches, options] of more) {
	test(`maxWordsPerSentence full output for ${JSON.stringify(text)} at limit ${options.limit}`, () => assert.deepEqual(maxWordsPerSentence(text, options).map(({ message, ...m }) => m), matches))
}

// Every match of every row points at its own text.
test('index and length always cut out the match text', () => {
	for (const [name, text, options] of cases) {
		for (const m of maxWordsPerSentence(text, options)) assert.equal(String(text).slice(m.index, m.index + m.length), m.text, name)
	}
	for (const [text, options] of fields) {
		for (const m of maxWordsPerSentence(text, options)) assert.equal(String(text).slice(m.index, m.index + m.length), m.text, text)
	}
})

// A bad limit must not stop the rule. The rule coerces the text only, so it must guard the limit too.
test('a NaN limit gives no match', () => assert.deepEqual(maxWordsPerSentence('a b c d', { limit: NaN }), []))
test('a null text gives no match', () => assert.deepEqual(maxWordsPerSentence(null, { limit: 0 }), []))
test('a number text is read as text', () => assert.deepEqual(maxWordsPerSentence(12345, { limit: 0 }).map(m => [m.index, m.text, m.count]), [[0, '12345', 1]]))

// Length extremes.
test('a long paragraph of one sentence', () => {
	const text = Array.from({ length: 400 }, (_, i) => 'w' + i).join(' ') + '.'
	const found = maxWordsPerSentence(text, {})
	assert.equal(found.length, 1)
	assert.equal(found[0].count, 400)
	assert.equal(found[0].index, text.indexOf('w20'))
	assert.equal(text.slice(found[0].index, found[0].index + found[0].length), found[0].text)
})
