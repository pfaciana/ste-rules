import { test } from 'node:test'
import assert from 'node:assert/strict'
import { noWordyPhrases } from './noWordyPhrases.js'

// Each row: a name, a text, and what the rule flags. A flag is [position, words].
const cases = [
	// name                                  text                                               matches

	// the right way, then the wrong way
	['in order to, short form',              'Run the script to build it.',                     []],
	['in order to, wordy',                   'Run the script in order to build it.',            [[15, 'in order to']]],
	['the majority of, short form',          'Most users pass.',                                []],
	['the majority of, wordy',               'The majority of users pass.',                     [[0, 'The majority of']]],
	['at this point in time, short form',    'We stop now.',                                    []],
	['at this point in time, wordy',         'We stop at this point in time.',                  [[8, 'at this point in time']]],
	['is able to, short form',               'It can run.',                                     []],
	['is able to, wordy',                    'It is able to run.',                              [[3, 'is able to']]],
	['makes use of, short form',             'It uses a cache.',                                []],
	['makes use of, wordy',                  'It makes use of a cache.',                        [[3, 'makes use of']]],
	['a large number of, short form',        'Many tests fail.',                                []],
	['a large number of, wordy',             'A large number of tests fail.',                   [[0, 'A large number of']]],
	['upper case, short form',               'TO RUN IT.',                                      []],
	['upper case, wordy',                    'IN ORDER TO RUN IT.',                             [[0, 'IN ORDER TO']]],
	['line break, short form',               'Run it\nto test.',                                []],
	['line break, wordy',                    'Run it in order\nto test.',                       [[7, 'in order\nto']]],
	['two phrases, short form',              'To run it, most tests pass.',                     []],
	['two phrases, wordy',                   'In order to run it, the majority of tests pass.', [[0, 'In order to'], [20, 'the majority of']]],

	// not a wordy phrase
	['empty text',                           '',                                                []],
	['a comma breaks the phrase',            'In order, to start.',                             []],
	['a hyphen makes one word',              'The in-order-to case.',                           []],
	['a number means a numeric value',       'Pass a number of type int.',                      []],

	// known misses: wordy, but not in the list
	['in order for',                         'In order for it to run.',                         []],
	['a number of',                          'A number of users pass.',                         []],
]

for (const [name, text, matches] of cases) {
	test(name, () => {
		const found = noWordyPhrases(text)
		assert.deepEqual(found.map(m => [m.index, m.text]), matches)
		for (const m of found) {
			assert.equal(text.slice(m.index, m.index + m.length), m.text, 'length')
			assert.equal(m.message, `Use fewer words. Replace "${m.text}" with "${m.alternative}".`)
		}
	})
}
// The allow option drops the listed entries, case folded, and keeps the rest.
const allowed = [
	// text                                                allow              matches
	['Run it in order to build.',                          ['in order to'],   []],
	['Run it in order to build.',                          ['In Order To'],   []],
	['In order to run it, the majority of tests pass.',    ['in order to'],   [[20, 'the majority of']]],
	['Run it in order to build.',                          [],                [[7, 'in order to']]],
	['Run it in order to build.',                          null,              [[7, 'in order to']]],
]

for (const [text, allow, matches] of allowed) {
	test(`allow ${JSON.stringify(allow)} for "${text}"`, () => assert.deepEqual(noWordyPhrases(text, { allow }).map(m => [m.index, m.text]), matches))
}
