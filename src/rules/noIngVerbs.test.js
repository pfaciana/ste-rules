import { test } from 'node:test'
import assert from 'node:assert/strict'
import { noIngVerbs } from './noIngVerbs.js'

// Every match, exactly: [index, text, verb]. The span runs from the be-verb to the end of the -ing word.
const cases = [
	// name                                     text                                       matches
	['empty',                                   '',                                        []],
	['simple present',                          'The parser reads the file.',              []],
	['progressive after is',                    'The parser is reading the file.',         [[11, 'is reading', 'reading']]],
	['is interesting is an adjective',          'The result is interesting.',              []],
	["it's is a be-verb",                       "It's running.",                           [[0, "It's running", 'running']]],
	["they're and isn't",                       "They're testing. It isn't failing.",      [[0, "They're testing", 'testing'], [20, "isn't failing", 'failing']]],
	['a curly apostrophe',                      'It’s running.',                      [[0, 'It’s running', 'running']]],
	["a possessive is not a be-verb",           "The tool's running cost is high.",        []],
	['is missing, is pending, are working',     'The file is missing. The job is pending. The tests are working.', []],
	['is ongoing, is incoming, is underlying', 'The work is ongoing. The request is incoming. The cause is underlying.', []],
	['an adjective then a real progressive',    'It is missing. It is failing.',           [[18, 'is failing', 'failing']]],
	['am',                                      'I am waiting for the build.',             [[2, 'am waiting', 'waiting']]],
	['are',                                     'The tests are failing.',                  [[10, 'are failing', 'failing']]],
	['was',                                     'The parser was reading.',                 [[11, 'was reading', 'reading']]],
	['were',                                    'We were testing it.',                     [[3, 'were testing', 'testing']]],
	['be after a modal',                        'It must be waiting.',                     [[8, 'be waiting', 'waiting']]],
	['been',                                    'It has been failing.',                    [[7, 'been failing', 'failing']]],
	['being as the be-verb',                    'It being raining, we stayed inside.',     [[3, 'being raining', 'raining']]],
	['being is also an -ing noun',              'The file is being tested.',               []],
	['-ing noun: string',                       'The value is string.',                    []],
	['-ing noun: training',                     'Our focus is training.',                  []],
	['-ing noun: during',                       'It is during the test.',                  []],
	['no be-verb before the -ing word',         'Running the tests shows the bug.',        []],
	['a word between the be-verb and the verb', 'The parser is not reading the file.',     []],
	['under five letters',                      'It is ping.',                             []],
	['five letters is long enough',             'It is doing.',                            [[3, 'is doing', 'doing']]],
	['the -ing word is the first word',         'Reading helps.',                          []],
	['a be-verb at the very end',               'The parser is.',                          []],
	['a be-verb then a number',                 'It is 5 files.',                          []],
	['match at the very start',                 'Is reading the file the plan?',           [[0, 'Is reading', 'reading']]],
	['match at the very end',                   'We are waiting',                          [[3, 'are waiting', 'waiting']]],
	['upper case',                              'THE PARSER IS READING.',                  [[11, 'IS READING', 'READING']]],
	['across a line break',                     'The parser is\nreading the file.',        [[11, 'is\nreading', 'reading']]],
	['punctuation next to the match',           '(It is failing), so we stopped.',         [[4, 'is failing', 'failing']]],
	['a hyphenated -ing word is one word',      'The parser is re-reading the file.',      [[11, 'is re-reading', 're-reading']]],
	['no match across a sentence end',          'Tell me what it is. Reading helps.',      []],
	['two matches, exact places',               'It is failing and we are waiting.',       [[3, 'is failing', 'failing'], [21, 'are waiting', 'waiting']]],
	// empty and tiny
	['whitespace only',            '   \t\n  ',                            []],
	['one letter',                 'a',                                    []],
	['one word, no punctuation',   'running',                              []],
	['no punctuation at all',      'it is running',                        [[3, 'is running', 'running']]],
	// whitespace and Unicode
	['tabs around the match',      'It\tis\trunning.',                     [[3, 'is\trunning', 'running']]],
	['a CRLF line break',          'It is\r\nrunning.',                    [[3, 'is\r\nrunning', 'running']]],
	['a no-break space',           'It is\u00a0running.',                  [[3, 'is\u00a0running', 'running']]],
	['an accent before the match', 'The café is running.',                 [[9, 'is running', 'running']]],
	['Cyrillic before the match',  'Файл is running.',                     [[5, 'is running', 'running']]],
	['CJK and a full-width stop',  '文件 is running。',                       [[3, 'is running', 'running']]],
	['an emoji after the match',   'It is running 🚀.',                    [[3, 'is running', 'running']]],
	['an emoji stuck to the verb', 'It is running🚀',                      [[3, 'is running', 'running']]],
	// markdown leftovers
	['a heading',                  '## Title is running',                  [[9, 'is running', 'running']]],
	['a bullet item',              '- item is running',                    [[7, 'is running', 'running']]],
	['a numbered item',            '1. item is running',                   [[8, 'is running', 'running']]],
	['bold marks',                 '**bold** is running',                  [[9, 'is running', 'running']]],
	['backticks around the match', 'The code `is running` here.',          [[10, 'is running', 'running']]],
	['a link swallows the verb',   '[it is running](http://x.test)',       []],
	['a link before the match',    '[docs](x) is running.',                [[10, 'is running', 'running']]],
	['a table row',                '| a | is running |',                   [[6, 'is running', 'running']]],
	['a block quote',              '> It is running.',                     [[5, 'is running', 'running']]],
	// code and URLs
	['snake_case before the match', 'The read_file is running.',            [[14, 'is running', 'running']]],
	['camelCase is not a hit',     'The isRunning flag is set.',           []],
	['camelCase after the be-verb', 'It is renderingHTML now.',             []],
	['a file path',                'The path /var/log/app.log is growing.', [[26, 'is growing', 'growing']]],
	['a URL',                      'See https://x.test/a is running.',     [[21, 'is running', 'running']]],
	['an email',                   'Mail ann@x.test is running.',          [[16, 'is running', 'running']]],
	['a version number',           'Version v1.2.3 is running.',           [[15, 'is running', 'running']]],
	['a hash',                     'The hash 9f2c1ab is running.',         [[17, 'is running', 'running']]],
	['a template slot',            'The ${slot} is running.',              [[12, 'is running', 'running']]],
	['a shell variable',           'The $HOME is running.',                [[10, 'is running', 'running']]],
	// numbers and dates
	['a thousands comma',          'The count 1,000 is rising.',           [[16, 'is rising', 'rising']]],
	['a percent between the pair', 'It is 50% running.',                   []],
	['a dollar amount',            'The cost $5 is rising.',               [[12, 'is rising', 'rising']]],
	['a clock time',               'At 10:30 it is running.',              [[12, 'is running', 'running']]],
	['an ISO date',                'On 2026-09-04 it is running.',         [[17, 'is running', 'running']]],
	['a slashed date',             'On 9/4/2026 it is running.',           [[15, 'is running', 'running']]],
	['an ordinal',                 'The 3rd job is running.',              [[12, 'is running', 'running']]],
	// punctuation
	['quotes around the verb',     'It is "running".',                     [[3, 'is "running', 'running']]],
	['brackets around the verb',   'It is (running).',                     [[3, 'is (running', 'running']]],
	['an ellipsis after',          'It is running...',                     [[3, 'is running', 'running']]],
	['an em dash after',           'It is running — fast.',                [[3, 'is running', 'running']]],
	['a question and a bang',      'It is running?!',                      [[3, 'is running', 'running']]],
	['at the sentence start',      'Is running the plan?',                 [[0, 'Is running', 'running']]],
	['at the sentence end',        'The job is running',                   [[8, 'is running', 'running']]],
	['a dash between the pair',    'It is - running.',                     [[3, 'is - running', 'running']]],
	['a comma after the be-verb',  'It is, running.',                      []],
	['a colon after the be-verb',  'The plan is: running the tests.',      []],
	// case
	['ALL CAPS',                   'IT IS RUNNING.',                       [[3, 'IS RUNNING', 'RUNNING']]],
	['Title Case',                 'It Is Running.',                       [[3, 'Is Running', 'Running']]],
	['the verb capitalized',       'It is Running.',                       [[3, 'is Running', 'Running']]],
	// contractions
	["isn't",                      "It isn't running.",                    [[3, "isn't running", 'running']]],
	["they're",                    "They're running.",                     [[0, "They're running", 'running']]],
	["don't is not a be-verb",     "Don't stop; it is running.",           [[15, 'is running', 'running']]],
	['a possessive noun',          "The tool's running is slow.",          []],
	['a plural possessive',        "James' report is running.",            [[14, 'is running', 'running']]],
	// traps: looks like a hit, is not
	['bring is an -ing noun',      'It is bring.',                         []],
	['king is an -ing noun',       'It is a king.',                        []],
	['nothing is an -ing noun',    'It is nothing.',                       []],
	['everything is an -ing noun', 'It is everything.',                    []],
	['morning is an -ing noun',    'It is morning.',                       []],
	['lightning is an -ing noun',  'It is lightning.',                     []],
	['sing is an -ing noun',       'It is sing.',                          []],
	// traps: is a hit, looks innocent
	['fixing',                     'It is fixing.',                        [[3, 'is fixing', 'fixing']]],
	['parsing',                    'It is parsing.',                       [[3, 'is parsing', 'parsing']]],
	['loading',                    'It is loading.',                       [[3, 'is loading', 'loading']]],
	['merging',                    'It is merging.',                       [[3, 'is merging', 'merging']]],
	['deploying',                  'It is deploying.',                     [[3, 'is deploying', 'deploying']]],
	['two sentences, two matches', 'It is doing. It is failing.',          [[3, 'is doing', 'doing'], [16, 'is failing', 'failing']]],
	// length extremes
	['one under five letters',     'It is ping.',                          []],
	['exactly five letters',       'It is doing.',                         [[3, 'is doing', 'doing']]],
]

for (const [name, text, matches] of cases) {
	test(name, () => {
		const found = noIngVerbs(text)
		assert.deepEqual(found.map(m => [m.index, m.text, m.verb]), matches)
		for (const m of found) assert.equal(text.slice(m.index, m.index + m.length), m.text, 'length')
	})
}

const fields = [
	// text                                        field      value
	['The parser is reading the file.',            'be',      'is'],
	['The parser is reading the file.',            'verb',    'reading'],
	['It being raining, we stayed inside.',        'be',      'being'],
	['The parser is\nreading the file.',           'verb',    'reading'],
	['It rains. The parser is reading the file.',  'context', 'The parser is reading the file.'],
	['The parser is reading the file.',            'message', 'Use the simple form, not "is reading".'],
	['It is running🚀',                        'text',    'is running'],
	['It is "running".',                          'text',    'is "running'],
	["It isn't running.",                         'be',      "isn't"],
	['It Is Running.',                            'verb',    'Running'],
	['The code `is running` here.',               'context', 'The code `is running` here.'],
	['IT IS RUNNING.',                            'be',      'IS'],
	['It is - running.',                          'message', 'Use the simple form, not "is - running".'],
	['On 2026-09-04 it is running.',              'context', 'On 2026-09-04 it is running.'],
	['THE PARSER IS READING.',                     'message', 'Use the simple form, not "IS READING".'],
	['The parser is\nreading the file.',           'message', 'Use the simple form, not "is\nreading".'],
]

for (const [text, field, value] of fields) {
	test(`the match carries ${field}`, () => assert.deepEqual(noIngVerbs(text)[0][field], value))
}

// The whole output, every field but message
const outputs = [
	// text                                      matches
	['The parser reads the file.',                []],
	['The parser is reading the file.',           [{ index: 11, length: 10, text: 'is reading', context: 'The parser is reading the file.', be: 'is', verb: 'reading' }]],
	['It is doing.',                              [{ index: 3, length: 8, text: 'is doing', context: 'It is doing.', be: 'is', verb: 'doing' }]],
	['It being raining, we stayed inside.',       [{ index: 3, length: 13, text: 'being raining', context: 'It being raining, we stayed inside.', be: 'being', verb: 'raining' }]],
	['The parser is\nreading the file.',          [{ index: 11, length: 10, text: 'is\nreading', context: 'The parser is\nreading the file.', be: 'is', verb: 'reading' }]],
	['It is failing and we are waiting.',         [{ index: 3, length: 10, text: 'is failing', context: 'It is failing and we are waiting.', be: 'is', verb: 'failing' }, { index: 21, length: 11, text: 'are waiting', context: 'It is failing and we are waiting.', be: 'are', verb: 'waiting' }]],
	['It\tis\trunning.',                         [{ index: 3, length: 10, text: 'is\trunning', context: 'It\tis\trunning.', be: 'is', verb: 'running' }]],
	['The code `is running` here.',              [{ index: 10, length: 10, text: 'is running', context: 'The code `is running` here.', be: 'is', verb: 'running' }]],
	['1. item is running',                       [{ index: 8, length: 10, text: 'is running', context: '1. item is running', be: 'is', verb: 'running' }]],
	['It is running🚀',                        [{ index: 3, length: 10, text: 'is running', context: 'It is running🚀', be: 'is', verb: 'running' }]],
	['The ${slot} is running.',                  [{ index: 12, length: 10, text: 'is running', context: 'The ${slot} is running.', be: 'is', verb: 'running' }]],
	['On 2026-09-04 it is running.',             [{ index: 17, length: 10, text: 'is running', context: 'On 2026-09-04 it is running.', be: 'is', verb: 'running' }]],
	['It is "running".',                         [{ index: 3, length: 11, text: 'is "running', context: 'It is "running".', be: 'is', verb: 'running' }]],
	["James' report is running.",                [{ index: 14, length: 10, text: 'is running', context: "James' report is running.", be: 'is', verb: 'running' }]],
	['It is - running.',                         [{ index: 3, length: 12, text: 'is - running', context: 'It is - running.', be: 'is', verb: 'running' }]],
	['is running',                               [{ index: 0, length: 10, text: 'is running', context: 'is running', be: 'is', verb: 'running' }]],
	['It is doing. It is failing.',              [{ index: 3, length: 8, text: 'is doing', context: 'It is doing.', be: 'is', verb: 'doing' }, { index: 16, length: 10, text: 'is failing', context: 'It is failing.', be: 'is', verb: 'failing' }]],
	['It is ping.',                              []],
	['It is bring.',                             []],
]

for (const [text, matches] of outputs) {
	test(`noIngVerbs output for ${JSON.stringify(text)}`, () => assert.deepEqual(noIngVerbs(text).map(({ message, ...m }) => m), matches))
}

// Every match of every row above: the span points at its own text, and the message quotes that text.
for (const [name, text] of cases) {
	test(`${name}: the span and the message agree`, () => {
		for (const m of noIngVerbs(text)) {
			assert.equal(text.slice(m.index, m.index + m.length), m.text)
			assert.equal(m.message, `Use the simple form, not "${m.text}".`)
			assert.equal(typeof m.be, 'string')
			assert.equal(typeof m.verb, 'string')
		}
	})
}

for (const [text] of outputs) {
	test(`the span holds for ${JSON.stringify(text)}`, () => {
		for (const m of noIngVerbs(text)) assert.equal(text.slice(m.index, m.index + m.length), m.text)
	})
}

// length extremes
test('a long paragraph', () => {
	const text = 'The build ran. '.repeat(40) + 'It is running.'
	assert.deepEqual(noIngVerbs(text).map(m => [m.index, m.text]), [[603, 'is running']])
})

// options: the rule reads text only. A second argument is not a knob, so the rule must ignore it.
test('a second argument is ignored', () => {
	const expected = noIngVerbs('It is running.')
	for (const opt of [undefined, {}, 0, null, 'text', { max: 0 }, { max: 'x' }, []]) {
		assert.deepEqual(noIngVerbs('It is running.', opt), expected)
	}
})

test('input that is not a string is coerced', () => {
	assert.deepEqual(noIngVerbs(null), [])
	assert.deepEqual(noIngVerbs(undefined), [])
	assert.deepEqual(noIngVerbs(12345), [])
	assert.deepEqual(noIngVerbs(false), [])
})
