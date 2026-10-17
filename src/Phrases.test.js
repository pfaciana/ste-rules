import { test } from 'node:test'
import assert from 'node:assert/strict'
import { phrases, without } from './Phrases.js'

const list = ['utilise', 'in order to', 'prior to', 'due to the fact that']

const cases = [
	// name                       text                                        matched texts
	['one word',                  'We utilise the tool.',                      ['utilise']],
	['case folded',               'We UTILISE the tool.',                      ['UTILISE']],
	['whole words only',          'We utilised the tool.',                     []],
	['a phrase',                  'Wait in order to see.',                     ['in order to']],
	['a phrase across a line break', 'Wait in order\nto see.',                 ['in order\nto']],
	['longest entry wins',        'Due to the fact that it rains.',            ['Due to the fact that']],
	['two matches',               'Prior to that, utilise it.',                ['Prior to', 'utilise']],
	['no match',                  'Run the tests.',                            []],
]

for (const [name, text, expected] of cases) {
	test(name, () => assert.deepEqual(phrases(text, list).map(m => m.text), expected))
}

test('a match reports its entry, index, and length', () => {
	const [m] = phrases('Do it prior to noon.', list)
	assert.deepEqual(m, { index: 6, length: 8, text: 'prior to', entry: 'prior to' })
})

// The whole output of every match: index, length, text, entry. The list above is the entry list.
const full = [
	// name                                   text                                        matches
	['empty text',                            '',                                          []],
	['whitespace only',                       ' \t\n ',                                    []],
	['one letter',                            'a',                                         []],
	['one word, no punctuation',              'utilise',                                   [{ index: 0, length: 7, text: 'utilise', entry: 'utilise' }]],
	['the word capitalized on its own',       'Utilise',                                   [{ index: 0, length: 7, text: 'Utilise', entry: 'utilise' }]],
	['a tab before the word',                 'We\tutilise it.',                           [{ index: 3, length: 7, text: 'utilise', entry: 'utilise' }]],
	['a CRLF inside the phrase',              'Wait in order\r\nto see.',                  [{ index: 5, length: 12, text: 'in order\r\nto', entry: 'in order to' }]],
	['a no-break space inside the phrase',    'Wait in order to see.',           [{ index: 5, length: 11, text: 'in order to', entry: 'in order to' }]],
	['an accent next to the word',            'Café utilise now.',                         [{ index: 5, length: 7, text: 'utilise', entry: 'utilise' }]],
	['Cyrillic next to the word',             'Привет utilise now.', [{ index: 7, length: 7, text: 'utilise', entry: 'utilise' }]],
	['an emoji before the word',              '🚀 utilise',                      [{ index: 3, length: 7, text: 'utilise', entry: 'utilise' }]],
	['an emoji glued after the word',         'utilise🚀',                       [{ index: 0, length: 7, text: 'utilise', entry: 'utilise' }]],
	['a heading marker',                      '## Utilise it',                             [{ index: 3, length: 7, text: 'Utilise', entry: 'utilise' }]],
	['a dash list marker',                    '- utilise it',                              [{ index: 2, length: 7, text: 'utilise', entry: 'utilise' }]],
	['a number list marker',                  '1. utilise it',                             [{ index: 3, length: 7, text: 'utilise', entry: 'utilise' }]],
	['bold markers around the word',          '**utilise**',                               [{ index: 2, length: 7, text: 'utilise', entry: 'utilise' }]],
	['backticks around the word',             '`utilise`',                                 [{ index: 1, length: 7, text: 'utilise', entry: 'utilise' }]],
	['a table row',                           '| a | utilise | b |',                       [{ index: 6, length: 7, text: 'utilise', entry: 'utilise' }]],
	['a quote marker',                        '> utilise',                                 [{ index: 2, length: 7, text: 'utilise', entry: 'utilise' }]],
	['a link label with a space after it',    '[utilise] (u)',                             [{ index: 1, length: 7, text: 'utilise', entry: 'utilise' }]],
	['a link glued to its URL',               '[utilise](https://x.com/a)',                []],
	['a path holds the word',                 'see /usr/utilise/bin',                      []],
	['an email holds the word',               'a@utilise.com',                             []],
	['snake_case holds the word',             'utilise_tool',                              []],
	['a trailing underscore only',            'utilise_',                                  [{ index: 0, length: 7, text: 'utilise', entry: 'utilise' }]],
	['camelCase holds the word',              'utiliseTool',                               []],
	['a CJK letter glued to the word',        '工utilise',                             []],
	['em dashes glue the word',               'we—utilise—it',                   []],
	['a slot around the word',                '${utilise}',                                [{ index: 2, length: 7, text: 'utilise', entry: 'utilise' }]],
	['a shell variable before the word',      '$HOME utilise',                             [{ index: 6, length: 7, text: 'utilise', entry: 'utilise' }]],
	['a version before the word',             'v1.2.3 utilise',                            [{ index: 7, length: 7, text: 'utilise', entry: 'utilise' }]],
	['a hash before the word',                'a1b2c3d utilise',                           [{ index: 8, length: 7, text: 'utilise', entry: 'utilise' }]],
	['a thousands number before the word',    '1,000 utilise',                             [{ index: 6, length: 7, text: 'utilise', entry: 'utilise' }]],
	['a percent before the word',             '50% utilise',                               [{ index: 4, length: 7, text: 'utilise', entry: 'utilise' }]],
	['a price before the word',               '$5 utilise',                                [{ index: 3, length: 7, text: 'utilise', entry: 'utilise' }]],
	['a clock time before the word',          '10:30 utilise',                             [{ index: 6, length: 7, text: 'utilise', entry: 'utilise' }]],
	['an ISO date before the word',           '2026-09-04 utilise',                        [{ index: 11, length: 7, text: 'utilise', entry: 'utilise' }]],
	['a slashed date before the word',        '9/4/2026 utilise',                          [{ index: 9, length: 7, text: 'utilise', entry: 'utilise' }]],
	['an ordinal before the word',            '3rd utilise',                               [{ index: 4, length: 7, text: 'utilise', entry: 'utilise' }]],
	['quotes around the word',                '"utilise"',                                 [{ index: 1, length: 7, text: 'utilise', entry: 'utilise' }]],
	['brackets around the word',              'Do it (utilise) now.',                      [{ index: 7, length: 7, text: 'utilise', entry: 'utilise' }]],
	['an ellipsis on both sides',             '...utilise...',                             [{ index: 3, length: 7, text: 'utilise', entry: 'utilise' }]],
	['a question and an exclamation after',   'utilise?!',                                 [{ index: 0, length: 7, text: 'utilise', entry: 'utilise' }]],
	['the word at the sentence start',        'Utilise the tool.',                         [{ index: 0, length: 7, text: 'Utilise', entry: 'utilise' }]],
	['the word at the sentence end',          'The tool we utilise.',                      [{ index: 12, length: 7, text: 'utilise', entry: 'utilise' }]],
	['ALL CAPS phrase',                       'PRIOR TO noon',                             [{ index: 0, length: 8, text: 'PRIOR TO', entry: 'prior to' }]],
	['Title Case phrase',                     'Prior To noon',                             [{ index: 0, length: 8, text: 'Prior To', entry: 'prior to' }]],
	['a comma breaks the phrase',             'in order, to see',                          []],
	['a period breaks the phrase',            'in order. To see',                          []],
	['the phrase with no punctuation at all', 'Wait in order to',                          [{ index: 5, length: 11, text: 'in order to', entry: 'in order to' }]],
	['two matches of one entry',              'we utilise, and utilise.',                  [{ index: 3, length: 7, text: 'utilise', entry: 'utilise' }, { index: 16, length: 7, text: 'utilise', entry: 'utilise' }]],
	['two phrases in a row',                  'prior to prior to',                         [{ index: 0, length: 8, text: 'prior to', entry: 'prior to' }, { index: 9, length: 8, text: 'prior to', entry: 'prior to' }]],
	['the long entry wins over the short',    'Due to the fact that it rains.',            [{ index: 0, length: 20, text: 'Due to the fact that', entry: 'due to the fact that' }]],
	['a near miss, the word plus a suffix',   'We utilised the tool.',                     []],
	['a near miss, the word plus a prefix',   'We reutilise the tool.',                    []],
	['a near miss, half the phrase',          'Wait in order.',                            []],
	['a near miss, the phrase out of order',  'to order in',                               []],
	['a near miss, a hyphen joins the word',  'we co-utilise it',                          []],
	['a near miss, a digit joins the word',   'utilise2 it',                               []],
	['the phrase across a blank line',        'in order\n\nto see',                        [{ index: 0, length: 12, text: 'in order\n\nto', entry: 'in order to' }]],
]

for (const [name, text, matches] of full) {
	test(`full match: ${name}`, () => {
		const found = phrases(text, list)
		assert.deepEqual(found, matches)
		for (const m of found) assert.equal(text.slice(m.index, m.index + m.length), m.text, 'slice')
	})
}

// Entry lists that are odd. Every row states the whole output.
const lists = [
	// name                                  entries                             text                       matches
	['no entries',                           [],                                 'We utilise it.',           []],
	['an empty entry',                       ['', 'utilise'],                    'We utilise it.',           [{ index: 3, length: 7, text: 'utilise', entry: 'utilise' }]],
	['a whitespace entry',                   ['   ', 'utilise'],                 'We utilise it.',           [{ index: 3, length: 7, text: 'utilise', entry: 'utilise' }]],
	['an entry of punctuation only',         ['---'],                            'We --- it.',               []],
	['the same entry twice',                 ['utilise', 'utilise'],             'We utilise it.',           [{ index: 3, length: 7, text: 'utilise', entry: 'utilise' }]],
	['an entry with edge punctuation',       ['(utilise)'],                      'We utilise it.',           [{ index: 3, length: 7, text: 'utilise', entry: '(utilise)' }]],
	['an entry with a trailing apostrophe',  ["James'"],                         'James drove.',             [{ index: 0, length: 5, text: 'James', entry: "James'" }]],
	['a contraction entry',                  ["don't"],                          "We don't run.",            [{ index: 3, length: 5, text: "don't", entry: "don't" }]],
	['a contraction entry, no match bare',   ["don't"],                          'We dont run.',             []],
	['a number entry',                       ['1,000'],                          'We paid 1,000 now.',       [{ index: 8, length: 5, text: '1,000', entry: '1,000' }]],
	['a version entry',                      ['v1.2.3'],                         'Use v1.2.3 now.',          [{ index: 4, length: 6, text: 'v1.2.3', entry: 'v1.2.3' }]],
	['an entry that is a full URL',          ['https://x.com/a'],                'See https://x.com/a now.', [{ index: 4, length: 15, text: 'https://x.com/a', entry: 'https://x.com/a' }]],
	['a short entry inside a long one',      ['order to', 'in order to'],        'Wait in order to see.',    [{ index: 5, length: 11, text: 'in order to', entry: 'in order to' }]],
	['a Set of entries',                     new Set(['utilise']),               'We utilise it.',           [{ index: 3, length: 7, text: 'utilise', entry: 'utilise' }]],
]

for (const [name, entries, text, matches] of lists) {
	test(`entry list: ${name}`, () => {
		const found = phrases(text, entries)
		assert.deepEqual(found, matches)
		for (const m of found) assert.equal(text.slice(m.index, m.index + m.length), m.text, 'slice')
	})
}

// The text argument with a wrong type. The code coerces the text only, so a number becomes its digits.
const texts = [
	// name                    text          entries       matches
	['null text',              null,         ['utilise'],  []],
	['undefined text',         undefined,    ['utilise'],  []],
	['a number as text',       1000,         ['1000'],     [{ index: 0, length: 4, text: '1000', entry: '1000' }]],
]

for (const [name, text, entries, matches] of texts) {
	test(`text type: ${name}`, () => assert.deepEqual(phrases(text, entries), matches))
}

test('a string as the entry list gives one entry per letter', () => {
	assert.deepEqual(phrases('We utilise it.', 'utilise'), [])
	assert.deepEqual(phrases('u', 'utilise'), [{ index: 0, length: 1, text: 'u', entry: 'u' }])
})

test('every match slices back to its own text', () => {
	for (const [, text] of full) {
		if (typeof text !== 'string') continue
		for (const m of phrases(text, list)) assert.equal(text.slice(m.index, m.index + m.length), m.text)
	}
	for (const [, entries, text] of lists) {
		for (const m of phrases(text, entries)) assert.equal(text.slice(m.index, m.index + m.length), m.text)
	}
})

// without: the entries not in allow, compared as keys
test('without drops the allowed entries, case folded', () => {
	assert.deepEqual(without(['shut down', 'top up', 'utilize'], ['Shut Down', 'utilize.']), ['top up'])
	assert.deepEqual(without(['shut down'], ['x']), ['shut down'])
})
test('without returns the entries as given when allow is empty or missing', () => {
	const list = ['shut down']
	assert.equal(without(list, []), list)
	assert.equal(without(list, null), list)
	assert.equal(without(list), list)
})
