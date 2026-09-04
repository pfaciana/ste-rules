import { test } from 'node:test'
import assert from 'node:assert/strict'
import { maxWordsLastParagraph } from './maxWordsLastParagraph.js'

const long = Array.from({ length: 300 }, (_, i) => `word${i}`).join(' ')

// Every match, exactly: [index, text, count]. The rule reports the last paragraph only, so at most one match.
const cases = [
	// name                                 text                                                                     matches                                                                                     options
	['empty',                               '',                                                                      []],
	['blank lines only',                    '\n \n\t\n',                                                             []],
	['short last paragraph',                'The build fails.\n\nFix the import, then rerun the tests.',              []],
	['exactly ten words',                   'Body.\n\nOne two three four five six seven eight nine ten.',            []],
	['eleven words, one past the limit',    'Body.\n\nOne two three four five six seven eight nine ten eleven.',     [[7, 'One two three four five six seven eight nine ten eleven.', 11]]],
	['the match at the very start',         'One two three four five six seven eight nine ten eleven.',              [[0, 'One two three four five six seven eight nine ten eleven.', 11]]],
	['the match at the very end',           'Body.\n\nOne two three four five six seven eight nine ten eleven.',     [[7, 'One two three four five six seven eight nine ten eleven.', 11]]],
	['trailing blank lines are cut',        'Body.\n\nOne two three four five six seven eight nine ten eleven.\n  \n', [[7, 'One two three four five six seven eight nine ten eleven.', 11]]],
	['leading white space is cut',          '\tOne two three four five six seven eight nine ten eleven.',            [[1, 'One two three four five six seven eight nine ten eleven.', 11]]],
	['upper case',                          'ONE TWO THREE FOUR FIVE SIX SEVEN EIGHT NINE TEN ELEVEN.',              [[0, 'ONE TWO THREE FOUR FIVE SIX SEVEN EIGHT NINE TEN ELEVEN.', 11]]],
	['across a line break',                 'Body.\n\nOne two three four five six\nseven eight nine ten eleven.',    [[7, 'One two three four five six\nseven eight nine ten eleven.', 11]]],
	['punctuation next to the match',       'Body.\n\n- One two three four five six seven eight nine ten eleven!',   [[7, '- One two three four five six seven eight nine ten eleven!', 11]]],
	['two long paragraphs, the last one',   'One two three four five six seven eight nine ten eleven.\n\nTwelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two.', [[58, 'Twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two.', 11]]],
	['near miss, the long one is not last', 'One two three four five six seven eight nine ten eleven.\n\nFix it now.', []],
	['a hyphenated word counts once',       'One two three four five six seven eight nine e-mail.',                  []],
	['the limit option, at the limit',      'Fix it now.',                                                           [],                                                                                          { limit: 3 }],
	['the limit option, one past it',       'Fix the import now.',                                                   [[0, 'Fix the import now.', 4]],                                                              { limit: 3 }],
	['the limit option of zero',            'Go.',                                                                   [[0, 'Go.', 1]],                                                                             { limit: 0 }],

	// empty and tiny
	['spaces only',                         '   ',                                                                   []],
	['one letter',                          'a',                                                                     [[0, 'a', 1]],                                                                               { limit: 0 }],
	['one word, no punctuation',            'stop',                                                                  [[0, 'stop', 1]],                                                                            { limit: 0 }],
	['one word under the limit',            'stop',                                                                  []],

	// white space and Unicode
	['tabs between the words',              'Body.\n\nfix\tthe\timport now',                                         [[7, 'fix\tthe\timport now', 4]],                                                            { limit: 2 }],
	['CRLF between the paragraphs',         'A.\r\n\r\nFix the import now.',                                         [[6, 'Fix the import now.', 4]],                                                             { limit: 3 }],
	['a no-break space splits two words',   'Body.\n\nfix\u00a0it',                                                  [[7, 'fix\u00a0it', 2]],                                                                     { limit: 1 }],
	['accents',                             'Body.\n\nCaf\u00e9 ouvert d\u00e9j\u00e0 l\u00e0',                       [[7, 'Caf\u00e9 ouvert d\u00e9j\u00e0 l\u00e0', 4]],                                         { limit: 3 }],
	['Cyrillic',                            'Body.\n\n\u041f\u0440\u0438\u0432\u0435\u0442 \u043c\u0438\u0440 \u0441\u043d\u043e\u0432\u0430', [[7, '\u041f\u0440\u0438\u0432\u0435\u0442 \u043c\u0438\u0440 \u0441\u043d\u043e\u0432\u0430', 3]], { limit: 2 }],
	['CJK has no spaces, one word',         'Body.\n\n\u8fd9\u662f\u6bb5\u843d\u3002',                               [[7, '\u8fd9\u662f\u6bb5\u843d\u3002', 1]],                                                  { limit: 0 }],
	['an emoji is not a word',              'Body.\n\n\ud83d\ude80 \ud83d\ude80 ship',                               [[7, '\ud83d\ude80 \ud83d\ude80 ship', 1]],                                                  { limit: 0 }],

	// markdown leftovers
	['a heading line',                      'Body.\n\n## Cut the log',                                               [[7, '## Cut the log', 3]],                                                                  { limit: 2 }],
	['a dash list item',                    'Body.\n\n- item',                                                       [[7, '- item', 1]],                                                                          { limit: 0 }],
	['a numbered list item counts twice',   'Body.\n\n1. item',                                                      [[7, '1. item', 2]],                                                                         { limit: 0 }],
	['bold marks',                          'Body.\n\n**bold**',                                                     [[7, '**bold**', 1]],                                                                        { limit: 0 }],
	['backtick code',                       'Body.\n\n`npm test`',                                                   [[7, '`npm test`', 2]],                                                                      { limit: 0 }],
	['a markdown link is one word',         'Body.\n\n[text](https://x.test/a)',                                     [[7, '[text](https://x.test/a)', 1]],                                                        { limit: 0 }],
	['a table row',                         'Body.\n\n| a | b |',                                                    [[7, '| a | b |', 2]],                                                                       { limit: 0 }],
	['a block quote',                       'Body.\n\n> quote',                                                      [[7, '> quote', 1]],                                                                         { limit: 0 }],

	// code and URLs
	['code, paths, URLs, and slots',        'Body.\n\nrun_the_task camelCase C:\\Users\\me\\file.txt https://x.test/a a.b@x.test v1.2.3 9f3a1c0 ${slot} $HOME', [[7, 'run_the_task camelCase C:\\Users\\me\\file.txt https://x.test/a a.b@x.test v1.2.3 9f3a1c0 ${slot} $HOME', 9]], { limit: 0 }],

	// numbers and dates
	['numbers, prices, and dates',          'Body.\n\n1,000 50% $5 10:30 2026-09-04 9/4/2026 3rd',                   [[7, '1,000 50% $5 10:30 2026-09-04 9/4/2026 3rd', 7]],                                      { limit: 0 }],

	// punctuation
	['quotes, ellipsis, em dash, and ?!',   'Body.\n\n"Stop." ... \u2014 go?!',                                      [[7, '"Stop." ... \u2014 go?!', 2]],                                                          { limit: 0 }],
	['brackets around the words',           'Body.\n\n[Note] (see below)',                                           [[7, '[Note] (see below)', 3]],                                                               { limit: 2 }],

	// case
	['all capitals',                        'Body.\n\nREAD THE LOG',                                                 [[7, 'READ THE LOG', 3]],                                                                    { limit: 2 }],
	['title case',                          'Body.\n\nRead The Log',                                                 [[7, 'Read The Log', 3]],                                                                    { limit: 2 }],

	// contractions
	['contractions and possessives',        "Body.\n\nIt's isn't they're don't tool's James'",                       [[7, "It's isn't they're don't tool's James'", 6]],                                           { limit: 5 }],

	// traps: it looks like a word and it is not
	['runs with no letter or digit',        'Body.\n\n... \u2014 ** - | \ud83d\ude80 ### ok',                        [[7, '... \u2014 ** - | \ud83d\ude80 ### ok', 1]],                                            { limit: 0 }],
	['runs with a letter or digit count',   'Body.\n\n1. 3rd $5 50% C++ v1.2.3 ${slot}',                             [[7, '1. 3rd $5 50% C++ v1.2.3 ${slot}', 7]],                                                 { limit: 6 }],
	['a long paragraph that is not last',   `${long}\n\nFix it now.`,                                                []],

	// length extremes
	['exactly at the limit of three',       'Fix it now.',                                                           [],                                                                                          { limit: 3 }],
	['one word past the limit of three',    'Fix the import now.',                                                   [[0, 'Fix the import now.', 4]],                                                             { limit: 3 }],
	['a long last paragraph',               `Body.\n\n${long}`,                                                      [[7, long, 300]]],

	// options
	['the options are missing',             'One two three four five six seven eight nine ten eleven.',              [[0, 'One two three four five six seven eight nine ten eleven.', 11]],                        undefined],
	['the options are an empty object',     'One two three four five six seven eight nine ten eleven.',              [[0, 'One two three four five six seven eight nine ten eleven.', 11]],                        {}],
	['the limit is a string of three',      'Fix the import now.',                                                   [[0, 'Fix the import now.', 4]],                                                             { limit: '3' }],
]

for (const [name, text, matches, options] of cases) {
	test(name, () => {
		const found = maxWordsLastParagraph(text, options)
		assert.deepEqual(found.map(m => [m.index, m.text, m.count]), matches)
		for (const m of found) assert.equal(text.slice(m.index, m.index + m.length), m.text, 'length')
	})
}

const fields = [
	// text                                                       options        field      value
	['One two three four five six seven eight nine ten eleven.',  undefined,     'count',   11],
	['One two three four five six seven eight nine ten eleven.',  undefined,     'limit',   10],
	['Fix the import now.',                                       { limit: 3 },  'count',   4],
	['Fix the import now.',                                       { limit: 3 },  'limit',   3],
	['Body.\n\nOne two three four five six seven eight nine ten eleven.', undefined, 'context', 'Body.\n\nOne two three four five six seven eight nine ten eleven.'],
	['One two three four five six seven eight nine ten eleven.',  undefined,     'message', 'Cut the last paragraph to 10 words. It has 11.'],
	['Fix the import now.',                                       { limit: 3 },  'message', 'Cut the last paragraph to 3 words. It has 4.'],
	['Fix the import now.',                                       { limit: '3' }, 'limit',  3],
]

for (const [text, options, field, value] of fields) {
	test(`the match carries ${field}`, () => assert.deepEqual(maxWordsLastParagraph(text, options)[0][field], value))
}

// The whole output, every field but message
const outputs = [
	// text                                                                  matches                                                                                                                                                                                                                     options
	['The build fails.\n\nFix the import, then rerun the tests.',            []],
	['One two three four five six seven eight nine ten eleven.',             [{ index: 0, length: 56, text: 'One two three four five six seven eight nine ten eleven.', context: 'One two three four five six seven eight nine ten eleven.', count: 11, limit: 10 }]],
	['Body.\n\nOne two three four five six seven eight nine ten eleven.',    [{ index: 7, length: 56, text: 'One two three four five six seven eight nine ten eleven.', context: 'Body.\n\nOne two three four five six seven eight nine ten eleven.', count: 11, limit: 10 }]],
	['Fix it now.',                                                          [],                                                                                                                                                                                                                          { limit: 3 }],
	['Fix the import now.',                                                  [{ index: 0, length: 19, text: 'Fix the import now.', context: 'Fix the import now.', count: 4, limit: 3 }],                                                                                                                  { limit: 3 }],
	['Go.',                                                                  [{ index: 0, length: 3, text: 'Go.', context: 'Go.', count: 1, limit: 0 }],                                                                                                                                                   { limit: 0 }],
]

for (const [text, matches, options] of outputs) {
	test(`maxWordsLastParagraph output for ${JSON.stringify(text)}`, () => assert.deepEqual(maxWordsLastParagraph(text, options).map(({ message, ...m }) => m), matches))
}

// Every match of every row: the span is the text
test('the span of every match is the text', () => {
	for (const [name, text, , options] of cases) {
		for (const m of maxWordsLastParagraph(text, options)) assert.equal(text.slice(m.index, m.index + m.length), m.text, name)
	}
	for (const [text, , options] of outputs) {
		for (const m of maxWordsLastParagraph(text, options)) assert.equal(text.slice(m.index, m.index + m.length), m.text, JSON.stringify(text))
	}
})
