import { test } from 'node:test'
import assert from 'node:assert/strict'
import { noNeedlessWords } from './noNeedlessWords.js'

// Every match, exactly: [index, text, kind]. One row per list, per overlap, per phrase rule.
const cases = [
	// name                                    text                                            matches
	['empty',                                  '',                                             []],
	['plain sentence',                         'Run the tests.',                               []],
	['slop list',                              'We delve into the code.',                      [[3, 'delve', 'slop']]],
	['slop list, a listed plural',             'The report underscores it.',                   [[11, 'underscores', 'slop']]],
	['restatement list',                       'In other words, run it.',                      [[0, 'In other words', 'restatement']]],
	['marketing list',                         'A seamless and robust tool.',                  [[2, 'seamless', 'marketing'], [15, 'robust', 'marketing']]],
	['filler list',                            'It is important to note that it works.',       [[0, 'It is important to note', 'filler']]],
	['marketing wins over slop',               'It runs seamlessly.',                          [[8, 'seamlessly', 'marketing']]],
	['filler wins over restatement',           'As mentioned, run it.',                        [[0, 'As mentioned', 'filler']]],
	['the longest phrase wins',                'As noted above, run it.',                      [[0, 'As noted above', 'filler']]],
	['marketing words from agent-ste',        'A sleek, intuitive, mission-critical tool.',   [[2, 'sleek', 'marketing'], [9, 'intuitive', 'marketing'], [20, 'mission-critical', 'marketing']]],
	['fillers from agent-ste',                'Basically, it works. Obviously, at the end of the day, it ships.', [[0, 'Basically', 'filler'], [21, 'Obviously', 'filler'], [32, 'at the end of the day', 'filler']]],
	['upper case',                             'DELVE INTO IT.',                               [[0, 'DELVE', 'slop']]],
	['upper case phrase',                      'IN OTHER WORDS, run it.',                      [[0, 'IN OTHER WORDS', 'restatement']]],
	['match at the very start',                'Leverage the parser.',                         [[0, 'Leverage', 'slop']]],
	['match at the very end',                  'The design is elegant',                        [[14, 'elegant', 'marketing']]],
	['two matches, exact places',              'A robust and elegant tool.',                   [[2, 'robust', 'marketing'], [13, 'elegant', 'marketing']]],
	['a word and a phrase, exact places',      'It is important to note that we delve.',       [[0, 'It is important to note', 'filler'], [32, 'delve', 'slop']]],
	['the same word twice',                    'Delve, delve.',                                [[0, 'Delve', 'slop'], [7, 'delve', 'slop']]],
	['phrase across a line break',             'In other\nwords, run it.',                     [[0, 'In other\nwords', 'restatement']]],
	['phrase over many spaces',                'In  other   words, run it.',                   [[0, 'In  other   words', 'restatement']]],
	['punctuation next to the match',          'The tool ("robust"), ships.',                  [[11, 'robust', 'marketing']]],
	['hyphenated entry',                       'A cutting-edge idea.',                         [[2, 'cutting-edge', 'marketing']]],
	['near miss, a longer word',               'The parser leverages tokens.',                 []],
	['near miss, an unlisted plural',          'Many realms exist.',                           []],
	['near miss, a hyphen joins the word',     'The re-delve step is next.',                   []],
	['near miss, punctuation splits a phrase', 'In other, words run it.',                      []],
	['near miss, phrase words out of order',   'Words in other files.',                        []],
	// the user sends nothing, or almost nothing
	// name                                    text                                            matches
	['user sends only spaces and tabs',        '   \t  ',                                      []],
	['user sends only line breaks',            '\n\n\n',                                       []],
	['user sends one letter',                  'a',                                            []],
	['user sends one listed word, no stop',    'delve',                                        [[0, 'delve', 'slop']]],
	['user sends one listed word, no punct',   'robust',                                       [[0, 'robust', 'marketing']]],
	// whitespace and other scripts
	['tabs around the match',                  '\tDelve\tinto it.',                            [[1, 'Delve', 'slop']]],
	['a phrase across a CRLF break',           'In other\r\nwords, run it.',                   [[0, 'In other\r\nwords', 'restatement']]],
	['a no-break space before the match',      'It is robust.',                           [[6, 'robust', 'marketing']]],
	['an accent in the same sentence',         'Le café est robust.',                          [[12, 'robust', 'marketing']]],
	['Cyrillic in the same sentence',          'Это robust код.',                              [[4, 'robust', 'marketing']]],
	['CJK in the same sentence',               '这是 robust 代码。',                             [[3, 'robust', 'marketing']]],
	['an emoji next to the match',             '🚀 robust 🚀',                                  [[3, 'robust', 'marketing']]],
	// markdown the agent left in the answer
	['a heading marker',                       '## Robust title',                              [[3, 'Robust', 'marketing']]],
	['a bullet marker',                        '- delve here',                                 [[2, 'delve', 'slop']]],
	['a numbered list marker',                 '1. delve here',                                [[3, 'delve', 'slop']]],
	['bold stars around the match',            '**robust**',                                   [[2, 'robust', 'marketing']]],
	['backticks around the match',             '`robust`',                                     [[1, 'robust', 'marketing']]],
	['a markdown link swallows the word',      '[robust](https://x.com/robust)',               []],
	['brackets alone keep the word',           '[robust] (see the docs)',                      [[1, 'robust', 'marketing']]],
	['a table cell',                           '| a | robust |',                               [[6, 'robust', 'marketing']]],
	['a block quote marker',                   '> robust code',                                [[2, 'robust', 'marketing']]],
	// code, paths, URLs
	['snake_case keeps the word joined',       'The robust_parser runs.',                      []],
	['camelCase keeps the word joined',        'robustParser is fine.',                        []],
	['a path keeps the word joined',           'src/robust/index.js',                          []],
	['a URL keeps the word joined',            'See https://x.com/robust now.',                []],
	['an email keeps the word joined',         'mail robust@example.com now',                  []],
	['a version number near the match',        'v1.2.3 is robust.',                            [[10, 'robust', 'marketing']]],
	['a hash near the match',                  'a1b2c3d4 robust',                              [[9, 'robust', 'marketing']]],
	['a template slot holds the word',         '${robust} slot',                               [[2, 'robust', 'marketing']]],
	['a shell variable near the match',        '$HOME is robust',                              [[9, 'robust', 'marketing']]],
	// numbers and dates
	['a thousands separator',                  '1,000 robust items',                           [[6, 'robust', 'marketing']]],
	['a percent',                              '50% robust',                                   [[4, 'robust', 'marketing']]],
	['a price',                                '$5 robust',                                    [[3, 'robust', 'marketing']]],
	['a clock time',                           '10:30 robust',                                 [[6, 'robust', 'marketing']]],
	['an ISO date',                            '2026-09-04 robust',                            [[11, 'robust', 'marketing']]],
	['a slashed date',                         '9/4/2026 robust',                              [[9, 'robust', 'marketing']]],
	['an ordinal number',                      '3rd robust attempt',                           [[4, 'robust', 'marketing']]],
	// punctuation around the match
	['quotes around the match',                '"robust" tools',                               [[1, 'robust', 'marketing']]],
	['brackets around the match',              '(robust)',                                     [[1, 'robust', 'marketing']]],
	['an ellipsis after the match',            'It is robust... maybe',                        [[6, 'robust', 'marketing']]],
	['an em dash after the match',             'It is robust — yes',                           [[6, 'robust', 'marketing']]],
	['a question and a bang',                  'Is it robust?!',                               [[6, 'robust', 'marketing']]],
	['a match at the start and at the end',    'Robust tools ship robust code',                [[0, 'Robust', 'marketing'], [18, 'robust', 'marketing']]],
	// case
	['ALL CAPS, two matches',                  'ROBUST AND ELEGANT',                           [[0, 'ROBUST', 'marketing'], [11, 'ELEGANT', 'marketing']]],
	['Title Case hyphenated entry',            'Cutting-Edge Design',                          [[0, 'Cutting-Edge', 'marketing']]],
	['capitalized inside the sentence',        'It is Robust.',                                [[6, 'Robust', 'marketing']]],
	['camelCase looks like the entry',         'cuttingEdge design',                           []],
	// contractions and possessives
	['a contraction before the match',         "It's robust.",                                 [[5, 'robust', 'marketing']]],
	['a negative contraction',                 "It isn't robust.",                             [[9, 'robust', 'marketing']]],
	['a they-are contraction',                 "They're robust.",                              [[8, 'robust', 'marketing']]],
	['a do-not contraction',                   "Don't delve.",                                 [[6, 'delve', 'slop']]],
	['a possessive with an s',                 "The tool's robust.",                           [[11, 'robust', 'marketing']]],
	['a possessive without an s',              "James' robust plan.",                          [[7, 'robust', 'marketing']]],
	// traps: it looks like a listed word, and it is not
	['near miss, leveraged',                   'The leveraged buyout.',                        []],
	['near miss, harnessed',                   'She harnessed it.',                            []],
	['near miss, powerfully',                  'A powerfully built tool.',                     []],
	['near miss, showcases',                   'The showcases are new.',                       []],
	['near miss, empowered',                   'Empowered users.',                             []],
	['near miss, a singular phrase word',      'in other word, run it.',                       []],
	// traps: it reads as normal English, and the rule still matches
	['harness is a listed word',               'Harness the API key.',                         [[0, 'Harness', 'slop']]],
	['leverage is a listed word',              'Leverage ratio is 2.',                         [[0, 'Leverage', 'slop']]],
	['realm is a listed word',                 'The realm of DNS.',                            [[4, 'realm', 'slop']]],
	['please note that is a filler',           'Please note that it fails.',                   [[0, 'Please note that', 'filler']]],
	['powerful is a marketing word',           'A powerful magnet.',                           [[2, 'powerful', 'marketing']]],
	['simply put is a restatement',            'Simply put, run it.',                          [[0, 'Simply put', 'restatement']]],
]

for (const [name, text, matches] of cases) {
	test(name, () => {
		const found = noNeedlessWords(text)
		assert.deepEqual(found.map(m => [m.index, m.text, m.kind]), matches)
		for (const m of found) assert.equal(text.slice(m.index, m.index + m.length), m.text, 'length')
	})
}

const fields = [
	// text                                       field       value
	['We delve into the code.',                   'phrase',   'delve'],
	['We delve into the code.',                   'kind',     'slop'],
	['We delve into the code.',                   'length',   5],
	['A cutting-edge idea.',                      'length',   12],
	['IN OTHER WORDS, run it.',                   'phrase',   'in other words'],
	['As noted above, run it.',                   'kind',     'filler'],
	['Run the tests. We delve into the code.',    'context',  'We delve into the code.'],
	['Run it.\n\nWe delve into the code.',        'context',  'We delve into the code.'],
	['We delve in.',                              'message',  'Cut "delve". It adds nothing.'],
	['IN OTHER WORDS, run it.',                   'message',  'Cut "IN OTHER WORDS". It adds nothing.'],
]

for (const [text, field, value] of fields) {
	test(`the match carries ${field} for "${text.split('\n')[0]}"`, () => assert.deepEqual(noNeedlessWords(text)[0][field], value))
}

// The whole output, every field but message
const outputs = [
	// text                                       matches
	['Run the tests.',                            []],
	['We delve into the code.',                   [{ index: 3, length: 5, text: 'delve', context: 'We delve into the code.', phrase: 'delve', kind: 'slop' }]],
	['A robust and elegant tool.',                [{ index: 2, length: 6, text: 'robust', context: 'A robust and elegant tool.', phrase: 'robust', kind: 'marketing' }, { index: 13, length: 7, text: 'elegant', context: 'A robust and elegant tool.', phrase: 'elegant', kind: 'marketing' }]],
	['IN OTHER WORDS, run it.',                   [{ index: 0, length: 14, text: 'IN OTHER WORDS', context: 'IN OTHER WORDS, run it.', phrase: 'in other words', kind: 'restatement' }]],
	['It is important to note that we delve.',    [{ index: 0, length: 23, text: 'It is important to note', context: 'It is important to note that we delve.', phrase: 'it is important to note', kind: 'filler' }, { index: 32, length: 5, text: 'delve', context: 'It is important to note that we delve.', phrase: 'delve', kind: 'slop' }]],
	['Run the tests. We delve into the code.',    [{ index: 18, length: 5, text: 'delve', context: 'We delve into the code.', phrase: 'delve', kind: 'slop' }]],
]

for (const [text, matches] of outputs) {
	test(`noNeedlessWords output for ${JSON.stringify(text)}`, () => assert.deepEqual(noNeedlessWords(text).map(({ message, ...m }) => m), matches))
}

// Every field of every match of every row above: the keys, the span, the message, the phrase, the kind.
import { key } from '../Words.js'
import { sentenceAt } from '../Sentences.js'

const KEYS = ['index', 'length', 'text', 'context', 'message', 'phrase', 'kind']
const KINDS = new Set(['slop', 'restatement', 'marketing', 'filler'])

for (const [name, text] of cases) {
	test(`every field is right for the row "${name}"`, () => {
		for (const m of noNeedlessWords(text)) {
			assert.deepEqual(Object.keys(m).sort(), [...KEYS].sort(), 'keys')
			assert.equal(text.slice(m.index, m.index + m.length), m.text, 'span')
			assert.equal(m.length, m.text.length, 'length')
			assert.equal(m.message, `Cut "${m.text}". It adds nothing.`, 'message')
			assert.equal(key(m.phrase.replace(/\s+/g, ' ')), key(m.text.replace(/\s+/g, ' ')), 'phrase')
			assert.equal(m.context, sentenceAt(text, m.index), 'context')
			assert.ok(KINDS.has(m.kind), 'kind')
		}
	})
}

// the whole output of the new rows, every field but message
const moreOutputs = [
	// text                              matches
	['`robust`',                         [{ index: 1, length: 6, text: 'robust', context: '`robust`', phrase: 'robust', kind: 'marketing' }]],
	['## Robust title',                  [{ index: 3, length: 6, text: 'Robust', context: '## Robust title', phrase: 'robust', kind: 'marketing' }]],
	['Please note that it fails.',       [{ index: 0, length: 16, text: 'Please note that', context: 'Please note that it fails.', phrase: 'please note that', kind: 'filler' }]],
	['Simply put, run it.',              [{ index: 0, length: 10, text: 'Simply put', context: 'Simply put, run it.', phrase: 'simply put', kind: 'restatement' }]],
	['Harness the API key.',             [{ index: 0, length: 7, text: 'Harness', context: 'Harness the API key.', phrase: 'harness', kind: 'slop' }]],
	['[robust](https://x.com/robust)',   []],
]

for (const [text, matches] of moreOutputs) {
	test(`noNeedlessWords output for ${JSON.stringify(text)}`, () => assert.deepEqual(noNeedlessWords(text).map(({ message, ...m }) => m), matches))
}

// the span of every match of every text in this file
const allTexts = [...cases.map(c => c[1]), ...fields.map(f => f[0]), ...outputs.map(o => o[0]), ...moreOutputs.map(o => o[0])]

test('text.slice(index, index + length) is the match text, for every match of every row', () => {
	for (const text of allTexts) for (const m of noNeedlessWords(text)) assert.equal(text.slice(m.index, m.index + m.length), m.text, JSON.stringify(text))
})

// length extremes
test('a sentence exactly at the 20 word limit still matches', () => {
	const text = 'We delve one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen.'
	assert.deepEqual(noNeedlessWords(text).map(m => [m.index, m.text]), [[3, 'delve']])
})

test('a long paragraph returns every match', () => {
	const text = Array.from({ length: 500 }, (_, i) => `Line ${i} is robust.`).join(' ')
	assert.equal(noNeedlessWords(text).length, 500)
})

// the input, not a string
test('no argument returns an empty array', () => assert.deepEqual(noNeedlessWords(), []))
test('null returns an empty array', () => assert.deepEqual(noNeedlessWords(null), []))
test('a number returns an empty array', () => assert.deepEqual(noNeedlessWords(123), []))
test('an unknown option changes nothing', () => assert.deepEqual(noNeedlessWords('We delve.', { limit: 0 }), noNeedlessWords('We delve.')))

// The allow option drops the listed entries, case folded, and keeps the rest.
const allowed = [
	// text                                allow            matches
	['A robust estimator.',                ['robust'],      []],
	['A robust estimator.',                ['Robust'],      []],
	['We delve into a robust estimator.',  ['robust'],      [[3, 'delve']]],
	['A robust estimator.',                [],              [[2, 'robust']]],
	['A robust estimator.',                null,            [[2, 'robust']]],
]

for (const [text, allow, matches] of allowed) {
	test(`allow ${JSON.stringify(allow)} for "${text}"`, () => assert.deepEqual(noNeedlessWords(text, { allow }).map(m => [m.index, m.text]), matches))
}
