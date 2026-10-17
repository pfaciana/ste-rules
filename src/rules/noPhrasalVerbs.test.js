import { test } from 'node:test'
import assert from 'node:assert/strict'
import { noPhrasalVerbs } from './noPhrasalVerbs.js'
import { phrasalVerbs } from '../data/phrasalVerbs.js'

// Every match, exactly: [index, text, first alternative]. The list is phrasalVerbs, one row per entry shape.
const cases = [
	// name                                   text                                        matches
	['empty',                                 '',                                         []],
	['plain verb only',                       'Install the tool.',                        []],
	['at the very start',                     'Carry out the test.',                      [[0, 'Carry out', 'do']]],
	['at the very end',                       'Now shut down',                            [[4, 'shut down', 'stop']]],
	['upper case',                            'CARRY OUT THE TEST.',                      [[0, 'CARRY OUT', 'do']]],
	['mixed case in the middle',              'We will Switch Off the power.',            [[8, 'Switch Off', 'stop']]],
	['two matches, exact places',             'Shut down, then switch off.',              [[0, 'Shut down', 'stop'], [16, 'switch off', 'stop']]],
	['across a line break',                   'Please carry\nout the test.',              [[7, 'carry\nout', 'do']]],
	['two spaces between the words',          'Please carry  out now.',                   [[7, 'carry  out', 'do']]],
	['punctuation next to the match',         'Do this (carry out), now.',                [[9, 'carry out', 'do']]],
	['punctuation between the words',         'Please carry, out the test.',              []],
	['a hyphen makes one word',               'Please carry-out the test.',               []],
	['near miss, longer words',               'The carrier outdid us.',                   []],
	['near miss, only the first word',        'Read this according.',                     []],
	['near miss, wrong inner word',           'It moves back or forth.',                  []],
	['three word entry',                      'Please reach out to us.',                  [[7, 'reach out to', 'speak to']]],
	['four word entry',                       'You have the capability to run it.',       [[4, 'have the capability to', 'can']]],
	['five word entry',                       'It failed due to the fact that we left.',  [[10, 'due to the fact that', 'because']]],
	['entry with an inner and',               'It moves back and forth.',                 [[9, 'back and forth', 'direction']]],
	['the longest entry wins',                'Take care of the unit.',                   [[0, 'Take care of', 'handle']]],
	['the short entry when the long one does not fit', 'Take care now.',                  [[0, 'Take care', 'make sure']]],
	['the short entry when the long one does not fit, 2', 'It failed due to us.',         [[10, 'due to', 'because of']]],
	['matches never overlap',                 'Top up to the line.',                      [[0, 'Top up', 'fill']]],
	['two sentences, exact places',           'First. Please carry out now.',             [[14, 'carry out', 'do']]],

	// --- empty and tiny ---
	// name                                   text                                        matches
	['whitespace only',                       '   \t\n  ',                                []],
	['one letter',                            'a',                                        []],
	['one word',                              'run',                                      []],
	['no punctuation at all',                 'please carry out now',                     [[7, 'carry out', 'do']]],

	// --- whitespace and Unicode ---
	['tabs between the words',                'Please\tcarry\tout now.',                  [[7, 'carry\tout', 'do']]],
	['a CRLF line break inside the match',    'Please carry\r\nout now.',                 [[7, 'carry\r\nout', 'do']]],
	['a no-break space inside the match',     'Please carry out now.',                    [[7, 'carry out', 'do']]],
	['an accented word before the match',     'Él will carry out.',                       [[8, 'carry out', 'do']]],
	['Cyrillic before the match',             'Текст: carry out now.',                    [[7, 'carry out', 'do']]],
	['CJK before the match',                  '日本語 shut down now.',                      [[4, 'shut down', 'stop']]],
	['an emoji in front of the match',        'We 🎉shut down now.',                      [[5, 'shut down', 'stop']]],
	['an emoji behind the match',             'We shut down🎉 now.',                      [[3, 'shut down', 'stop']]],

	// --- markdown leftovers ---
	['a heading line',                        '## Carry out the test.',                   [[3, 'Carry out', 'do']]],
	['a bullet line',                         '- shut down',                              [[2, 'shut down', 'stop']]],
	['a numbered list line',                  '1. Carry out now.',                        [[3, 'Carry out', 'do']]],
	['bold marks around the match',           '**shut down** now.',                       [[2, 'shut down', 'stop']]],
	['backtick code around the match',        'Run `shut down` now.',                     [[5, 'shut down', 'stop']]],
	['a link whose text is the match',        '[shut down](https://x.com) now.',          []],
	['a table row',                           '| shut down | top up |',                   [[2, 'shut down', 'stop'], [14, 'top up', 'fill']]],
	['a block quote line',                    '> Carry out the test.',                    [[2, 'Carry out', 'do']]],

	// --- code and URLs ---
	['snake_case',                            'Call shut_down now.',                      []],
	['camelCase',                             'Call shutDown now.',                       []],
	['a file path',                           'Open src/shut/down.js now.',               []],
	['an https URL',                          'See https://x.com/shut/down now.',         []],
	['an email address',                      'Mail shut@down.com now.',                  []],
	['a version number before the match',     'Ship v1.2.3, then shut down.',             [[18, 'shut down', 'stop']]],
	['a commit hash before the match',        'Commit a1b2c3d, then top up.',             [[21, 'top up', 'fill']]],
	['a template slot breaks the phrase',     'Set ${shut} down now.',                    []],
	['a shell variable before the match',     '$HOME must shut down.',                    [[11, 'shut down', 'stop']]],

	// --- numbers and dates ---
	['a thousands separator',                 '1,000 units shut down.',                   [[12, 'shut down', 'stop']]],
	['a percent',                             '50% of nodes shut down.',                  [[13, 'shut down', 'stop']]],
	['a dollar amount',                       '$5 is close to the limit.',                [[6, 'close to', 'near']]],
	['a clock time',                          'At 10:30 we shut down.',                   [[12, 'shut down', 'stop']]],
	['an ISO date',                           '2026-09-04 we shut down.',                 [[14, 'shut down', 'stop']]],
	['a slash date',                          '9/4/2026 we shut down.',                   [[12, 'shut down', 'stop']]],
	['an ordinal number',                     'The 3rd node shut down.',                  [[13, 'shut down', 'stop']]],

	// --- punctuation ---
	['double quotes around the match',        '"shut down" is banned.',                   [[1, 'shut down', 'stop']]],
	['brackets around the match',             '[top up] now.',                            [[1, 'top up', 'fill']]],
	['an ellipsis inside the match',          'We shut... down now.',                     []],
	['an ellipsis after the match',           'We shut down... now.',                     [[3, 'shut down', 'stop']]],
	['an em dash breaks the phrase',          'We shut — down now.',                      []],
	['a question mark and a bang',            'Did we shut down?! Yes.',                  [[7, 'shut down', 'stop']]],
	['a match at the start and the end',      'Shut down now, then top up',               [[0, 'Shut down', 'stop'], [20, 'top up', 'fill']]],

	// --- case ---
	['ALL CAPS',                              'SHUT DOWN THE SERVER.',                    [[0, 'SHUT DOWN', 'stop']]],
	['Title Case',                            'Shut Down The Server.',                    [[0, 'Shut Down', 'stop']]],
	['capitalized at a sentence start',       'First. Top up now.',                       [[7, 'Top up', 'fill']]],

	// --- contractions and possessives ---
	['a contraction before the match',        "It's time to shut down.",                  [[13, 'shut down', 'stop']]],
	['is not, short form',                    "It isn't shut down.",                      [[9, 'shut down', 'stop']]],
	['they are, short form',                  "They're going to top up.",                 [[17, 'top up', 'fill']]],
	['do not, short form',                    "Don't shut down.",                         [[6, 'shut down', 'stop']]],
	['a possessive before the match',         "The tool's shut down.",                    [[11, 'shut down', 'stop']]],
	['a plural possessive before the match',  "James' top up plan.",                      [[7, 'top up', 'fill']]],

	// --- traps: they look like a hit, they are not ---
	['shutdown is one word',                  'The shutdown was clean.',                  []],
	['topup is one word',                     'The topup form is new.',                   []],
	['a past tense form',                     'He carried out orders.',                   []],
	['turnover is one word',                  'Turnover was high.',                       []],
	['offset is not off',                     'Switch offset values.',                    []],
	['backup is not back',                    'The backup and forth.',                    []],
	['readout is one word',                   'Read the readout now.',                    []],
	['a hyphen makes one word, due-to',       'It failed due-to us.',                     []],

	// --- traps: they are a hit ---
	['turn on, plain English',                'The results turn on the data.',            [[12, 'turn on', 'set']]],
	['at least, plain English',               'At least three tests pass.',               [[0, 'At least', 'minimum']]],
	['close to, plain English',               'This is close to done.',                   [[8, 'close to', 'near']]],
	['have to, plain English',                'We have to go.',                           [[3, 'have to', 'necessary']]],
	['next to, plain English',                'Sit next to me.',                          [[4, 'next to', 'adjacent to']]],
	['no longer, plain English',              'It is no longer valid.',                   [[6, 'no longer', 'not at this time']]],
	['up to, plain English',                  'Count up to ten.',                         [[6, 'up to', 'until']]],
	['so that, plain English',                'Do it so that it works.',                  [[6, 'so that', 'until']]],
	['ought to is a phrasal verb too',        'You ought to stop.',                       [[4, 'ought to', 'must']]],
	['a four word entry',                     'Get in touch with us.',                    [[0, 'Get in touch with', 'speak to']]],
	['a four word entry at the start',        'Should it happen that we fail, stop.',     [[0, 'Should it happen that', 'if']]],
	['turn off, not turn on',                 'Turn off the light.',                      [[0, 'Turn off', 'set']]],
]

for (const [name, text, matches] of cases) {
	test(name, () => {
		const found = noPhrasalVerbs(text)
		assert.deepEqual(found.map(m => [m.index, m.text, m.alternatives[0]]), matches)
		for (const m of found) assert.equal(text.slice(m.index, m.index + m.length), m.text, 'length')
	})
}

const fields = [
	// text                                 field            value
	['Please carry out now.',               'alternatives',  phrasalVerbs['carry out']],
	['Please carry out now.',               'length',        9],
	['Take care of it.',                    'alternatives',  ['handle']],
	['First. Please carry out now.',        'context',       'Please carry out now.'],
	['It moves back\nand forth.',           'context',       'It moves back\nand forth.'],
	['carry out',                           'context',       'carry out'],
	['Take care of it.',                    'message',       'Use one plain verb. Replace "Take care of" with "handle".'],
	['It failed due to us.',                'message',       'Use one plain verb. Replace "due to" with "because of" or "because".'],
	['Carry out the test.',                 'message',       'Use one plain verb. Replace "Carry out" with "do" or "run" or "measure".'],
]

for (const [text, field, value] of fields) {
	test(`the match carries ${field} for "${text.replace(/\n/g, ' ')}"`, () => assert.deepEqual(noPhrasalVerbs(text)[0][field], value))
}

// The whole output, every field but message
const outputs = [
	// text                                          matches
	['The team fixed the build.',                    []],
	['Please carry out now.',                        [{ index: 7, length: 9, text: 'carry out', context: 'Please carry out now.', alternatives: ['do', 'run', 'measure'] }]],
	['Take care of it.',                             [{ index: 0, length: 12, text: 'Take care of', context: 'Take care of it.', alternatives: ['handle'] }]],
	['You have the capability to run it.',           [{ index: 4, length: 22, text: 'have the capability to', context: 'You have the capability to run it.', alternatives: ['can'] }]],
	['Please carry out now. It failed due to us.',   [{ index: 7, length: 9, text: 'carry out', context: 'Please carry out now.', alternatives: ['do', 'run', 'measure'] }, { index: 32, length: 6, text: 'due to', context: 'It failed due to us.', alternatives: ['because of', 'because'] }]],
	['We shut down🎉 now.',                          [{ index: 3, length: 9, text: 'shut down', context: 'We shut down🎉 now.', alternatives: ['stop'] }]],
	['**shut down** now.',                           [{ index: 2, length: 9, text: 'shut down', context: '**shut down** now.', alternatives: ['stop'] }]],
	['| shut down | top up |',                       [{ index: 2, length: 9, text: 'shut down', context: '| shut down | top up |', alternatives: ['stop'] }, { index: 14, length: 6, text: 'top up', context: '| shut down | top up |', alternatives: ['fill', 'add'] }]],
	['You ought to stop.',                           [{ index: 4, length: 8, text: 'ought to', context: 'You ought to stop.', alternatives: ['must'] }]],
]

for (const [text, matches] of outputs) {
	test(`noPhrasalVerbs output for ${JSON.stringify(text)}`, () => assert.deepEqual(noPhrasalVerbs(text).map(({ message, ...m }) => m), matches))
}

// Every other field of every match of every row: length, the slice, context, alternatives, message.
for (const [name, text] of cases) {
	test(`${name} — every other field`, () => {
		for (const m of noPhrasalVerbs(text)) {
			assert.equal(m.length, m.text.length, 'length')
			assert.equal(text.slice(m.index, m.index + m.length), m.text, 'slice')
			assert.equal(typeof m.context, 'string', 'context')
			assert.ok(m.context.includes(m.text), 'context holds the match')
			assert.ok(Array.isArray(m.alternatives) && m.alternatives.length > 0, 'alternatives')
			for (const a of m.alternatives) assert.equal(typeof a, 'string', 'alternative')
			assert.equal(m.message, `Use one plain verb. Replace "${m.text}" with "${m.alternatives.join('" or "')}".`, 'message')
		}
	})
}

// Every match of every row points at its own text.
test('the slice of every match is its text', () => {
	for (const [, text] of cases) {
		for (const m of noPhrasalVerbs(text)) assert.equal(text.slice(m.index, m.index + m.length), m.text)
	}
})

// Length extremes
test('a long paragraph returns every match', () => {
	const text = 'Please carry out the test. '.repeat(200)
	const found = noPhrasalVerbs(text)
	assert.ok(Array.isArray(found))
	assert.equal(found.length, 200)
	for (const m of found) assert.equal(text.slice(m.index, m.index + m.length), m.text)
})

// The function takes text only. It coerces anything else, and it ignores an extra argument.
const inputs = [
	// name                    input             matches
	['no argument',            undefined,        []],
	['null',                   null,             []],
	['a number',               123,              []],
	['an object',              {},               []],
	['an array of one string', ['Shut down.'],   [[0, 'Shut down', 'stop']]],
]

for (const [name, input, matches] of inputs) {
	test(`input: ${name}`, () => assert.deepEqual(noPhrasalVerbs(input).map(m => [m.index, m.text, m.alternatives[0]]), matches))
}

test('an extra options argument changes nothing', () => {
	const plain = noPhrasalVerbs('Please carry out now.')
	assert.deepEqual(noPhrasalVerbs('Please carry out now.', {}), plain)
	assert.deepEqual(noPhrasalVerbs('Please carry out now.', { max: 0 }), plain)
	assert.deepEqual(noPhrasalVerbs('Please carry out now.', 'wrong type'), plain)
})

// The allow option drops the listed entries, case folded, and keeps the rest.
const allowed = [
	// text                                allow            matches
	['Please shut down now.',              ['shut down'],   []],
	['Please shut down now.',              ['Shut Down'],   []],
	['Shut down, then switch off.',        ['shut down'],   [[16, 'switch off']]],
	['Please shut down now.',              [],              [[7, 'shut down']]],
	['Please shut down now.',              null,            [[7, 'shut down']]],
	['Please shut down now.',              'shut down',     [[7, 'shut down']]],
]

for (const [text, allow, matches] of allowed) {
	test(`allow ${JSON.stringify(allow)} for "${text}"`, () => assert.deepEqual(noPhrasalVerbs(text, { allow }).map(m => [m.index, m.text]), matches))
}
