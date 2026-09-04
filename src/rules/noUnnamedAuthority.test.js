import { test } from 'node:test'
import assert from 'node:assert/strict'
import { noUnnamedAuthority } from './noUnnamedAuthority.js'

// Every match, exactly: [index, text]. The phrase field always equals the matched text.
const cases = [
	// name                                  text                                            matches
	['empty',                                '',                                             []],
	['a named source',                       'The CommonMark spec says a tab is 4 columns.',  []],
	['near miss, singular expert',           'The expert says tabs are bad.',                []],
	['near miss, the phrase needs that',     'It can be argued tabs are bad.',               []],
	['not a whole word',                     'Nonexperts sayings are cheap.',                []],
	['punctuation inside the phrase',        'Experts, say so.',                             []],
	['at the very start',                    'Experts say so.',                              [[0, 'Experts say']]],
	['at the very end',                      'Tabs are bad, everyone knows',                 [[14, 'everyone knows']]],
	['upper case',                           'EXPERTS SAY TABS ARE BAD.',                    [[0, 'EXPERTS SAY']]],
	['across a line break',                  'Experts\nsay tabs are bad.',                   [[0, 'Experts\nsay']]],
	['extra spaces between the words',       'It is  possible  that tabs are bad.',          [[0, 'It is  possible  that']]],
	['punctuation next to the match',        '(Experts say) so.',                            [[1, 'Experts say']]],
	['in the middle of a sentence',          'Also, studies show tabs are bad.',             [[6, 'studies show']]],
	['the longest entry wins',               'As everyone knows, tabs are bad.',             [[0, 'As everyone knows']]],
	['two matches, exact places',            'Experts say so. Research shows it.',           [[0, 'Experts say'], [16, 'Research shows']]],
	['matches never overlap',                'Experts say experts agree.',                   [[0, 'Experts say'], [12, 'experts agree']]],
	// one row per family of the authority list
	['it can be argued that',                'It can be argued that tabs are bad.',          [[0, 'It can be argued that']]],
	['it can be noted that',                 'It can be noted that tabs are bad.',           [[0, 'It can be noted that']]],
	['it could be said that',                'It could be said that tabs are bad.',          [[0, 'It could be said that']]],
	['it may be assumed that',               'It may be assumed that tabs are bad.',         [[0, 'It may be assumed that']]],
	['it may be seen that',                  'It may be seen that tabs are bad.',            [[0, 'It may be seen that']]],
	['it might be shown that',               'It might be shown that tabs are bad.',         [[0, 'It might be shown that']]],
	['it is possible that',                  'It is possible that tabs are bad.',            [[0, 'It is possible that']]],
	['there is a possibility that',          'There is a possibility that tabs are bad.',     [[0, 'There is a possibility that']]],
	['experts say',                          'Experts say tabs are bad.',                    [[0, 'Experts say']]],
	['experts agree',                        'Experts agree tabs are bad.',                  [[0, 'Experts agree']]],
	['studies show',                         'Studies show tabs are bad.',                   [[0, 'Studies show']]],
	['research shows',                       'Research shows tabs are bad.',                 [[0, 'Research shows']]],
	['it is known',                          'It is known that tabs are bad.',               [[0, 'It is known']]],
	['it is said',                           'It is said that tabs are bad.',                [[0, 'It is said']]],
	['it is recommended',                    'It is recommended to use spaces.',             [[0, 'It is recommended']]],
	['it is generally accepted',             'It is generally accepted that tabs are bad.',  [[0, 'It is generally accepted']]],
	['it is widely accepted',                'It is widely accepted that tabs are bad.',     [[0, 'It is widely accepted']]],
	['best practice is',                     'Best practice is to use spaces.',              [[0, 'Best practice is']]],
	['everyone knows',                       'Everyone knows tabs are bad.',                 [[0, 'Everyone knows']]],
	// empty and tiny
	['whitespace only',                      '   \n\n  ',                                    []],
	['one letter',                           'A',                                            []],
	['one word, no punctuation',             'everyone',                                     []],
	['two words, no punctuation',            'everyone knows',                               [[0, 'everyone knows']]],
	// whitespace and Unicode
	['tabs between the words',               'Experts\tsay so.',                             [[0, 'Experts\tsay']]],
	['a CRLF between the words',             'Experts\r\nsay so.',                           [[0, 'Experts\r\nsay']]],
	['a no-break space between the words',   'Experts say so.',                         [[0, 'Experts say']]],
	['accents in the sentence',              'Experts say the café is bad.',                 [[0, 'Experts say']]],
	['Cyrillic before the match',            'Кэш: experts say so.',                         [[5, 'experts say']]],
	['CJK before the match',                 '注意 experts say so.',                           [[3, 'experts say']]],
	['an emoji next to the match',           '🎉 Experts say so.',                            [[3, 'Experts say']]],
	// markdown leftovers
	['a heading line',                       '## Experts say so',                            [[3, 'Experts say']]],
	['a dash list item',                     '- Experts say so.',                            [[2, 'Experts say']]],
	['a numbered list item',                 '1. Experts say so.',                           [[3, 'Experts say']]],
	['bold markers around the phrase',       '**Experts say** so.',                          [[2, 'Experts say']]],
	['backtick code around the phrase',      '`Experts say` so.',                            [[1, 'Experts say']]],
	['a markdown link swallows the phrase',  '[Experts say](https://x.test) so.',            []],
	['a table row',                          '| Experts say | ok |',                         [[2, 'Experts say']]],
	['a block quote',                        '> Everyone knows this.',                       [[2, 'Everyone knows']]],
	// code and URLs
	['a snake_case name',                    'The experts_say flag is set.',                 []],
	['a camelCase name',                     'The expertsSay flag is set.',                  []],
	['a path joins the first word',          'Open docs/experts say now.',                   []],
	['an https URL',                         'See https://x.test/experts say now.',          []],
	['an email address',                     'Mail experts@x.test say now.',                 []],
	['a version number after the phrase',    'Experts say v1.2.3 is fine.',                  [[0, 'Experts say']]],
	['a commit hash after the phrase',       'Everyone knows a3f9c2 broke it.',              [[0, 'Everyone knows']]],
	['a template slot after the phrase',     'Experts say ${name} is set.',                  [[0, 'Experts say']]],
	['a shell variable after the phrase',    'Everyone knows $HOME is set.',                 [[0, 'Everyone knows']]],
	// numbers and dates
	['a thousands separator',                'Studies show 1,000 cases.',                    [[0, 'Studies show']]],
	['a percent',                            'Studies show 50% growth.',                     [[0, 'Studies show']]],
	['a dollar amount',                      'Research shows $5 costs.',                     [[0, 'Research shows']]],
	['a clock time',                         'Experts say 10:30 is late.',                   [[0, 'Experts say']]],
	['an ISO date',                          'Experts say 2026-09-04 is the date.',          [[0, 'Experts say']]],
	['a slashed date',                       'Experts say 9/4/2026 is the date.',            [[0, 'Experts say']]],
	['an ordinal',                           'Experts say the 3rd is late.',                 [[0, 'Experts say']]],
	// punctuation
	['quotes around the phrase',             'He wrote "experts say" here.',                 [[10, 'experts say']]],
	['brackets around the phrase',           '[Everyone knows] it.',                         [[1, 'Everyone knows']]],
	['an ellipsis after the phrase',         'Experts say... so.',                           [[0, 'Experts say']]],
	['an em dash joins the phrase',          'Experts—say so.',                              []],
	['a question and an exclamation',        'Experts say?! Really.',                        [[0, 'Experts say']]],
	['the phrase at the end with a period',  'Tabs are bad, everyone knows.',                [[14, 'everyone knows']]],
	// case
	['Title Case',                           'Everyone Knows Tabs Are Bad.',                 [[0, 'Everyone Knows']]],
	['camelCase does not match',             'EveryoneKnows tabs are bad.',                  []],
	['ALL CAPS at the end',                  'TABS ARE BAD, EVERYONE KNOWS',                 [[14, 'EVERYONE KNOWS']]],
	['capitalized at a sentence start',      'Fine. Studies show it.',                       [[6, 'Studies show']]],
	// contractions
	['it is, shortened, breaks the phrase',  'It\'s known that tabs are bad.',               []],
	['is not, shortened, after the phrase',  'Experts say it isn\'t bad.',                   [[0, 'Experts say']]],
	['they are, shortened, before it',       'They\'re experts, everyone knows.',            [[17, 'everyone knows']]],
	['do not, shortened, before it',         'Don\'t argue, experts agree.',                 [[13, 'experts agree']]],
	['a possessive before the phrase',       'The tool\'s experts say so.',                  [[11, 'experts say']]],
	['a bare apostrophe before the phrase',  'James\' experts agree here.',                  [[7, 'experts agree']]],
	// traps: it looks like a hit and it is not
	['trap: study shows, singular',          'The study shows tabs are bad.',                []],
	['trap: research show, no s',            'Research show tabs are bad.',                  []],
	['trap: best practices are',             'Best practices are good.',                     []],
	['trap: no one knows',                   'No one knows tabs are bad.',                   []],
	['trap: it is not known',                'It is not known that tabs are bad.',           []],
	['trap: the expert agrees',              'The expert agrees.',                           []],
	['trap: a comma splits the phrase',      'Studies, show it.',                            []],
	['trap: a plural of the last word',      'It is knowns.',                                []],
	// traps: it looks harmless and it is a hit
	['trap: a hit inside a code fence',      '```\nExperts say so.\n```',                    [[4, 'Experts say']]],
	['trap: a hit inside parentheses',       'Use spaces (experts agree).',                  [[12, 'experts agree']]],
	['trap: a hit at the end of a bullet',   '- Tabs are bad, everyone knows',               [[16, 'everyone knows']]],
	['trap: a hit in a heading',             '# Best practice is spaces',                    [[2, 'Best practice is']]],
	['trap: a hit next to an emoji',         'Studies show 🎉 growth.',                       [[0, 'Studies show']]],
	['trap: a hit with a trailing colon',    'Experts say: tabs are bad.',                   [[0, 'Experts say']]],
	['trap: a hit across two list lines',    '- Experts\n  say so.',                         [[2, 'Experts\n  say']]],
]

for (const [name, text, matches] of cases) {
	test(name, () => {
		const found = noUnnamedAuthority(text)
		assert.deepEqual(found.map(m => [m.index, m.text]), matches)
		for (const m of found) assert.equal(text.slice(m.index, m.index + m.length), m.text, 'length')
		assert.deepEqual(found.map(m => m.phrase), found.map(m => m.text))
	})
}

const fields = [
	// text                                  field       value
	['Experts say so.',                      'phrase',   'Experts say'],
	['Experts\nsay so.',                     'phrase',   'Experts\nsay'],
	['Experts say so.',                      'length',   11],
	['No. Experts say so.',                  'context',  'Experts say so.'],
	['Experts say so. Research shows it.',   'context',  'Experts say so.'],
	['Experts say so.',                      'message',  'Name the source, or cut the claim. "Experts say" names no one.'],
	['Studies show tabs are bad.',           'message',  'Name the source, or cut the claim. "Studies show" names no one.'],
]

for (const [text, field, value] of fields) {
	test(`the match carries ${field} for "${text.replace(/\n/g, ' ')}"`, () => assert.deepEqual(noUnnamedAuthority(text)[0][field], value))
}

// The whole output, every field but message
const outputs = [
	// text                                    matches
	['The CommonMark spec says a tab is 4.',   []],
	['Experts say so.',                        [{ index: 0, length: 11, text: 'Experts say', context: 'Experts say so.', phrase: 'Experts say' }]],
	['Studies show tabs are bad.',             [{ index: 0, length: 12, text: 'Studies show', context: 'Studies show tabs are bad.', phrase: 'Studies show' }]],
	['(Experts say) so.',                      [{ index: 1, length: 11, text: 'Experts say', context: '(Experts say) so.', phrase: 'Experts say' }]],
	['Experts\nsay tabs are bad.',             [{ index: 0, length: 11, text: 'Experts\nsay', context: 'Experts\nsay tabs are bad.', phrase: 'Experts\nsay' }]],
	['Experts say so. Research shows it.',     [{ index: 0, length: 11, text: 'Experts say', context: 'Experts say so.', phrase: 'Experts say' }, { index: 16, length: 14, text: 'Research shows', context: 'Research shows it.', phrase: 'Research shows' }]],
	['Experts say experts agree.',             [{ index: 0, length: 11, text: 'Experts say', context: 'Experts say experts agree.', phrase: 'Experts say' }, { index: 12, length: 13, text: 'experts agree', context: 'Experts say experts agree.', phrase: 'experts agree' }]],
]

for (const [text, matches] of outputs) {
	test(`noUnnamedAuthority output for ${JSON.stringify(text)}`, () => assert.deepEqual(noUnnamedAuthority(text).map(({ message, ...m }) => m), matches))
}

// The full shape of every match of every row: the span, the phrase, the context, the message.
test('every match of every row carries the full shape', () => {
	for (const [name, text] of cases) {
		for (const m of noUnnamedAuthority(text)) {
			assert.equal(text.slice(m.index, m.index + m.length), m.text, `${name}: the span`)
			assert.equal(m.length, m.text.length, `${name}: the length`)
			assert.equal(m.phrase, m.text, `${name}: the phrase`)
			assert.ok(text.includes(m.context), `${name}: the context is part of the text`)
			assert.equal(m.message, `Name the source, or cut the claim. "${m.text}" names no one.`, `${name}: the message`)
		}
	}
})

// options: the rule takes none, so an extra argument changes nothing
test('a second argument is ignored', () => assert.deepEqual(noUnnamedAuthority('Experts say so.', {}).map(m => m.index), [0]))
test('a null second argument is ignored', () => assert.deepEqual(noUnnamedAuthority('Experts say so.', null).map(m => m.index), [0]))
test('a number as a second argument is ignored', () => assert.deepEqual(noUnnamedAuthority('Experts say so.', 0).map(m => m.index), [0]))

// text that is not a string
test('null text returns an empty list', () => assert.deepEqual(noUnnamedAuthority(null), []))
test('undefined text returns an empty list', () => assert.deepEqual(noUnnamedAuthority(undefined), []))
test('a number as text returns an empty list', () => assert.deepEqual(noUnnamedAuthority(12345), []))

// length extremes
test('a long paragraph returns every hit', () => {
	const text = `Experts say so. ${'word '.repeat(400)}Everyone knows it.`
	assert.deepEqual(noUnnamedAuthority(text).map(m => m.text), ['Experts say', 'Everyone knows'])
})

