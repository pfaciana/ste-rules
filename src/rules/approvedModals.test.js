import { test } from 'node:test'
import assert from 'node:assert/strict'
import { approvedModals } from './approvedModals.js'
import { modals } from '../data/modals.js'

// Every match, exactly: [index, text, modal]. modal is the list entry, always lower case.
const cases = [
	// name                                text                                          matches
	['empty',                              '',                                           []],
	['can, will, must are approved',       'You can run it. It will pass. You must go.', []],
	['may',                                'It may fail.',                               [[3, 'may', 'may']]],
	['May mid-sentence is the month',      'The release is on May 5.',                   []],
	['May with no number is the month too', 'In May we ship.',                           []],
	['May then a number at the start',     'May 5 is the date.',                         []],
	['May at the start is the modal',      'May I ask.',                                 [[0, 'May', 'may']]],
	['may lower case is never the month',  'It ships in may.',                           [[12, 'may', 'may']]],
	['might',                              'It might pass.',                             [[3, 'might', 'might']]],
	['should',                             'You should run it.',                         [[4, 'should', 'should']]],
	['could',                              'It could work.',                             [[3, 'could', 'could']]],
	['would',                              'It would work.',                             [[3, 'would', 'would']]],
	['shall',                              'It shall work.',                             [[3, 'shall', 'shall']]],
	['ought',                              'You ought to stop.',                         [[4, 'ought', 'ought']]],
	['upper case',                         'YOU SHOULD RUN IT.',                         [[4, 'SHOULD', 'should']]],
	['mixed case',                         'You Should run it.',                         [[4, 'Should', 'should']]],
	['at the very start',                  'May the build pass.',                        [[0, 'May', 'may']]],
	['at the very end',                    'Do what you should',                         [[12, 'should', 'should']]],
	['punctuation next to the match',      '"May" is banned.',                           [[1, 'May', 'may']]],
	['two matches, exact places',          'It may fail. It might pass.',                [[3, 'may', 'may'], [16, 'might', 'might']]],
	['a match after a line break',         'You may go.\nYou should stop.',              [[4, 'may', 'may'], [16, 'should', 'should']]],
	['a longer word that starts the same', 'The maybe list is short.',                   []],
	['a longer word that ends the same',   'He thought about it.',                       []],
	['a contraction is one word',          'You shouldn\'t run it.',                     []],
	['a hyphen keeps one word',            'The may-day drill ran.',                     []],
	['a period keeps one word',            'See may.be for details.',                    []],
	['all seven, exact places',            'may might should could would shall ought',   [[0, 'may', 'may'], [4, 'might', 'might'], [10, 'should', 'should'], [17, 'could', 'could'], [23, 'would', 'would'], [29, 'shall', 'shall'], [35, 'ought', 'ought']]],

	// --- empty and tiny ---
	// name                                text                                          matches
	['whitespace only',                    '   \t\n  ',                                  []],
	['one letter',                         'a',                                          []],
	['one word, no punctuation at all',    'should',                                     [[0, 'should', 'should']]],
	['a sentence with no punctuation',     'you should run it',                          [[4, 'should', 'should']]],

	// --- whitespace and Unicode ---
	['tabs between the words',             'You\tshould\trun.',                          [[4, 'should', 'should']]],
	['a CRLF line break',                  'You may go.\r\nYou should stop.',            [[4, 'may', 'may'], [17, 'should', 'should']]],
	['a no-break space before the match',  'You should run.',                       [[4, 'should', 'should']]],
	['an accented word before the match',  'Él may fail.',                               [[3, 'may', 'may']]],
	['Cyrillic before the match',          'Текст may fail.',                            [[6, 'may', 'may']]],
	['CJK before the match',               '日本語 may fail.',                            [[4, 'may', 'may']]],
	['an emoji in front of the match',     'It 🎉may fail.',                             [[5, 'may', 'may']]],
	['an emoji behind the match',          'It may🎉 fail.',                             [[3, 'may', 'may']]],

	// --- markdown leftovers ---
	['a heading line',                     '## Title may fail',                          [[9, 'may', 'may']]],
	['a bullet line',                      '- It might pass.',                           [[5, 'might', 'might']]],
	['a numbered list line',               '1. It should pass.',                         [[6, 'should', 'should']]],
	['bold text before the match',         '**bold** may fail.',                         [[9, 'may', 'may']]],
	['bold marks around the match',        '**may** is banned.',                         [[2, 'may', 'may']]],
	['backtick code around the match',     'Use `may` in code.',                         [[5, 'may', 'may']]],
	['a link before the match',            '[the doc](https://x.com) may fail.',         [[25, 'may', 'may']]],
	['a link whose text is the match',     '[should](https://x.com) is here.',           []],
	['a table row',                        '| may | might |',                            [[2, 'may', 'may'], [8, 'might', 'might']]],
	['a block quote line',                 '> You should stop.',                         [[6, 'should', 'should']]],

	// --- code and URLs ---
	['snake_case',                         'The may_be flag is set.',                    []],
	['camelCase',                          'The mayFail flag is set.',                   []],
	['a file path',                        'Open src/may/index.js now.',                 []],
	['an https URL',                       'See https://x.com/should now.',              []],
	['an email address',                   'Mail may@x.com now.',                        []],
	['a version number before the match',  'Ship v1.2.3 and it should pass.',            [[19, 'should', 'should']]],
	['a commit hash before the match',     'Commit a1b2c3d may fail.',                   [[15, 'may', 'may']]],
	['a template slot holds the match',    'Set ${may} now.',                            [[6, 'may', 'may']]],
	['a shell variable before the match',  '$HOME should exist.',                        [[6, 'should', 'should']]],

	// --- numbers and dates ---
	['a thousands separator',              '1,000 items may fail.',                      [[12, 'may', 'may']]],
	['a percent',                          '50% of tests should pass.',                  [[13, 'should', 'should']]],
	['a dollar amount',                    '$5 may be enough.',                          [[3, 'may', 'may']]],
	['a clock time',                       'At 10:30 it should run.',                    [[12, 'should', 'should']]],
	['an ISO date',                        '2026-09-04 may be late.',                    [[11, 'may', 'may']]],
	['a slash date',                       '9/4/2026 should work.',                      [[9, 'should', 'should']]],
	['an ordinal number',                  'The 3rd may fail.',                          [[8, 'may', 'may']]],
	['a full date with the month May',     'On May 5, 2026 we ship.',                    []],

	// --- punctuation ---
	['single quotes around the match',     "'should' is banned.",                        [[1, 'should', 'should']]],
	['brackets around the match',          '[may] is here.',                             [[1, 'may', 'may']]],
	['an ellipsis after the match',        'It may... fail.',                            [[3, 'may', 'may']]],
	['em dashes around the match',         'It — should — stop.',                        [[5, 'should', 'should']]],
	['a question mark and a bang',         'Should it pass?! It may.',                   [[0, 'Should', 'should'], [20, 'may', 'may']]],
	['a match at the start and the end',   'Should we go? Do what you would',            [[0, 'Should', 'should'], [26, 'would', 'would']]],
	['a bracket at the sentence start',    '(Should we go?)',                            [[1, 'Should', 'should']]],
	['a comma right after the match',      'You may, in fact, go.',                      [[4, 'may', 'may']]],
	['a period right after the match',     'Do what you should.',                        [[12, 'should', 'should']]],

	// --- case ---
	['ALL CAPS MAY is not the month',      'IT MAY FAIL.',                               [[3, 'MAY', 'may']]],
	['Title Case at the sentence start',   'Might it fail?',                             [[0, 'Might', 'might']]],
	['Title Case in a heading',            'Why You Should Stop',                        [[8, 'Should', 'should']]],

	// --- contractions and possessives ---
	['a contraction before the match',     "It's may or must.",                          [[5, 'may', 'may']]],
	['a negative contraction is one word', "It couldn't work.",                          []],
	['they are, short form',               "They're right, it might fail.",              [[18, 'might', 'might']]],
	['a possessive before the match',      "The tool's may flag.",                       [[11, 'may', 'may']]],
	['a plural possessive before it',      "James' should list.",                        [[7, 'should', 'should']]],
	['do not, short form, then the match', "Don't. You may go.",                         [[11, 'may', 'may']]],

	// --- traps: they look like a hit, they are not ---
	['mayor is not may',                   'The mayor spoke.',                           []],
	['shoulder is not should',             'The shoulder is broken.',                    []],
	['mayonnaise is not may',              'Add mayonnaise now.',                        []],
	['shallow is not shall',               'The water is shallow.',                      []],
	['mightily is not might',              'He worked mightily.',                        []],
	['shalom is not shall',                'Say shalom now.',                            []],
	['a slash joins two modals into one',  'Use may/might here.',                        []],
	['an em dash with no spaces joins it', 'It may—fail.',                               []],

	// --- traps: they are a hit ---
	['May as a first name',                'May Smith wrote it.',                        [[0, 'May', 'may']]],
	['May at the end is the month',        'We ship in May.',                            []],
	['a modal inside quotes and a bang',   'He said "might"!',                           [[9, 'might', 'might']]],
	['a modal after a colon',              'Rule: you should stop.',                     [[10, 'should', 'should']]],
	['a modal inside a parenthesis',       'Run it (you could wait).',                   [[12, 'could', 'could']]],
	['a modal after a semicolon',          'Run it; you would wait.',                    [[12, 'would', 'would']]],
]

for (const [name, text, matches] of cases) {
	test(name, () => {
		const found = approvedModals(text)
		assert.deepEqual(found.map(m => [m.index, m.text, m.modal]), matches)
		for (const m of found) assert.equal(text.slice(m.index, m.index + m.length), m.text, 'length')
	})
}

const fields = [
	// text                              field           value
	['It may fail.',                     'alternatives', ['can']],
	['It might pass.',                   'alternatives', ['can']],
	['You should run it.',               'alternatives', ['must']],
	['It could work.',                   'alternatives', ['can']],
	['It would work.',                   'alternatives', ['will']],
	['It shall work.',                   'alternatives', ['will']],
	['You ought to stop.',               'alternatives', ['must']],
	['You Should run it.',               'modal',        'should'],
	['It is fine. You should run it.',   'context',      'You should run it.'],
	['You may go.\nYou should stop.',    'context',      'You may go.'],
	['You should run it.',               'message',      'Use only can, will, or must. Replace "should" with "must".'],
	['You Should run it.',               'message',      'Use only can, will, or must. Replace "Should" with "must".'],
	['It may fail.',                     'message',      'Use only can, will, or must. Replace "may" with "can".'],
	['It would work.',                   'message',      'Use only can, will, or must. Replace "would" with "will".'],
]

for (const [text, field, value] of fields) {
	test(`the match carries ${field} for ${JSON.stringify(text)}`, () => assert.deepEqual(approvedModals(text)[0][field], value))
}

// The whole output, every field but message
const outputs = [
	// text                                       matches
	['You can run it. It will pass.',             []],
	['It may fail.',                              [{ index: 3, length: 3, text: 'may', context: 'It may fail.', modal: 'may', alternatives: ['can'] }]],
	['You Should run it.',                        [{ index: 4, length: 6, text: 'Should', context: 'You Should run it.', modal: 'should', alternatives: ['must'] }]],
	['It is fine. You should run it.',            [{ index: 16, length: 6, text: 'should', context: 'You should run it.', modal: 'should', alternatives: ['must'] }]],
	['It may fail. It might pass.',               [{ index: 3, length: 3, text: 'may', context: 'It may fail.', modal: 'may', alternatives: ['can'] }, { index: 16, length: 5, text: 'might', context: 'It might pass.', modal: 'might', alternatives: ['can'] }]],
	['You may go.\nYou should stop.',             [{ index: 4, length: 3, text: 'may', context: 'You may go.', modal: 'may', alternatives: ['can'] }, { index: 16, length: 6, text: 'should', context: 'You should stop.', modal: 'should', alternatives: ['must'] }]],
	['It 🎉may fail.',                            [{ index: 5, length: 3, text: 'may', context: 'It 🎉may fail.', modal: 'may', alternatives: ['can'] }]],
	['**may** is banned.',                        [{ index: 2, length: 3, text: 'may', context: '**may** is banned.', modal: 'may', alternatives: ['can'] }]],
	['1. It should pass.',                        [{ index: 6, length: 6, text: 'should', context: '1. It should pass.', modal: 'should', alternatives: ['must'] }]],
	['You may go.\r\nYou should stop.',           [{ index: 4, length: 3, text: 'may', context: 'You may go.', modal: 'may', alternatives: ['can'] }, { index: 17, length: 6, text: 'should', context: 'You should stop.', modal: 'should', alternatives: ['must'] }]],
]

for (const [text, matches] of outputs) {
	test(`approvedModals output for ${JSON.stringify(text)}`, () => assert.deepEqual(approvedModals(text).map(({ message, ...m }) => m), matches))
}

// Every other field of every match of every row: length, the slice, modal, context, alternatives, message.
for (const [name, text] of cases) {
	test(`${name} — every other field`, () => {
		for (const m of approvedModals(text)) {
			assert.equal(m.length, m.text.length, 'length')
			assert.equal(text.slice(m.index, m.index + m.length), m.text, 'slice')
			assert.equal(m.modal, m.text.toLowerCase(), 'modal')
			assert.equal(typeof m.context, 'string', 'context')
			assert.ok(m.context.includes(m.text), 'context holds the match')
			assert.deepEqual(m.alternatives, [modals[m.modal]], 'alternatives')
			assert.equal(m.message, `Use only can, will, or must. Replace "${m.text}" with "${m.alternatives[0]}".`, 'message')
		}
	})
}

// Every match of every row points at its own text.
test('the slice of every match is its text', () => {
	for (const [, text] of cases) {
		for (const m of approvedModals(text)) assert.equal(text.slice(m.index, m.index + m.length), m.text)
	}
})

// Length extremes
test('a long paragraph returns every match', () => {
	const text = 'The team should ship the build. '.repeat(200)
	const found = approvedModals(text)
	assert.ok(Array.isArray(found))
	assert.equal(found.length, 200)
	for (const m of found) assert.equal(text.slice(m.index, m.index + m.length), m.text)
})

// The function takes text only. It coerces anything else, and it ignores an extra argument.
const inputs = [
	// name                    input        matches
	['no argument',            undefined,   []],
	['null',                   null,        []],
	['a number',               123,         []],
	['an object',              {},          []],
	['an array of one string', ['It may.'], [[3, 'may', 'may']]],
]

for (const [name, input, matches] of inputs) {
	test(`input: ${name}`, () => assert.deepEqual(approvedModals(input).map(m => [m.index, m.text, m.modal]), matches))
}

test('an extra options argument changes nothing', () => {
	const plain = approvedModals('It may fail.')
	assert.deepEqual(approvedModals('It may fail.', {}), plain)
	assert.deepEqual(approvedModals('It may fail.', { max: 0 }), plain)
	assert.deepEqual(approvedModals('It may fail.', 'wrong type'), plain)
})
