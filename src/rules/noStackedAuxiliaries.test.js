import { test } from 'node:test'
import assert from 'node:assert/strict'
import { noStackedAuxiliaries } from './noStackedAuxiliaries.js'

// Every match, exactly: [index, text]. A stack is two or more auxiliaries in a row, whitespace only between them.
const cases = [
	// name                                  text                                      matches
	['empty',                                '',                                       []],
	['no auxiliary',                         'The team fixed the build.',              []],
	['one auxiliary',                        'The build will pass.',                   []],
	['one auxiliary at the end',             'The build will',                         []],
	['auxiliaries apart',                    'It has a bug and will fail.',            []],
	['two stacked',                          'The build will have passed.',            [[10, 'will have']]],
	['three stacked',                        'The build will have been passed.',       [[10, 'will have been']]],
	['four stacked',                         'It will have been being tested.',        [[3, 'will have been being']]],
	['at the very start',                    'Will have passed.',                      [[0, 'Will have']]],
	['at the very end',                      'The build will have',                    [[10, 'will have']]],
	['upper case',                           'IT WILL HAVE BEEN DONE.',                [[3, 'WILL HAVE BEEN']]],
	['across a line break',                  'It will\nhave passed.',                  [[3, 'will\nhave']]],
	['punctuation beside the match',         'The build (will have) passed.',          [[11, 'will have']]],
	['a comma breaks the stack',             'You may, might reply.',                  []],
	['a sentence end breaks the stack',      'That is what we do. Can you check?',     []],
	['hyphen keeps one word',                'It is a must-have feature.',             []],
	['contraction is not an auxiliary',      "It will've been done.",                  []],
	['two matches, exact places',            'It has been done. It should be done.',   [[3, 'has been'], [21, 'should be']]],
	['have then been',                       'They have been told.',                   [[5, 'have been']]],
	['has then been',                        'It has been done.',                      [[3, 'has been']]],
	['had then been',                        'It had been done.',                      [[3, 'had been']]],
	['been then being',                      'It has been being tested.',              [[3, 'has been being']]],
	['will be is the simple future, passes', 'The tests will be green.',               []],
	['can be passes',                        'This can be done in one line.',          []],
	['must be passes',                       'The token must be set first.',           []],
	['WILL BE in capitals passes',           'IT WILL BE DONE.',                       []],
	['should be is not approved',            'It should be safe.',                     [[3, 'should be']]],
	['could be is not approved',             'It could be slow.',                      [[3, 'could be']]],
	['will be then more is a stack',         'It will be being tested.',               [[3, 'will be being']]],
	['have been is the perfect, flagged',    'I have been busy.',                      [[2, 'have been']]],
	['would then have',                      'It would have helped.',                  [[3, 'would have']]],
	['shall then be',                        'It shall be done.',                      [[3, 'shall be']]],
	['should then have been',                'It should have been done.',              [[3, 'should have been']]],
	['may then be',                          'It may be done.',                        [[3, 'may be']]],
	['might then have been',                 'It might have been.',                    [[3, 'might have been']]],
	['could then be',                        'It could be done.',                      [[3, 'could be']]],
	['can then have is a stack',             'It can have passed.',                    [[3, 'can have']]],
	['must then have is a stack',            'It must have passed.',                   [[3, 'must have']]],
	['do then have',                         'They do have a plan.',                   [[5, 'do have']]],
	['does then have',                       'It does have merit.',                    [[3, 'does have']]],
	['did then have',                        'It did have merit.',                     [[3, 'did have']]],
	// empty and tiny
	['the user sent only spaces',            '   \t\n  ',                              []],
	['the user sent one letter',             'a',                                      []],
	['the user sent one word',               'been',                                   []],
	['the user sent no punctuation at all',  'It has been done',                       [[3, 'has been']]],
	// whitespace and Unicode
	['the agent used tabs',                  'It\thas\tbeen\tdone.',                   [[3, 'has\tbeen']]],
	['the agent used a CRLF line end',       'It has\r\nbeen done.',                   [[3, 'has\r\nbeen']]],
	['the agent used a no-break space',      'It has been done.',                    [[3, 'has been']]],
	['an accent before the match',           'Él has been busy.',                      [[3, 'has been']]],
	['Cyrillic before the match',            'Это has been done.',                     [[4, 'has been']]],
	['a CJK stop after the match',           'It has been done。',                     [[3, 'has been']]],
	['an emoji on the second auxiliary',     'It has been🎉 done.',                    [[3, 'has been']]],
	// markdown leftovers
	['the agent left a heading marker',      '## It has been done',                    [[6, 'has been']]],
	['the agent left a dash list marker',    '- It has been done',                     [[5, 'has been']]],
	['the agent left a number list marker',  '1. It has been done',                    [[6, 'has been']]],
	['the agent left bold marks',            '**has been**',                           [[2, 'has been']]],
	['the agent left backtick code marks',   '`has been`',                             [[1, 'has been']]],
	['the agent left a table row',           '| It has been done | ok |',              [[5, 'has been']]],
	['the agent left a block quote marker',  '> It has been done.',                    [[5, 'has been']]],
	['the stack sits inside a link target',  '[has been](https://x.test)',             []],
	// code and URLs
	['a snake_case name looks like a stack', 'The has_been flag is set.',              []],
	['a camelCase name looks like a stack',  'The hasBeen flag is set.',               []],
	['a file path before the match',         'The file /usr/bin has been moved.',      [[18, 'has been']]],
	['a URL before the match',               'https://x.test has been down.',          [[15, 'has been']]],
	['an email before the match',            'dev@example.test has been notified.',    [[17, 'has been']]],
	['a version number before the match',    'v1.2.3 has been released.',              [[7, 'has been']]],
	['a template slot before the match',     '${flag} has been set.',                  [[8, 'has been']]],
	['a shell variable before the match',    '$HOME has been set.',                    [[6, 'has been']]],
	// numbers and dates
	['a grouped number before the match',    '1,000 rows have been added.',            [[11, 'have been']]],
	['a percent before the match',           '50% has been done.',                     [[4, 'has been']]],
	['a price before the match',             '$5 has been paid.',                      [[3, 'has been']]],
	['a clock time before the match',        'At 10:30 it has been done.',             [[12, 'has been']]],
	['an ISO date before the match',         '2026-09-04 has been chosen.',            [[11, 'has been']]],
	['a slash date before the match',        'On 9/4/2026 it has been done.',          [[15, 'has been']]],
	['an ordinal before the match',          'The 3rd has been picked.',               [[8, 'has been']]],
	// punctuation
	['quotes around the match',              '"has been" is wrong.',                   [[1, 'has been']]],
	['an ellipsis after the match',          'It has been... done.',                   [[3, 'has been']]],
	['an em dash breaks the stack',          'It has — been done.',                    []],
	['a question and a bang after it',       'It will have?!',                         [[3, 'will have']]],
	// case
	['the agent wrote Title Case',           'It Has Been Done.',                      [[3, 'Has Been']]],
	['one auxiliary in capitals',            'It HAS been done.',                      [[3, 'HAS been']]],
	// contractions and possessives
	['it is, contracted, then been',         "It's been done.",                        []],
	['is not, contracted',                   "It isn't been done.",                    []],
	['they have, contracted',                "They've been told.",                     []],
	['do not, contracted, then a stack',     "We don't have been told.",               [[9, 'have been']]],
	['a possessive before the match',        "The tool's has been updated.",           [[11, 'has been']]],
	['a plural possessive before it',        "James' work has been done.",             [[12, 'has been']]],
	// traps: it looks like a hit and it is not
	['is is not on the auxiliary list',      'It is being tested.',                    []],
	['was is not on the auxiliary list',     'The build was being tested.',            []],
	['are is not on the auxiliary list',     'The tests are being run.',               []],
	['one auxiliary, then a noun',           'It has a plan.',                         []],
	['the stack is one hyphenated word',     'The have-been list is long.',            []],
	['a name that starts like will',         'Willem can pass the test.',              []],
	['two approved words joined',            'The canbe flag is wrong.',               []],
	// traps: it reads well and it is still a hit
	['the file has been moved',              'The file has been moved.',               [[9, 'has been']]],
	['it would be good',                     'It would be good.',                      [[3, 'would be']]],
	['you may have missed it',               'You may have missed it.',                [[4, 'may have']]],
	['we should be careful',                 'We should be careful.',                  [[3, 'should be']]],
	['it might be slow',                     'It might be slow.',                      [[3, 'might be']]],
	['it does do the job',                   'It does do the job.',                    [[3, 'does do']]],
	['do be careful',                        'Do be careful.',                         [[0, 'Do be']]],
	// length extremes
	['a long paragraph, one hit at the end', 'The team met on Monday and the team read the notes and the team agreed on a plan, then the build has been green.', [[97, 'has been']]],
]

for (const [name, text, matches] of cases) {
	test(name, () => {
		const found = noStackedAuxiliaries(text)
		assert.deepEqual(found.map(m => [m.index, m.text]), matches)
		for (const m of found) assert.equal(text.slice(m.index, m.index + m.length), m.text, 'length')
	})
}

const fields = [
	// text                                          field          value
	['It will have been done.',                      'auxiliaries', ['will', 'have', 'been']],
	['IT WILL HAVE BEEN DONE.',                      'auxiliaries', ['WILL', 'HAVE', 'BEEN']],
	['It will\nhave passed.',                        'auxiliaries', ['will', 'have']],
	['The build is fine. It will have been done.',   'context',     'It will have been done.'],
	['It has been done. It will be done.',           'context',     'It has been done.'],
	['It will have been done.',                      'message',     'Use one auxiliary, not "will have been".'],
	['IT WILL HAVE BEEN DONE.',                      'message',     'Use one auxiliary, not "WILL HAVE BEEN".'],
	['It will\nhave passed.',                        'message',     'Use one auxiliary, not "will have".'],
	['It will have been done.',                      'length',      14],
]

for (const [text, field, value] of fields) {
	test(`the match carries ${field}`, () => assert.deepEqual(noStackedAuxiliaries(text)[0][field], value))
}

// The whole output, every field but message
const outputs = [
	// text                                     matches
	['The team fixed the build.',               []],
	['It has been done.',                       [{ index: 3, length: 8, text: 'has been', context: 'It has been done.', auxiliaries: ['has', 'been'] }]],
	['The build will have been passed.',        [{ index: 10, length: 14, text: 'will have been', context: 'The build will have been passed.', auxiliaries: ['will', 'have', 'been'] }]],
	['It will\nhave passed.',                   [{ index: 3, length: 9, text: 'will\nhave', context: 'It will\nhave passed.', auxiliaries: ['will', 'have'] }]],
	['IT WILL HAVE BEEN DONE.',                 [{ index: 3, length: 14, text: 'WILL HAVE BEEN', context: 'IT WILL HAVE BEEN DONE.', auxiliaries: ['WILL', 'HAVE', 'BEEN'] }]],
	['It has been done. It will be done.',      [{ index: 3, length: 8, text: 'has been', context: 'It has been done.', auxiliaries: ['has', 'been'] }]],
]

for (const [text, matches] of outputs) {
	test(`noStackedAuxiliaries output for ${JSON.stringify(text)}`, () => assert.deepEqual(noStackedAuxiliaries(text).map(({ message, ...m }) => m), matches))
}

// Every match of every row, in full: the span, the extra keys, and the message built from them.
for (const [name, text] of cases) {
	test(`every field holds for "${name}"`, () => {
		for (const m of noStackedAuxiliaries(text)) {
			assert.equal(text.slice(m.index, m.index + m.length), m.text, 'slice')
			assert.equal(m.length, m.text.length, 'length')
			assert.ok(m.auxiliaries.length > 1, 'two auxiliaries or more')
			assert.ok(m.text.startsWith(m.auxiliaries[0]), 'the first auxiliary starts it')
			assert.ok(m.text.endsWith(m.auxiliaries[m.auxiliaries.length - 1]), 'the last auxiliary ends it')
			assert.equal(typeof m.context, 'string')
			assert.ok(m.context.length > 0, 'context')
			assert.equal(m.message, `Use one auxiliary, not "${m.auxiliaries.join(' ')}".`)
		}
	})
}

// The input the function gets is not always a string. The code coerces it.
const coercions = [
	// name                          input                     matches
	['no argument at all',           undefined,                []],
	['null',                         null,                     []],
	['a number',                     123,                      []],
	['an empty object',              {},                       []],
	['an empty array',               [],                       []],
	['an array of one string',       ['It has been done.'],     [[3, 'has been']]],
]

for (const [name, input, matches] of coercions) {
	test(`the input is ${name}`, () => assert.deepEqual(noStackedAuxiliaries(input).map(m => [m.index, m.text]), matches))
}

test('a second argument is ignored', () => assert.equal(noStackedAuxiliaries('It has been done.', {}).length, 1))
test('a zero option is ignored', () => assert.equal(noStackedAuxiliaries('It has been done.', { limit: 0 }).length, 1))
test('a wrong type for an option is ignored', () => assert.equal(noStackedAuxiliaries('It has been done.', 'nope').length, 1))
