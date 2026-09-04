import { test } from 'node:test'
import assert from 'node:assert/strict'
import { oneInstruction } from './oneInstruction.js'
import { sentenceAt } from '../Sentences.js'

// Every match, exactly: [index, text, joiner]. One match per sentence, at the first joiner.
const cases = [
	// name                                   text                                          matches
	['empty',                                 '',                                           []],
	['one instruction',                       'Run the tests.',                             []],
	['and then',                              'Run the tests and then commit.',             [[14, 'and then', 'and then']]],
	['comma then',                            'Run the tests, then commit.',                [[13, ', then', ', then']]],
	['comma then, no space',                  'Run the tests,then commit.',                 [[13, ',then', ',then']]],
	['a condition, then a command, passes',   'If the test fails, then rerun it.',          []],
	['when, unless, once, after, before, while', 'When it fails, then stop. Unless it fails, then go. Once done, then stop. After that, then go. Before noon, then go. While it runs, then wait.', []],
	['a condition in capitals',               'IF IT FAILS, THEN STOP.',                    []],
	['a condition after a quote mark',        '"If it fails, then stop."',                  []],
	['a condition with and then still joins', 'If it fails, run it and then stop.',         [[20, 'and then', 'and then']]],
	['a condition word mid-sentence is no shield', 'Run it if it fails, then stop.',        [[18, ', then', ', then']]],
	['iffy is not if',                        'Iffy code, then stop.',                      [[9, ', then', ', then']]],
	['comma then, many spaces',               'Run it,   then stop.',                       [[6, ',   then', ',   then']]],
	['upper case',                            'RUN IT AND THEN STOP.',                      [[7, 'AND THEN', 'AND THEN']]],
	['capital after the comma',               'Run it, Then stop.',                         [[6, ', Then', ', Then']]],
	['at the very start',                     'And then stop.',                             [[0, 'And then', 'And then']]],
	['at the very end',                       'Do it, then',                                [[5, ', then', ', then']]],
	['across a line break',                   'Run it,\nthen stop.',                        [[6, ',\nthen', ',\nthen']]],
	['punctuation next to the match',         'Run it (and then) stop.',                    [[8, 'and then', 'and then']]],
	['two joined sentences, exact places',    'Run it and then stop. Build it, then ship.', [[7, 'and then', 'and then'], [30, ', then', ', then']]],
	['two paragraphs, exact places',          'Run it, then stop.\n\nBuild it and then ship.', [[6, ', then', ', then'], [29, 'and then', 'and then']]],
	['only the first joiner in a sentence',   'Run it and then stop, then go.',             [[7, 'and then', 'and then']]],
	['a question also joins',                 'Did you run it and then commit?',            [[15, 'and then', 'and then']]],
	['then at the sentence start is fine',    'Run the tests. Then commit.',                 []],
	['then with no comma is fine',            'Run the tests then commit.',                 []],
	['and with no then is fine',              'Run it and start.',                          []],
	['the join must not cross a sentence',    'Finish and. Then go.',                       []],
	['and inside a word is a near miss',      'The band then played.',                      []],
	['thenceforth after and is a near miss',  'Run it and thenceforth stop.',               []],
	['thenceforth after a comma is a miss',   'Run it, thenceforth stop.',                  []],
	['abbreviation keeps one sentence',       'Use JSON, e.g. a map, then stop.',           [[20, ', then', ', then']]],
	['designator keeps one sentence',         'See Fig. A, then stop.',                     [[10, ', then', ', then']]],
	['an initial keeps one sentence',         'Ask J. Smith, then stop.',                   [[12, ', then', ', then']]],
	['a decimal keeps one sentence',          'Wait 3.5 seconds, then stop.',               [[16, ', then', ', then']]],
	['a closer ends the sentence',            '(Run it, then stop.) Go home.',              [[7, ', then', ', then']]],
	// --- empty and tiny ---------------------------------------------------------------------------------------
	// name                                     text                                          matches
	['whitespace only',                       '   \t\n ',                                   []],
	['one letter',                            'a',                                          []],
	['one word',                              'Run',                                        []],
	['no punctuation at all',                 'Run it and then stop',                       [[7, 'and then', 'and then']]],

	// --- whitespace and Unicode -------------------------------------------------------------------------------
	['a tab after the comma',                 'Run it,\tthen stop.',                        [[6, ',\tthen', ',\tthen']]],
	['a CRLF after the comma',                'Run it,\r\nthen stop.',                      [[6, ',\r\nthen', ',\r\nthen']]],
	['a no-break space after the comma',      'Run it,\u00A0then stop.',                    [[6, ',\u00A0then', ',\u00A0then']]],
	['accents next to the match',             'Café ouvre, then ferme.',                    [[10, ', then', ', then']]],
	['Cyrillic next to the match',            'Запусти тест, then стоп.',                   [[12, ', then', ', then']]],
	['CJK next to the match',                 '運行測試, then 停止。',                        [[4, ', then', ', then']]],
	['an emoji before the match',             'Run it 🚀 and then stop.',                   [[10, 'and then', 'and then']]],

	// --- markdown leftovers -----------------------------------------------------------------------------------
	['a heading line',                        '## Run it and then stop.',                   [[10, 'and then', 'and then']]],
	['a bullet item',                         '- Run it, then stop.',                       [[8, ', then', ', then']]],
	['a bullet item with a condition',        '- If it fails, then stop.',                  []],
	['a numbered item',                       '1. Run it, then stop.',                      [[9, ', then', ', then']]],
	['bold marks around the sentence',        '**Run it, then stop.**',                     [[8, ', then', ', then']]],
	['backtick code in the sentence',         'Run `git add` and then commit.',             [[14, 'and then', 'and then']]],
	['a markdown link',                       '[Run it](https://x.com) and then stop.',     [[24, 'and then', 'and then']]],
	['a table row',                           '| a | Run it, then stop. |',                 [[12, ', then', ', then']]],
	['a block quote',                         '> Run it, then stop.',                       [[8, ', then', ', then']]],

	// --- code and URLs ----------------------------------------------------------------------------------------
	['snake_case and camelCase',              'Set snake_case and then camelCase.',         [[15, 'and then', 'and then']]],
	['a Windows path',                        'Open C:\\path\\file.txt, then close it.',    [[21, ', then', ', then']]],
	['an https URL',                          'Visit https://x.com/a and then stop.',       [[22, 'and then', 'and then']]],
	['an email address',                      'Email admin@x.com, then stop.',              [[17, ', then', ', then']]],
	['a version number',                      'Install v1.2.3 and then run it.',            [[15, 'and then', 'and then']]],
	['a slot and a variable',                 'Use ${slot} and then $HOME.',                [[12, 'and then', 'and then']]],
	['a commit hash',                         'Check 9f3a1c2 and then merge.',              [[14, 'and then', 'and then']]],

	// --- numbers and dates ------------------------------------------------------------------------------------
	['a grouped number',                      'Wait 1,000 ms, then stop.',                  [[13, ', then', ', then']]],
	['a percent',                             'Reach 50% and then stop.',                   [[10, 'and then', 'and then']]],
	['a price',                               'Pay $5, then leave.',                        [[6, ', then', ', then']]],
	['a clock time',                          'Wait until 10:30, then stop.',               [[16, ', then', ', then']]],
	['an ISO date',                           'Ship 2026-09-04, then rest.',                [[15, ', then', ', then']]],
	['a slashed date',                        'Ship 9/4/2026, then rest.',                  [[13, ', then', ', then']]],
	['an ordinal',                            'Take the 3rd seat, then wait.',              [[17, ', then', ', then']]],

	// --- punctuation ------------------------------------------------------------------------------------------
	['quotes around the sentence',            '"Run it, then stop."',                       [[7, ', then', ', then']]],
	['an ellipsis instead of a comma',        'Run it... then stop.',                       []],
	['an em dash instead of a comma',         'Run it — then stop.',                        []],
	['a question and an exclamation mark',    'Run it and then stop?!',                     [[7, 'and then', 'and then']]],

	// --- case -------------------------------------------------------------------------------------------------
	['title case',                            'Run It And Then Stop.',                      [[7, 'And Then', 'And Then']]],
	['capitals after the comma',              'Run it, THEN stop.',                         [[6, ', THEN', ', THEN']]],

	// --- contractions -----------------------------------------------------------------------------------------
	['it is contracted',                      "It's ready, then stop.",                     [[10, ', then', ', then']]],
	['do not contracted',                     "Don't run it and then stop.",                [[13, 'and then', 'and then']]],
	['they are contracted',                   "They're here, then go.",                     [[12, ', then', ', then']]],
	['a possessive with apostrophe s',        "The tool's ready, then stop.",               [[16, ', then', ', then']]],
	['a possessive with a bare apostrophe',   "James' file, then stop.",                    [[11, ', then', ', then']]],

	// --- traps: it looks like a hit and it is not ---------------------------------------------------------------
	['band then is not and then',             'The band then played on.',                   []],
	['thence after and is not then',          'Run it and thence stop.',                    []],
	['andThen is one word',                   'Use andThen in the code.',                   []],
	['and-then is hyphenated',                'Use and-then in the code.',                  []],
	['thenceforth after a comma',             'Run it, thenceforth stop.',                  []],
	['a full-width comma is not a comma',     'Run it，then stop.',                          []],

	// --- traps: it looks fine and it is a hit ------------------------------------------------------------------
	['a short pair of commands',              'Wait, then see.',                            [[4, ', then', ', then']]],
	['a joiner inside code marks',            'Use `a, then b` in the call.',               [[6, ', then', ', then']]],
	['a color change, not an instruction',    'The light is red, then blue.',               [[16, ', then', ', then']]],
	['a report of the past',                  'Sales rose, then fell.',                     [[10, ', then', ', then']]],
	['a story, not an instruction',           'He looked at me and then away.',             [[16, 'and then', 'and then']]],
	['a saying',                              'Trust it, then verify it.',                  [[8, ', then', ', then']]],
	['now and then holds the joiner',         'Now and then it fails.',                     [[4, 'and then', 'and then']]],

]

for (const [name, text, matches] of cases) {
	test(name, () => {
		const found = oneInstruction(text)
		assert.deepEqual(found.map(m => [m.index, m.text, m.joiner]), matches)
		for (const m of found) assert.equal(text.slice(m.index, m.index + m.length), m.text, 'length')
	})
}

const fields = [
	// text                                    field       value
	['Run the tests, then commit.',            'joiner',   ', then'],
	['Run the tests and then commit.',         'joiner',   'and then'],
	['Run it,\nthen stop.',                    'joiner',   ',\nthen'],
	['Open the file and then save it.',        'text',     'and then'],
	['Open the file, then save it.',           'text',     ', then'],
	['Run it and then stop. Go home.',         'context',  'Run it and then stop.'],
	['Run it, then stop.\n\nBuild it, then ship.', 'context', 'Run it, then stop.'],
	['Run the tests, then commit.',            'message',  'Write one instruction per sentence. Split at ", then".'],
	['Run the tests and then commit.',         'message',  'Write one instruction per sentence. Split at "and then".'],
	['RUN IT AND THEN STOP.',                  'message',  'Write one instruction per sentence. Split at "AND THEN".'],
	['Run the tests, then commit.',            'length',   6],
]

for (const [text, field, value] of fields) {
	test(`the match carries ${field} for "${text.replace(/\n/g, '\\n')}"`, () => assert.deepEqual(oneInstruction(text)[0][field], value))
}

// The whole output, every field but message
const outputs = [
	// text                                          matches
	['Run the tests. Then commit.',                  []],
	['Run the tests, then commit.',                  [{ index: 13, length: 6, text: ', then', context: 'Run the tests, then commit.', joiner: ', then' }]],
	['Run the tests and then commit.',               [{ index: 14, length: 8, text: 'and then', context: 'Run the tests and then commit.', joiner: 'and then' }]],
	['Run it,\nthen stop.',                          [{ index: 6, length: 6, text: ',\nthen', context: 'Run it,\nthen stop.', joiner: ',\nthen' }]],
	['Use JSON, e.g. a map, then stop.',             [{ index: 20, length: 6, text: ', then', context: 'Use JSON, e.g. a map, then stop.', joiner: ', then' }]],
	['RUN IT AND THEN STOP.',                        [{ index: 7, length: 8, text: 'AND THEN', context: 'RUN IT AND THEN STOP.', joiner: 'AND THEN' }]],
	['Run it, then stop.\n\nBuild it, then ship.',   [{ index: 6, length: 6, text: ', then', context: 'Run it, then stop.', joiner: ', then' }, { index: 28, length: 6, text: ', then', context: 'Build it, then ship.', joiner: ', then' }]],
]

for (const [text, matches] of outputs) {
	test(`oneInstruction output for ${JSON.stringify(text)}`, () => assert.deepEqual(oneInstruction(text).map(({ message, ...m }) => m), matches))
}

// Every match of every row above: every field, and the slice identity text.slice(index, index + length) === text.
for (const [name, text] of cases) {
	test(`every field is exact for "${name}"`, () => {
		for (const m of oneInstruction(text)) {
			assert.deepEqual(Object.keys(m).sort(), ['context', 'index', 'joiner', 'length', 'message', 'text'])
			assert.equal(text.slice(m.index, m.index + m.length), m.text, 'slice identity')
			assert.equal(m.length, m.text.length, 'length is the text length')
			assert.equal(m.joiner, m.text.trim(), 'the joiner is the trimmed text')
			assert.equal(m.message, `Write one instruction per sentence. Split at "${m.joiner}".`, 'message')
			assert.equal(m.context, sentenceAt(text, m.index), 'context is the sentence that holds the match')
		}
	})
}

// The rule takes text only. A second argument changes nothing. A non-string input is coerced to text.
const inputs = [
	// name                            input                         matches
	['null',                          null,                          []],
	['undefined',                     undefined,                     []],
	['a number',                      123,                           []],
	['a plain object',                {},                            []],
	['an array of one sentence',      ['Run it, then stop.'],        [[6, ', then', ', then']]],
]

for (const [name, input, matches] of inputs) {
	test(`the input is coerced to text: ${name}`, () => {
		assert.deepEqual(oneInstruction(input).map(m => [m.index, m.text, m.joiner]), matches)
	})
}

const options = [
	// name                            options
	['no options',                     undefined],
	['an empty options object',        {}],
	['a zero knob',                    { limit: 0 }],
	['a wrong type for a knob',        { limit: 'ten' }],
]

for (const [name, opts] of options) {
	test(`options change nothing: ${name}`, () => {
		assert.deepEqual(oneInstruction('Run the tests, then commit.', opts).map(m => [m.index, m.text]), [[13, ', then']])
	})
}

// Length extremes.
test('a sentence at the twenty word limit', () => {
	const text = 'Run the first test and then commit the second change to the main branch for the release today.'
	assert.deepEqual(oneInstruction(text).map(m => [m.index, m.text]), [[19, 'and then']])
})

test('a sentence one word over the limit', () => {
	const text = 'Run the first test and then commit the second change to the main branch for the release today now.'
	assert.deepEqual(oneInstruction(text).map(m => [m.index, m.text]), [[19, 'and then']])
})

test('a long paragraph of many joined sentences', () => {
	const one = 'Run it, then stop. '
	const found = oneInstruction(one.repeat(200))
	assert.equal(found.length, 200)
	assert.deepEqual(found[0], { index: 6, length: 6, text: ', then', context: 'Run it, then stop.', joiner: ', then', message: 'Write one instruction per sentence. Split at ", then".' })
	assert.equal(found[199].index, 199 * one.length + 6)
})
