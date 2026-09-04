import { test } from 'node:test'
import assert from 'node:assert/strict'
import { oneHedge } from './oneHedge.js'

// Every match, exactly: [index, text, count]. count is the hedges in the whole sentence.
// The 4th cell of a row is the options object, {} when the row leaves the default limit of 1.
const cases = [
	// name                                  text                                            matches                                       options
	['empty',                                '',                                             []],
	['no hedge',                             'The build fails.',                             []],
	['one hedge is at the limit',            'The build probably fails.',                    []],
	['two hedges, the span is the second',   'It may possibly fail.',                         [[7, 'possibly', 2]]],
	['three hedges, second to last',         'It may possibly fail, perhaps.',                [[7, 'possibly fail, perhaps', 3]]],
	['upper case',                           'IT MAY POSSIBLY FAIL.',                         [[7, 'POSSIBLY', 2]]],
	['a hedge at the very start',            'Perhaps it may fail.',                          [[11, 'may', 2]]],
	['a hedge at the very end',              'The fix may work probably',                     [[17, 'probably', 2]]],
	['across a line break',                  'It may possibly\nfail, perhaps.',               [[7, 'possibly\nfail, perhaps', 3]]],
	['punctuation next to the match',        'It may fail (possibly).',                       [[13, 'possibly', 2]]],
	['a leading space shifts the index',     '  It may possibly fail.',                       [[9, 'possibly', 2]]],
	['two sentences, exact places',          'It may possibly fail. The fix could perhaps work.', [[7, 'possibly', 2], [36, 'perhaps', 2]]],
	['one hedge in each of two sentences',   'It may fail. It seems slow.',                   []],
	['a blank line ends the sentence',       'It may fail\n\nIt seems slow',                  []],
	['an abbreviation does not split',       'It may fail, e.g. possibly here.',              [[18, 'possibly', 2]]],
	['near miss, longer words',              'Maybe the mightier appearance seems fine.',     []],
	['near miss, a hyphen joins the word',   'It may fail in a may-be state.',                []],
	['limit 0, one hedge is over',           'Perhaps it fails.',                             [[0, 'Perhaps', 1]],                          { limit: 0 }],
	['limit 0, no hedge',                    'The build fails.',                              [],                                           { limit: 0 }],
	['limit 2, two hedges',                  'It may possibly fail.',                         [],                                           { limit: 2 }],
	['limit 2, three hedges',                'It may possibly fail, perhaps.',                [[22, 'perhaps', 3]],                         { limit: 2 }],
	// one row per entry of the hedges list, each paired with "seems"
	['may',                                  'It may works, it seems.',                       [[17, 'seems', 2]]],
	['might',                                'It might works, it seems.',                     [[19, 'seems', 2]]],
	['could',                                'It could works, it seems.',                     [[19, 'seems', 2]]],
	['likely',                               'It likely works, it seems.',                    [[20, 'seems', 2]]],
	['possibly',                             'It possibly works, it seems.',                  [[22, 'seems', 2]]],
	['perhaps',                              'It perhaps works, it seems.',                   [[21, 'seems', 2]]],
	['presumably',                           'It presumably works, it seems.',                [[24, 'seems', 2]]],
	['seems',                                'It seems works, it seems.',                     [[19, 'seems', 2]]],
	['appears',                              'It appears works, it seems.',                   [[21, 'seems', 2]]],
	['typically',                            'It typically works, it seems.',                 [[23, 'seems', 2]]],
	['generally',                            'It generally works, it seems.',                 [[23, 'seems', 2]]],
	['probably',                             'It probably works, it seems.',                  [[22, 'seems', 2]]],
	['arguably',                             'It arguably works, it seems.',                  [[22, 'seems', 2]]],
	// the user sends nothing, or almost nothing
	// name                                  text                                            matches                                       options
	['user sends only spaces and tabs',      '   \t  ',                                       []],
	['user sends only line breaks',          '\n\n\n',                                        []],
	['user sends one letter',                'a',                                             []],
	['user sends one hedge, no punctuation', 'may',                                           []],
	['the same hedge twice',                 'may may',                                       [[4, 'may', 2]]],
	// whitespace and other scripts
	['tabs between the words',               'It\tmay\tpossibly fail.',                       [[7, 'possibly', 2]]],
	['a CRLF break inside the span',         'It may possibly\r\nfail, perhaps.',             [[7, 'possibly\r\nfail, perhaps', 3]]],
	['a no-break space before the hedge',    'It may\u00A0possibly fail.',               [[7, 'possibly', 2]]],
	['an accent in the same sentence',       'Le café may possibly fail.',                    [[12, 'possibly', 2]]],
	['Cyrillic in the same sentence',        'Код may possibly fails.',                       [[8, 'possibly', 2]]],
	['CJK in the same sentence',             '代码 may possibly fails.',                        [[7, 'possibly', 2]]],
	['an emoji before the hedges',           '🚀 may possibly fail.',                          [[7, 'possibly', 2]]],
	// markdown the agent left in the answer
	['a heading marker',                     '## It may possibly fail',                       [[10, 'possibly', 2]]],
	['a bullet marker',                      '- it may possibly fail',                        [[9, 'possibly', 2]]],
	['a numbered list marker',               '1. It may possibly fail.',                      [[10, 'possibly', 2]]],
	['bold stars around the hedges',         '**may** and **possibly** fail.',                [[14, 'possibly', 2]]],
	['backticks around the first hedge',     'It `may` possibly fail.',                       [[9, 'possibly', 2]]],
	['a markdown link swallows the hedge',   '[may](x) possibly fails.',                      []],
	['a table row',                          '| may | possibly |',                            [[8, 'possibly', 2]]],
	['a block quote marker',                 '> It may possibly fail.',                       [[9, 'possibly', 2]]],
	// code, paths, URLs
	['snake_case keeps the word joined',     'The may_be flag could fail.',                   []],
	['camelCase keeps the word joined',      'mayBe could work.',                             []],
	['a path keeps the words joined',        'src/may/could.js',                              []],
	['a URL keeps the words joined',         'See https://x.com/may/could now.',              []],
	['an email keeps the word joined',       'may@example.com could fail.',                   []],
	['a version number before the hedges',   'v1.2.3 may possibly break.',                    [[11, 'possibly', 2]]],
	['a template slot holds a hedge',        '${may} could fail.',                            [[7, 'could', 2]]],
	['a shell variable before the hedges',   '$HOME may possibly break.',                     [[10, 'possibly', 2]]],
	// numbers and dates
	['a thousands separator',                'It may fail 1,000 times, possibly.',            [[25, 'possibly', 2]]],
	['a percent',                            '50% may possibly fail.',                        [[8, 'possibly', 2]]],
	['a price',                              '$5 may possibly costs.',                        [[7, 'possibly', 2]]],
	['a clock time',                         '10:30 may possibly slips.',                     [[10, 'possibly', 2]]],
	['an ISO date',                          '2026-09-04 may possibly slips.',                [[15, 'possibly', 2]]],
	['a slashed date',                       '9/4/2026 may possibly slips.',                  [[13, 'possibly', 2]]],
	['an ordinal number',                    '3rd run may possibly fails.',                   [[12, 'possibly', 2]]],
	// punctuation around the hedges
	['quotes around the second hedge',       'It may fail, "possibly".',                      [[14, 'possibly', 2]]],
	['brackets around the second hedge',     'It may fail [possibly].',                       [[13, 'possibly', 2]]],
	['an ellipsis ends the sentence first',  'It may fail... possibly.',                      []],
	['an em dash between the hedges',        'It may fail — possibly.',                       [[14, 'possibly', 2]]],
	['a question and a bang',                'May it possibly fail?!',                        [[7, 'possibly', 2]]],
	['a hedge at the start and at the end',  'Possibly it may',                               [[12, 'may', 2]]],
	// case
	['ALL CAPS, no stop',                    'MAY POSSIBLY FAIL',                             [[4, 'POSSIBLY', 2]]],
	['Title Case',                           'It May Possibly Fail.',                         [[7, 'Possibly', 2]]],
	['camelCase joins two hedges',           'It mayPossibly could fail.',                    []],
	['a hedge starts the second sentence',   'Perhaps. It may possibly fail.',                [[16, 'possibly', 2]]],
	// contractions and possessives
	['a contraction before the hedges',      "It's may possibly fail.",                       [[9, 'possibly', 2]]],
	['a negative contraction',               "It isn't likely, it seems.",                    [[20, 'seems', 2]]],
	['a do-not contraction',                 "Don't assume it may possibly fail.",            [[20, 'possibly', 2]]],
	['a possessive with an s',                "The tool's may possibly break.",               [[15, 'possibly', 2]]],
	['a possessive without an s',            "James' plan may possibly fail.",                [[16, 'possibly', 2]]],
	// traps: it looks like a hedge, and it is not
	['near miss, maybe and seemed',          'It maybe fails, it seemed slow.',               []],
	['near miss, appeared',                  'It appeared likely.',                           []],
	['near miss, general and typical',       'The general typical case might work.',          []],
	['near miss, probable and possible',     'Probable and possible fixes.',                  []],
	['near miss, a hyphen joins may and be', 'It may-be could fail.',                         []],
	['near miss, couldn and mights',         "Couldn't and mights are odd.",                  []],
	// traps: it reads as normal English, and the rule still matches
	['generally and seems',                  'The generally typical build seems fine.',       [[28, 'seems', 2]]],
	['could and appears',                    'You could see the file appears empty.',         [[23, 'appears', 2]]],
	['typically and likely',                 'Tests typically pass, so likely ship.',         [[25, 'likely', 2]]],
	['might and arguably',                   'It might be arguably done.',                    [[12, 'arguably', 2]]],
	['presumably and seems',                 'Presumably the fix seems right.',               [[19, 'seems', 2]]],
	['may and could in a list',              'A may and a could.',                            [[12, 'could', 2]]],
	// the limit knob
	['limit 3, three hedges',                'It may possibly fail, perhaps.',                [],                                           { limit: 3 }],
	['limit 3, four hedges',                 'It may possibly perhaps likely fail.',          [[24, 'likely', 4]],                          { limit: 3 }],
	['limit as a string, one hedge over',    'It may possibly fail.',                         [[7, 'possibly', 2]],                         { limit: '1' }],
	['limit as the string zero',             'Perhaps it fails.',                             [[0, 'Perhaps', 1]],                          { limit: '0' }],
]

for (const [name, text, matches, options = {}] of cases) {
	test(name, () => {
		const found = oneHedge(text, options)
		assert.deepEqual(found.map(m => [m.index, m.text, m.count]), matches)
		for (const m of found) assert.equal(text.slice(m.index, m.index + m.length), m.text, 'length')
	})
}

const fields = [
	// text                                  options       field      value
	['It may possibly fail.',                {},           'count',   2],
	['It may possibly fail.',                {},           'limit',   1],
	['It may possibly fail.',                {},           'hedges',  ['may', 'possibly']],
	['It may possibly fail.',                {},           'length',  8],
	['It may possibly fail, perhaps.',       {},           'hedges',  ['may', 'possibly', 'perhaps']],
	['IT MAY POSSIBLY FAIL.',                {},           'hedges',  ['MAY', 'POSSIBLY']],
	['It may possibly fail.',                { limit: 0 }, 'limit',   0],
	['It may possibly fail.',                { limit: 0 }, 'count',   2],
	['All is well. It may possibly fail.',   {},           'context', 'It may possibly fail.'],
	['It may possibly fail.',                {},           'context', 'It may possibly fail.'],
	['It may possibly fail.',                {},           'message', 'Keep one hedge. This sentence has 2: "may", "possibly".'],
	['It may possibly fail, perhaps.',       {},           'message', 'Keep one hedge. This sentence has 3: "may", "possibly", "perhaps".'],
	['Perhaps it fails.',                    { limit: 0 }, 'message', 'Keep one hedge. This sentence has 1: "Perhaps".'],
]

for (const [text, options, field, value] of fields) {
	test(`the match carries ${field}`, () => assert.deepEqual(oneHedge(text, options)[0][field], value))
}

// The whole output, every field but message
const outputs = [
	// text                                            matches                                                                                                                                                                                                                                                        options
	['The build fails.',                               []],
	['It may possibly fail.',                          [{ index: 7, length: 8, text: 'possibly', context: 'It may possibly fail.', count: 2, limit: 1, hedges: ['may', 'possibly'] }]],
	['It may possibly fail, perhaps.',                 [{ index: 7, length: 22, text: 'possibly fail, perhaps', context: 'It may possibly fail, perhaps.', count: 3, limit: 1, hedges: ['may', 'possibly', 'perhaps'] }]],
	['It may possibly fail. The fix could perhaps work.', [{ index: 7, length: 8, text: 'possibly', context: 'It may possibly fail.', count: 2, limit: 1, hedges: ['may', 'possibly'] }, { index: 36, length: 7, text: 'perhaps', context: 'The fix could perhaps work.', count: 2, limit: 1, hedges: ['could', 'perhaps'] }]],
	['Perhaps it fails.',                              [{ index: 0, length: 7, text: 'Perhaps', context: 'Perhaps it fails.', count: 1, limit: 0, hedges: ['Perhaps'] }],                                                                                                                                                { limit: 0 }],
	['It may possibly fail, perhaps.',                 [{ index: 22, length: 7, text: 'perhaps', context: 'It may possibly fail, perhaps.', count: 3, limit: 2, hedges: ['may', 'possibly', 'perhaps'] }],                                                                                                              { limit: 2 }],
]

for (const [text, matches, options = {}] of outputs) {
	test(`oneHedge output for ${JSON.stringify(text)}`, () => assert.deepEqual(oneHedge(text, options).map(({ message, ...m }) => m), matches))
}

// Every field of every match of every row above: the keys, the span, the count, the limit, the message.
import { key } from '../Words.js'
import { hedges } from '../data/hedges.js'

const KEYS = ['index', 'length', 'text', 'context', 'message', 'count', 'limit', 'hedges']
const LIST = new Set(hedges)

for (const [name, text, , options = {}] of cases) {
	test(`every field is right for the row "${name}"`, () => {
		for (const m of oneHedge(text, options)) {
			assert.deepEqual(Object.keys(m).sort(), [...KEYS].sort(), 'keys')
			assert.equal(text.slice(m.index, m.index + m.length), m.text, 'span')
			assert.equal(m.length, m.text.length, 'length')
			assert.equal(m.count, m.hedges.length, 'count')
			assert.equal(m.limit, +(options.limit ?? 1), 'limit, as a number')
			assert.equal(m.message, `Keep one hedge. This sentence has ${m.count}: ${m.hedges.map(h => `"${h}"`).join(', ')}.`, 'message')
			assert.ok(text.includes(m.context), 'context')
			assert.ok(m.context.includes(m.text), 'the span sits in the context')
			for (const h of m.hedges) assert.ok(LIST.has(key(h)), `hedge ${h}`)
		}
	})
}

// the whole output of the new rows, every field but message
const moreOutputs = [
	// text                              matches                                                                                                                                             options
	['may may',                          [{ index: 4, length: 3, text: 'may', context: 'may may', count: 2, limit: 1, hedges: ['may', 'may'] }]],
	['| may | possibly |',               [{ index: 8, length: 8, text: 'possibly', context: '| may | possibly |', count: 2, limit: 1, hedges: ['may', 'possibly'] }]],
	['MAY POSSIBLY FAIL',                [{ index: 4, length: 8, text: 'POSSIBLY', context: 'MAY POSSIBLY FAIL', count: 2, limit: 1, hedges: ['MAY', 'POSSIBLY'] }]],
	['Presumably the fix seems right.',  [{ index: 19, length: 5, text: 'seems', context: 'Presumably the fix seems right.', count: 2, limit: 1, hedges: ['Presumably', 'seems'] }]],
	['[may](x) possibly fails.',         []],
	['It may possibly perhaps likely fail.', [{ index: 24, length: 6, text: 'likely', context: 'It may possibly perhaps likely fail.', count: 4, limit: 3, hedges: ['may', 'possibly', 'perhaps', 'likely'] }], { limit: 3 }],
]

for (const [text, matches, options = {}] of moreOutputs) {
	test(`oneHedge output for ${JSON.stringify(text)}`, () => assert.deepEqual(oneHedge(text, options).map(({ message, ...m }) => m), matches))
}

// the span of every match of every text in this file
const allRows = [...cases.map(c => [c[1], c[3] ?? {}]), ...fields.map(f => [f[0], f[1]]), ...outputs.map(o => [o[0], o[2] ?? {}]), ...moreOutputs.map(o => [o[0], o[2] ?? {}])]

test('text.slice(index, index + length) is the match text, for every match of every row', () => {
	for (const [text, options] of allRows) for (const m of oneHedge(text, options)) assert.equal(text.slice(m.index, m.index + m.length), m.text, JSON.stringify(text))
})

// length extremes
test('a sentence of exactly 20 words with two hedges matches', () => {
	const text = 'It may possibly one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen.'
	assert.deepEqual(oneHedge(text).map(m => [m.index, m.text, m.count]), [[7, 'possibly', 2]])
})

test('a long paragraph returns one match per sentence over the limit', () => {
	const text = Array.from({ length: 500 }, (_, i) => `Run ${i} may possibly fail.`).join(' ')
	assert.equal(oneHedge(text).length, 500)
})

// the input and the knob, not what the signature asks for
test('no argument returns an empty array', () => assert.deepEqual(oneHedge(), []))
test('null text returns an empty array', () => assert.deepEqual(oneHedge(null), []))
test('a number as text returns an empty array', () => assert.deepEqual(oneHedge(123), []))
test('an empty options object keeps the default limit', () => assert.deepEqual(oneHedge('It may possibly fail.', {}), oneHedge('It may possibly fail.')))
test('a limit of Infinity finds nothing', () => assert.deepEqual(oneHedge('It may possibly fail.', { limit: Infinity }), []))
