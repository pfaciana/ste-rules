import { test } from 'node:test'
import assert from 'node:assert/strict'
import { approvedWords } from './approvedWords.js'
import { sentenceAt } from '../Sentences.js'

// A small approved list stands in for the caller's dictionary.
const approved = ['remove', 'the', 'tool', 'flat', 'quickly', 'an', 'area', 'open', 'and', 'close', 'unit', 'put', 'above', 'they', 'attach', 'add', 'to']

// Every match, exactly: [index, text]. A word passes when the list holds it, a technical name allows it,
// it starts with a digit, or it is one character long. With no list, the rule is off.
const cases = [
	// name                                     text                                    options                                     matches
	['empty',                                   '',                                     { approved },                               []],
	['no options object: the rule is off',      'Remove the widget.',                   undefined,                                  []],
	['no approved list: the rule is off',       'Remove the widget.',                   {},                                         []],
	['a Set works as the list',                 'Remove the widget.',                   { approved: new Set(approved) },            [[11, 'widget']]],
	['all words approved',                      'Remove the tool.',                     { approved },                               []],
	['one word not approved',                   'Remove the widget.',                   { approved },                               [[11, 'widget']]],
	['an empty technical name list',            'Remove the widget.',                   { approved, technicalNames: [] },           [[11, 'widget']]],
	['match at the very start',                 'Widget the tool.',                     { approved },                               [[0, 'Widget']]],
	['match at the very end',                   'Remove the widget',                    { approved },                               [[11, 'widget']]],
	['two matches, exact places',               'Remove the widget and the gizmo.',     { approved },                               [[11, 'widget'], [26, 'gizmo']]],
	['match after a line break',                'Remove the tool.\nRemove the widget.', { approved },                               [[28, 'widget']]],
	['punctuation next to the match',           'Remove the (widget).',                 { approved },                               [[12, 'widget']]],
	['near miss: punctuation is not a word',    'Remove, the flat tool: open.',         { approved },                               []],
	['upper case, all approved',                'REMOVE THE FLAT TOOL.',                { approved },                               []],
	['upper case, not approved',                'REMOVE THE WIDGET.',                   { approved },                               [[11, 'WIDGET']]],
	['the list is case folded',                 'Remove the tool.',                     { approved: ['REMOVE', 'The', 'tool'] },    []],
	['a technical name passes',                 'Remove the widget.',                   { approved, technicalNames: ['widget'] },   []],
	['a technical name is case folded',         'Remove the WIDGET.',                   { approved, technicalNames: ['Widget'] },   []],
	['a technical name covers only itself',     'Remove the widget gizmo.',             { approved, technicalNames: ['widget'] },   [[18, 'gizmo']]],
	['a word that starts with a digit passes',  'Add 3.5 to the tool.',                 { approved },                               []],
	['digits then letters, digit first',        'Add 3rd to the tool.',                 { approved },                               []],
	['a number with a sign passes',             'Add $5.00 and 50% to the tool.',       { approved },                               []],
	['a letter before the digit does not pass', 'Add a3 to the tool.',                  { approved },                               [[4, 'a3']]],
	['one character passes',                    'Remove the x tool.',                   { approved },                               []],
	['two characters, one past the limit',      'Remove the xy tool.',                  { approved },                               [[11, 'xy']]],
	['a hyphen keeps one word',                 'Remove the flat-tool.',                { approved },                               [[11, 'flat-tool']]],
	['an apostrophe keeps one word',            "Remove the tool's unit.",              { approved },                               [[11, "tool's"]]],
	// --- empty and tiny -----------------------------------------------------------------------------------------
	// name                                     text                                    options                                     matches
	['whitespace only',                        '   \t\n ',                              { approved },                               []],
	['one letter alone',                       'x',                                     { approved },                               []],
	['one word alone',                         'widget',                                { approved },                               [[0, 'widget']]],
	['no punctuation at all',                  'Remove the widget',                     { approved },                               [[11, 'widget']]],

	// --- whitespace and Unicode ---------------------------------------------------------------------------------
	['tabs between the words',                 'Remove\tthe\twidget.',                  { approved },                               [[11, 'widget']]],
	['a CRLF between the lines',                'Remove the widget.\r\nClose the unit.', { approved },                              [[11, 'widget']]],
	['a no-break space between the words',     'Remove\u00A0the widget.',                { approved },                              [[11, 'widget']]],
	['accents',                                'Café ouvre la porte.',                  { approved },                               [[0, 'Café'], [5, 'ouvre'], [11, 'la'], [14, 'porte']]],
	['Cyrillic',                               'Удали виджет.',                         { approved },                               [[0, 'Удали'], [6, 'виджет']]],
	['CJK with no spaces is one word',         '運行測試。',                              { approved },                               [[0, '運行測試']]],
	['an emoji next to the match',             'Remove the widget 🚀 now.',              { approved },                              [[11, 'widget'], [21, 'now']]],

	// --- markdown leftovers -------------------------------------------------------------------------------------
	['a heading line',                         '## Widget notes',                       { approved },                               [[3, 'Widget'], [10, 'notes']]],
	['a bullet item',                          '- widget item',                         { approved },                               [[2, 'widget'], [9, 'item']]],
	['a numbered item',                        '1. widget item',                        { approved },                               [[3, 'widget'], [10, 'item']]],
	['bold marks around the word',             '**widget**',                            { approved },                               [[2, 'widget']]],
	['backtick code around the word',          'Use `widget` here.',                    { approved },                               [[0, 'Use'], [5, 'widget'], [13, 'here']]],
	['a markdown link is one word',            '[widget](https://x.com/widget)',        { approved },                               [[1, 'widget](https://x.com/widget']]],
	['a table row',                            '| a | widget |',                        { approved },                               [[6, 'widget']]],
	['a block quote',                          '> widget quote',                        { approved },                               [[2, 'widget'], [9, 'quote']]],

	// --- code and URLs ------------------------------------------------------------------------------------------
	['snake_case and camelCase',               'Remove snake_case and camelCase.',      { approved },                               [[7, 'snake_case'], [22, 'camelCase']]],
	['a Windows path is one word',             'Open C:\\path\\file.txt now.',          { approved },                               [[5, 'C:\\path\\file.txt'], [22, 'now']]],
	['an https URL is one word',               'Read https://x.com/a/b now.',           { approved },                               [[0, 'Read'], [5, 'https://x.com/a/b'], [23, 'now']]],
	['an email address is one word',           'Mail admin@x.com now.',                 { approved },                               [[0, 'Mail'], [5, 'admin@x.com'], [17, 'now']]],
	['a version number',                       'Install v1.2.3 now.',                   { approved },                               [[0, 'Install'], [8, 'v1.2.3'], [15, 'now']]],
	['a hash that starts with a digit passes', 'Check 9f3a1c2 now.',                    { approved },                               [[0, 'Check'], [14, 'now']]],
	['a slot and a variable lose their marks', 'Use ${slot} and $HOME.',                { approved },                               [[0, 'Use'], [6, 'slot'], [17, 'HOME']]],

	// --- numbers and dates --------------------------------------------------------------------------------------
	['a grouped number passes',                'Add 1,000 to the unit.',                { approved },                               []],
	['a percent passes',                       'Add 50% to the unit.',                  { approved },                               []],
	['a price passes',                         'Add $5 to the unit.',                   { approved },                               []],
	['a clock time passes',                    'Wait 10:30.',                           { approved },                               [[0, 'Wait']]],
	['an ISO date passes',                     'Ship 2026-09-04.',                      { approved },                               [[0, 'Ship']]],
	['a slashed date passes',                  'Ship 9/4/2026.',                        { approved },                               [[0, 'Ship']]],
	['an ordinal passes',                      'Add 3rd to the unit.',                  { approved },                               []],

	// --- punctuation --------------------------------------------------------------------------------------------
	['quotes around the match',                '"widget"',                              { approved },                               [[1, 'widget']]],
	['brackets around the match',              '(widget)',                              { approved },                               [[1, 'widget']]],
	['an ellipsis after the match',            'widget...',                             { approved },                               [[0, 'widget']]],
	['an em dash next to the match',           'Remove the widget — now.',              { approved },                               [[11, 'widget'], [20, 'now']]],
	['a question and an exclamation mark',     'Widget?!',                              { approved },                               [[0, 'Widget']]],
	['punctuation alone is no word',           '-- ** ...',                             { approved },                               []],

	// --- case ---------------------------------------------------------------------------------------------------
	['all capitals',                           'WIDGET GIZMO',                          { approved },                               [[0, 'WIDGET'], [7, 'GIZMO']]],
	['title case',                             'Widget Gizmo',                          { approved },                               [[0, 'Widget'], [7, 'Gizmo']]],
	['camelCase is one word',                  'camelCaseWidget',                       { approved },                               [[0, 'camelCaseWidget']]],
	['the approved word in every case passes', 'the THE The',                           { approved },                               []],

	// --- contractions -------------------------------------------------------------------------------------------
	['it is contracted',                       "It's a widget.",                        { approved },                               [[0, "It's"], [7, 'widget']]],
	['is not contracted',                      "The widget isn't flat.",                { approved },                               [[4, 'widget'], [11, "isn't"]]],
	['they are contracted',                    "They're widgets.",                      { approved },                               [[0, "They're"], [8, 'widgets']]],
	['do not contracted',                      "Don't remove it.",                      { approved },                               [[0, "Don't"], [13, 'it']]],
	['a possessive with apostrophe s',         "The tool's unit.",                      { approved },                               [[4, "tool's"]]],
	['a bare apostrophe is trimmed',           "James' unit.",                          { approved },                               [[0, 'James']]],

	// --- traps: it looks like a hit and it is not ----------------------------------------------------------------
	['a number with a comma passes',           '1,000',                                 { approved },                               []],
	['a digit first, then letters, passes',    '3rd',                                   { approved },                               []],
	['a hash of digits and letters passes',    '0xdeadbeef',                            { approved },                               []],
	['a single letter with a period passes',   'Press Q.',                              { approved: [...approved, 'press'] },       []],
	['punctuation only is no word',            '...',                                  { approved },                               []],
	['an approved word in capitals passes',    'REMOVE THE FLAT UNIT.',                 { approved },                               []],

	// --- traps: it looks fine and it is a hit --------------------------------------------------------------------
	['a plain English word off the list',      'Remove the file.',                      { approved },                               [[11, 'file']]],
	['a plural of an approved word',           'Remove the tools.',                     { approved },                               [[11, 'tools']]],
	['a past tense of an approved word',       'The tool opened.',                      { approved },                               [[9, 'opened']]],
	['an -ing form of an approved word',       'Removing the unit.',                    { approved },                               [[0, 'Removing']]],
	['a hyphen joins two approved words',      'the open-and-close unit',               { approved },                               [[4, 'open-and-close']]],
	['a letter before the digits',             'Add a3b to the unit.',                  { approved },                               [[4, 'a3b']]],

]

for (const [name, text, options, matches] of cases) {
	test(name, () => {
		const found = approvedWords(text, options)
		assert.deepEqual(found.map(m => [m.index, m.text]), matches)
		for (const m of found) assert.equal(text.slice(m.index, m.index + m.length), m.text, 'length')
	})
}

const fields = [
	// text                                  field       value
	['Remove the widget.',                   'length',   6],
	['Remove the WIDGET.',                   'text',     'WIDGET'],
	['Remove the tool. Remove the widget.',  'context',  'Remove the widget.'],
	['widget',                               'context',  'widget'],
	['Remove the widget.',                   'message',  '"widget" is not an approved word. Use a dictionary word, or add it as a technical name.'],
	['Remove the WIDGET.',                   'message',  '"WIDGET" is not an approved word. Use a dictionary word, or add it as a technical name.'],
]

for (const [text, field, value] of fields) {
	test(`the match carries ${field}`, () => assert.deepEqual(approvedWords(text, { approved })[0][field], value))
}

// The whole output, every field but message
const outputs = [
	// text                                     matches                                                                                                                                                    options
	['Remove the tool.',                        []],
	['Remove the widget.',                      [{ index: 11, length: 6, text: 'widget', context: 'Remove the widget.' }]],
	['Remove the widget and the gizmo.',        [{ index: 11, length: 6, text: 'widget', context: 'Remove the widget and the gizmo.' }, { index: 26, length: 5, text: 'gizmo', context: 'Remove the widget and the gizmo.' }]],
	['Remove the tool.\nRemove the widget.',    [{ index: 28, length: 6, text: 'widget', context: 'Remove the widget.' }]],
	['Remove the widget.',                      [],                                                                                                                                                         { technicalNames: ['widget'] }],
	['Remove the widget and the gizmo.',        [{ index: 26, length: 5, text: 'gizmo', context: 'Remove the widget and the gizmo.' }],                                                                      { technicalNames: ['WIDGET'] }],
]

for (const [text, matches, options] of outputs) {
	test(`approvedWords output for ${JSON.stringify(text)}`, () => assert.deepEqual(approvedWords(text, { approved, ...options }).map(({ message, ...m }) => m), matches))
}

// Every match of every row above: every field, and the slice identity text.slice(index, index + length) === text.
for (const [name, text, options] of cases) {
	test(`every field is exact for "${name}"`, () => {
		for (const m of approvedWords(text, options)) {
			assert.deepEqual(Object.keys(m).sort(), ['context', 'index', 'length', 'message', 'text'])
			assert.equal(text.slice(m.index, m.index + m.length), m.text, 'slice identity')
			assert.equal(m.length, m.text.length, 'length is the text length')
			assert.equal(m.context, sentenceAt(text, m.index), 'context is the sentence that holds the match')
			assert.equal(m.message, `"${m.text}" is not an approved word. Use a dictionary word, or add it as a technical name.`, 'message')
		}
	})
}

// The text is coerced. The rule reads text only.
const inputs = [
	// name                            input                       matches
	['null',                          null,                        []],
	['undefined',                     undefined,                   []],
	['a number',                      123,                         []],
	['an array of one sentence',      ['Remove the widget.'],      [[11, 'widget']]],
]

for (const [name, input, matches] of inputs) {
	test(`the input is coerced to text: ${name}`, () => {
		assert.deepEqual(approvedWords(input, { approved }).map(m => [m.index, m.text]), matches)
	})
}

// The options knobs. An empty list is a list: the rule stays on and every word fails.
const knobs = [
	// name                                    options                                        matches
	['an empty array list',                    { approved: [] },                              [[0, 'Remove'], [7, 'the'], [11, 'widget']]],
	['an empty Set list',                      { approved: new Set() },                       [[0, 'Remove'], [7, 'the'], [11, 'widget']]],
	['an empty string list is off',            { approved: '' },                              []],
	['a zero list is off',                     { approved: 0 },                               []],
	['a string list gives single letters',     { approved: 'the tool' },                      [[0, 'Remove'], [7, 'the'], [11, 'widget']]],
	['technical names only, no list, is off',  { technicalNames: ['widget'] },                []],
	['a technical name of one letter',         { approved, technicalNames: ['x'] },           [[11, 'widget']]],
	['a technical name with punctuation',      { approved, technicalNames: ['(widget).'] },   []],
]

for (const [name, options, matches] of knobs) {
	test(`options: ${name}`, () => {
		assert.deepEqual(approvedWords('Remove the widget.', options).map(m => [m.index, m.text]), matches)
	})
}

// Length extremes.
test('a word exactly at the one letter pass', () => {
	assert.deepEqual(approvedWords('a', { approved }), [])
})

test('a word one letter over the pass', () => {
	assert.deepEqual(approvedWords('ab', { approved }).map(m => [m.index, m.length, m.text]), [[0, 2, 'ab']])
})

test('a long paragraph of many bad words', () => {
	const one = 'Remove the widget. '
	const found = approvedWords(one.repeat(200), { approved })
	assert.equal(found.length, 200)
	assert.deepEqual(found[0], { index: 11, length: 6, text: 'widget', context: 'Remove the widget.', message: '"widget" is not an approved word. Use a dictionary word, or add it as a technical name.' })
	assert.equal(found[199].index, 199 * one.length + 11)
})
