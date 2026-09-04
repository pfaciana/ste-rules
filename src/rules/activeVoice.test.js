import { test } from 'node:test'
import assert from 'node:assert/strict'
import { activeVoice, passiveWithNamedAgent } from './activeVoice.js'

// Every match, exactly: [index, text, agent]. passiveWithNamedAgent is the subset with agent true.
const cases = [
	// name                              text                                          matches
	['active sentence',                  'The team fixed the build.',                  []],
	['passive, no agent',                'The file was deleted.',                      [[9, 'was deleted', false]]],
	['passive with an agent',            'The build was fixed by the team.',           [[10, 'was fixed', true]]],
	['adverb between',                   'The file was quickly deleted.',              [[9, 'was quickly deleted', false]]],
	["it's is a be-verb",                "It's done.",                                 [[0, "It's done", false]]],
	["isn't and wasn't",                 "It isn't fixed. It wasn't tested.",          [[3, "isn't fixed", false], [19, "wasn't tested", false]]],
	["they're and we're",                "They're tested. We're done.",                [[0, "They're tested", false], [16, "We're done", false]]],
	['a curly apostrophe',               'It’s done.',                            [[0, 'It’s done', false]]],
	["a contraction with an agent",      "It's fixed by Ann.",                         [[0, "It's fixed", true]]],
	['a question is not caught',         'Was it fixed?',                              []],
	['got is not a be-verb',             'It got fixed.',                              []],
	['only counts as an adverb',         'The file was only deleted.',                 [[9, 'was only deleted', false]]],
	['adverb then no participle',        'The file was quickly there.',                []],
	['am',                               'I am asked.',                                [[2, 'am asked', false]]],
	['is',                               'The report is written.',                     [[11, 'is written', false]]],
	['are',                              'The tests are run.',                         [[10, 'are run', false]]],
	['were',                             'The tests were run.',                        [[10, 'were run', false]]],
	['be after a modal',                 'The file must be deleted.',                  [[14, 'be deleted', false]]],
	['been',                             'The file has been deleted.',                 [[13, 'been deleted', false]]],
	['being',                            'It is being closed.',                        [[6, 'being closed', false]]],
	['irregular participle',             'The code was built.',                        [[9, 'was built', false]]],
	['-ed word on the exclusion list',   'The seeds are red.',                         []],
	['need is on the exclusion list',    'You are need of help.',                      []],
	['upper case',                       'THE FILE WAS DELETED.',                      [[9, 'WAS DELETED', false]]],
	['across a line break',              'The file was\ndeleted.',                     [[9, 'was\ndeleted', false]]],
	['be-verb at the end',               'It was.',                                    []],
	['be-verb then a number',            'It was 5.',                                  []],
	['by in the next sentence is no agent', 'It was fixed. By then we left.',          [[3, 'was fixed', false]]],
	['by a time is no agent',            'It was fixed by noon.',                      [[3, 'was fixed', false]]],
	['by a means is no agent',           'It was done by hand.',                       [[3, 'was done', false]]],
	['by a number is no agent',          'It was cut by 10%.',                         [[3, 'was cut', false]]],
	['by at the very end is no agent',   'It was fixed by.',                           [[3, 'was fixed', false]]],
	['by a name is an agent',            'It was fixed by Ann.',                       [[3, 'was fixed', true]]],
	['by a pronoun is an agent',         'It was fixed by them.',                      [[3, 'was fixed', true]]],
	['by an article is an agent',        'It was fixed by a script.',                  [[3, 'was fixed', true]]],
	['known miss: by a weekday reads as a name', 'It was fixed by Monday.',            [[3, 'was fixed', true]]],
	['two passives, exact places',       'It was built. It was tested by us.',         [[3, 'was built', false], [17, 'was tested', true]]],
	['empty',                            '',                                           []],
	// empty and tiny
	['whitespace only',                 '   \t\n  ',                             []],
	['one letter',                      'a',                                     []],
	['one word, no punctuation',        'deleted',                               []],
	['no punctuation at all',           'it was deleted',                        [[3, 'was deleted', false]]],
	// whitespace and Unicode
	['tabs around the match',           'It\twas\tdeleted.',                     [[3, 'was\tdeleted', false]]],
	['a CRLF line break',               'It was\r\ndeleted.',                    [[3, 'was\r\ndeleted', false]]],
	['a no-break space',                'It was\u00a0deleted.',                  [[3, 'was\u00a0deleted', false]]],
	['an accent before the match',      'The café was closed.',                  [[9, 'was closed', false]]],
	['Cyrillic before the match',       'Файл was deleted.',                     [[5, 'was deleted', false]]],
	['CJK and a full-width stop',       '文件 was deleted。',                       [[3, 'was deleted', false]]],
	['an emoji after the match',        'It was deleted 🚀.',                    [[3, 'was deleted', false]]],
	['an emoji stuck to the participle', 'It was deleted🚀',                      [[3, 'was deleted', false]]],
	// markdown leftovers
	['a heading',                       '## Title was deleted',                  [[9, 'was deleted', false]]],
	['a bullet item',                   '- item was deleted',                    [[7, 'was deleted', false]]],
	['a numbered item',                 '1. item was deleted',                   [[8, 'was deleted', false]]],
	['bold marks',                      '**bold** was deleted',                  [[9, 'was deleted', false]]],
	['backticks around the match',      'The code `was deleted` here.',          [[10, 'was deleted', false]]],
	['a link swallows the participle',  '[it was deleted](http://x.test)',       []],
	['a link before the match',         '[docs](x) was deleted.',                [[10, 'was deleted', false]]],
	['a table row',                     '| a | was deleted |',                   [[6, 'was deleted', false]]],
	['a block quote',                   '> It was deleted.',                     [[5, 'was deleted', false]]],
	// code and URLs
	['snake_case before the match',     'The read_file was deleted.',            [[14, 'was deleted', false]]],
	['camelCase is not a participle',   'The file was renamedTwice now.',        []],
	['camelCase before a real hit',     'The isDeleted flag is set.',            [[19, 'is set', false]]],
	['a file path',                     'The path /var/log/app.log was deleted.', [[26, 'was deleted', false]]],
	['a URL',                           'See https://x.test/a was deleted.',     [[21, 'was deleted', false]]],
	['an email',                        'Mail ann@x.test was deleted.',          [[16, 'was deleted', false]]],
	['a version number',                'Version v1.2.3 was released.',          [[15, 'was released', false]]],
	['a hash',                          'The hash 9f2c1ab was pushed.',          [[17, 'was pushed', false]]],
	['a template slot',                 'The ${slot} was replaced.',             [[12, 'was replaced', false]]],
	['a shell variable',                'The $HOME was deleted.',                [[10, 'was deleted', false]]],
	// numbers and dates
	['a thousands comma',               'The count 1,000 was reached.',          [[16, 'was reached', false]]],
	['by a percent is no agent',        'It was cut by 50%.',                    [[3, 'was cut', false]]],
	['a dollar amount',                 'The cost $5 was charged.',              [[12, 'was charged', false]]],
	['a clock time',                    'At 10:30 it was deleted.',              [[12, 'was deleted', false]]],
	['an ISO date',                     'On 2026-09-04 it was deleted.',         [[17, 'was deleted', false]]],
	['a slashed date',                  'On 9/4/2026 it was deleted.',           [[15, 'was deleted', false]]],
	['an ordinal',                      'The 3rd file was deleted.',             [[13, 'was deleted', false]]],
	// punctuation
	['quotes around the participle',    'It was "deleted".',                     [[3, 'was "deleted', false]]],
	['brackets around the participle',  'It was (deleted).',                     [[3, 'was (deleted', false]]],
	['an ellipsis after',               'It was deleted...',                     [[3, 'was deleted', false]]],
	['an em dash after',                'It was deleted — fast.',                [[3, 'was deleted', false]]],
	['a question and a bang',           'It was deleted?!',                      [[3, 'was deleted', false]]],
	['at the sentence start',           'Was deleted the plan?',                 [[0, 'Was deleted', false]]],
	['at the sentence end',             'The job was deleted',                   [[8, 'was deleted', false]]],
	// case
	['ALL CAPS',                        'IT WAS DELETED.',                       [[3, 'WAS DELETED', false]]],
	['Title Case',                      'It Was Deleted.',                       [[3, 'Was Deleted', false]]],
	['the participle capitalized',      'It was Deleted.',                       [[3, 'was Deleted', false]]],
	// contractions
	["don't is not a be-verb",          "Don't stop; it was deleted.",           [[15, 'was deleted', false]]],
	['a possessive noun',               "The tool's deleted files are gone.",    [[25, 'are gone', false]]],
	['a plural possessive',             "James' file was deleted.",              [[12, 'was deleted', false]]],
	// traps: looks like a hit, is not
	['indeed is on the exclusion list', 'We are indeed done.',                   []],
	['speed is on the exclusion list',  'The speed was high.',                   []],
	['sacred is on the exclusion list', 'It is sacred.',                         []],
	['shed is on the exclusion list',   'One hundred are shed.',                 []],
	['bled is on the exclusion list',   'The sled was bled.',                    []],
	['only with no word after it',      'The reply was only',                    []],
	// traps: is a hit, looks innocent
	['an adjective reads as passive',   'The door is closed.',                   [[9, 'is closed', false]]],
	['tired reads as passive',          'The team is tired.',                    [[9, 'is tired', false]]],
	['used reads as passive',           'It is used.',                           [[3, 'is used', false]]],
	['limited reads as passive',        'It is limited.',                        [[3, 'is limited', false]]],
	['gone is an irregular participle', 'Deleted files are gone.',               [[14, 'are gone', false]]],
	['set is an irregular participle',  'The isDeleted flag is set.',            [[19, 'is set', false]]],
	// agents
	['by a name and a pronoun',         'It was fixed by Ann and me.',           [[3, 'was fixed', true]]],
	['by my names an agent',            'It was fixed by my team.',              [[3, 'was fixed', true]]],
	['by someone names an agent',       'It was fixed by someone.',              [[3, 'was fixed', true]]],
	['by nobody names an agent',        'It was fixed by nobody.',               [[3, 'was fixed', true]]],
	['by a date is no agent',           'It was fixed by 2026-09-04.',           [[3, 'was fixed', false]]],
	['by a version is no agent',        'It was fixed by v1.2.3.',               [[3, 'was fixed', false]]],
	['known miss: by a hyphenated name', 'It was fixed by the-team.',             [[3, 'was fixed', false]]],
	['an adverb and an agent',          'It was quickly fixed by us.',           [[3, 'was quickly fixed', true]]],
	['by across a line break',          'It was fixed by\nAnn.',                 [[3, 'was fixed', true]]],
	// length extremes
	['two -ly adverbs are not caught',  'It was really really deleted.',         []],
	// the pair must sit in one sentence, like the guard in noIngVerbs
	['no match across a sentence end',  'It was. Deleted files are gone.',       [[22, 'are gone', false]]],
	['a fragment after a full stop',    'Ask what it was. Fixed later.',         []],
	['by after a full stop is no agent', 'It was fixed by. Ann left.',            [[3, 'was fixed', false]]],
]

for (const [name, text, matches] of cases) {
	test(name, () => {
		const found = activeVoice(text)
		assert.deepEqual(found.map(m => [m.index, m.text, m.agent]), matches)
		for (const m of found) assert.equal(text.slice(m.index, m.index + m.length), m.text, 'length')
		assert.deepEqual(passiveWithNamedAgent(text).map(m => m.text), matches.filter(m => m[2]).map(m => m[1]))
	})
}

const fields = [
	// rule                   text                                  field         value
	[activeVoice,             'The build was fixed by the team.',   'be',         'was'],
	[activeVoice,             'The build was fixed by the team.',   'participle', 'fixed'],
	[activeVoice,             'The file was quickly deleted.',      'participle', 'deleted'],
	[passiveWithNamedAgent,   'The build was fixed by the team.',   'be',         'was'],
	[passiveWithNamedAgent,   'The build was fixed by the team.',   'participle', 'fixed'],
	[activeVoice,             'It was built. It was tested by us.', 'context',    'It was built.'],
	[activeVoice,             'It was built. It was tested by us.', 'message',    'Use the active voice. Name who does the action, not "was built".'],
	[passiveWithNamedAgent,   'It was built. It was tested by us.', 'message',    'The agent is named, so use the active voice: not "was tested by".'],
	[activeVoice,             'It was "deleted".',                  'text',       'was "deleted'],
	[activeVoice,             'IT WAS DELETED.',                    'be',         'WAS'],
	[activeVoice,             'It was Deleted.',                    'participle', 'Deleted'],
	[activeVoice,             'The code `was deleted` here.',       'context',    'The code `was deleted` here.'],
	[activeVoice,             'The door is closed.',                'message',    'Use the active voice. Name who does the action, not "is closed".'],
	[passiveWithNamedAgent,   'It was quickly fixed by us.',        'text',       'was quickly fixed'],
	[passiveWithNamedAgent,   'It was fixed by my team.',           'message',    'The agent is named, so use the active voice: not "was fixed by".'],
]

for (const [rule, text, field, value] of fields) {
	test(`${rule.name} carries ${field}`, () => assert.deepEqual(rule(text)[0][field], value))
}

// The whole output, every field but message
const outputs = [
	// text                                     matches
	['The team fixed the build.',               []],
	['The file was deleted.',                   [{ index: 9, length: 11, text: 'was deleted', context: 'The file was deleted.', be: 'was', participle: 'deleted', agent: false }]],
	['The build was fixed by the team.',        [{ index: 10, length: 9, text: 'was fixed', context: 'The build was fixed by the team.', be: 'was', participle: 'fixed', agent: true }]],
	['The file was quickly deleted.',           [{ index: 9, length: 19, text: 'was quickly deleted', context: 'The file was quickly deleted.', be: 'was', participle: 'deleted', agent: false }]],
	['It was built. It was tested by us.',      [{ index: 3, length: 9, text: 'was built', context: 'It was built.', be: 'was', participle: 'built', agent: false }, { index: 17, length: 10, text: 'was tested', context: 'It was tested by us.', be: 'was', participle: 'tested', agent: true }]],
	['It\twas\tdeleted.',                       [{ index: 3, length: 11, text: 'was\tdeleted', context: 'It\twas\tdeleted.', be: 'was', participle: 'deleted', agent: false }]],
	['The code `was deleted` here.',            [{ index: 10, length: 11, text: 'was deleted', context: 'The code `was deleted` here.', be: 'was', participle: 'deleted', agent: false }]],
	['1. item was deleted',                     [{ index: 8, length: 11, text: 'was deleted', context: '1. item was deleted', be: 'was', participle: 'deleted', agent: false }]],
	['It was deleted🚀',                      [{ index: 3, length: 11, text: 'was deleted', context: 'It was deleted🚀', be: 'was', participle: 'deleted', agent: false }]],
	['The ${slot} was replaced.',               [{ index: 12, length: 12, text: 'was replaced', context: 'The ${slot} was replaced.', be: 'was', participle: 'replaced', agent: false }]],
	['It was "deleted".',                       [{ index: 3, length: 12, text: 'was "deleted', context: 'It was "deleted".', be: 'was', participle: 'deleted', agent: false }]],
	["James' file was deleted.",                [{ index: 12, length: 11, text: 'was deleted', context: "James' file was deleted.", be: 'was', participle: 'deleted', agent: false }]],
	['was deleted',                             [{ index: 0, length: 11, text: 'was deleted', context: 'was deleted', be: 'was', participle: 'deleted', agent: false }]],
	['It was quickly fixed by us.',             [{ index: 3, length: 17, text: 'was quickly fixed', context: 'It was quickly fixed by us.', be: 'was', participle: 'fixed', agent: true }]],
	['The seeds are red.',                      []],
	['It was cut by 50%.',                      [{ index: 3, length: 7, text: 'was cut', context: 'It was cut by 50%.', be: 'was', participle: 'cut', agent: false }]],
]

for (const [text, matches] of outputs) {
	test(`activeVoice output for ${JSON.stringify(text)}`, () => assert.deepEqual(activeVoice(text).map(({ message, ...m }) => m), matches))
}

const namedOutputs = [
	// text                                     matches
	['The file was deleted.',                   []],
	['The build was fixed by the team.',        [{ index: 10, length: 9, text: 'was fixed', context: 'The build was fixed by the team.', be: 'was', participle: 'fixed' }]],
	['It was built. It was tested by us.',      [{ index: 17, length: 10, text: 'was tested', context: 'It was tested by us.', be: 'was', participle: 'tested' }]],
	['It was quickly fixed by us.',             [{ index: 3, length: 17, text: 'was quickly fixed', context: 'It was quickly fixed by us.', be: 'was', participle: 'fixed' }]],
	['It was fixed by my team.',                [{ index: 3, length: 9, text: 'was fixed', context: 'It was fixed by my team.', be: 'was', participle: 'fixed' }]],
	['It was fixed by someone.',                [{ index: 3, length: 9, text: 'was fixed', context: 'It was fixed by someone.', be: 'was', participle: 'fixed' }]],
	['It was cut by 50%.',                      []],
	['It was fixed by. Ann left.',              []],
]

for (const [text, matches] of namedOutputs) {
	test(`passiveWithNamedAgent output for ${JSON.stringify(text)}`, () => assert.deepEqual(passiveWithNamedAgent(text).map(({ message, ...m }) => m), matches))
}

// Every match of every row above: the span points at its own text, and the message quotes that text.
for (const [name, text] of cases) {
	test(`${name}: the span and the message agree`, () => {
		for (const m of activeVoice(text)) {
			assert.equal(text.slice(m.index, m.index + m.length), m.text)
			assert.equal(m.message, `Use the active voice. Name who does the action, not "${m.text}".`)
			assert.equal(typeof m.be, 'string')
			assert.equal(typeof m.participle, 'string')
			assert.equal(typeof m.agent, 'boolean')
		}
		for (const m of passiveWithNamedAgent(text)) {
			assert.equal(text.slice(m.index, m.index + m.length), m.text)
			assert.equal(m.message, `The agent is named, so use the active voice: not "${m.text} by".`)
			assert.equal('agent' in m, false)
		}
	})
}

for (const [text] of [...outputs, ...namedOutputs]) {
	test(`the span holds for ${JSON.stringify(text)}`, () => {
		for (const m of activeVoice(text)) assert.equal(text.slice(m.index, m.index + m.length), m.text)
		for (const m of passiveWithNamedAgent(text)) assert.equal(text.slice(m.index, m.index + m.length), m.text)
	})
}

// length extremes
test('a long paragraph', () => {
	const text = 'The build ran. '.repeat(40) + 'It was deleted.'
	assert.deepEqual(activeVoice(text).map(m => [m.index, m.text]), [[603, 'was deleted']])
})

// options: both rules read text only. A second argument is not a knob, so the rules must ignore it.
test('a second argument is ignored', () => {
	const expected = activeVoice('It was fixed by us.')
	for (const opt of [undefined, {}, 0, null, 'text', { max: 0 }, { max: 'x' }, []]) {
		assert.deepEqual(activeVoice('It was fixed by us.', opt), expected)
		assert.equal(passiveWithNamedAgent('It was fixed by us.', opt).length, 1)
	}
})

test('input that is not a string is coerced', () => {
	assert.deepEqual(activeVoice(null), [])
	assert.deepEqual(activeVoice(undefined), [])
	assert.deepEqual(activeVoice(12345), [])
	assert.deepEqual(passiveWithNamedAgent(null), [])
	assert.deepEqual(passiveWithNamedAgent(false), [])
})
