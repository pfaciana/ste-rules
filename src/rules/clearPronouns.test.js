import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clearPronouns } from './clearPronouns.js'

// Every match, exactly: [index, text, pronoun, verb].
const cases = [
	// name                                text                                          matches
	['empty',                              '',                                           []],
	['bare this',                          'This breaks the build.',                     [[0, 'This breaks', 'This', 'breaks']]],
	['pronoun it',                         'It is slow.',                                [[0, 'It is', 'It', 'is']]],
	['pronoun these',                      'These need review.',                         [[0, 'These need', 'These', 'need']]],
	['pronoun those',                      'Those seem wrong.',                          [[0, 'Those seem', 'Those', 'seem']]],
	['pronoun they',                       'They fail often.',                           [[0, 'They fail', 'They', 'fail']]],
	['verb list, past tense entry',        'It happened last week.',                     [[0, 'It happened', 'It', 'happened']]],
	['verb list, does',                    'It does nothing.',                           [[0, 'It does', 'It', 'does']]],
	['this plus a noun',                   'This rule breaks the build.',                []],
	['these plus a noun',                  'These tests fail.',                          []],
	['these plus a hyphenated noun',       'These e-mails fail.',                        []],
	['not a pronoun',                      'We need a fix.',                             []],
	['pronoun then a word off the list',   'It never works.',                            []],
	['pronoun with no second word',        'This.',                                      []],
	['pronoun alone',                      'It',                                         []],
	['pronoun mid sentence is a limit',    'The team says this is wrong.',               []],
	['pronoun after a verb',               'Run it. The parser is slow.',                []],
	['upper case',                         'IT IS SLOW.',                                [[0, 'IT IS', 'IT', 'IS']]],
	['at the very start',                  'This means a bug and more.',                 [[0, 'This means', 'This', 'means']]],
	['at the very end',                    'The build fails. This means',                [[17, 'This means', 'This', 'means']]],
	['two matches, exact places',          'It fails. This means a bug.',                [[0, 'It fails', 'It', 'fails'], [10, 'This means', 'This', 'means']]],
	['two paragraphs, exact places',       'It fails.\n\nThis means a bug.',             [[0, 'It fails', 'It', 'fails'], [11, 'This means', 'This', 'means']]],
	['across a line break',                'It\nis slow.',                               [[0, 'It\nis', 'It', 'is']]],
	['quotes around the sentence',         '"It is slow."',                              [[1, 'It is', 'It', 'is']]],
	['comma inside the match',             'It, is slow.',                               [[0, 'It, is', 'It', 'is']]],
	['a dash before the pronoun',          '- It is slow.',                              [[2, 'It is', 'It', 'is']]],
	['after a question mark',              'Does it work? It seems fine.',               [[14, 'It seems', 'It', 'seems']]],
	['two sentences, one bare',            'The build fails. This means a bug.',         [[17, 'This means', 'This', 'means']]],

	// empty and tiny
	// name                                text                                          matches
	['spaces only',                        '   ',                                        []],
	['a tab and a line break only',        '\t\n ',                                      []],
	['one letter',                         'A',                                          []],
	['one word, no punctuation',           'works',                                      []],
	['no punctuation at all',              'It is slow',                                 [[0, 'It is', 'It', 'is']]],

	// whitespace and Unicode
	// name                                text                                          matches
	['a tab inside the match',             'It\tis slow.',                               [[0, 'It\tis', 'It', 'is']]],
	['two spaces inside the match',        'It  is slow.',                               [[0, 'It  is', 'It', 'is']]],
	['CRLF between the paragraphs',        'It fails.\r\n\r\nThis means a bug.',         [[0, 'It fails', 'It', 'fails'], [13, 'This means', 'This', 'means']]],
	['a no-break space inside the match',  'It\u00A0is slow.',                           [[0, 'It\u00A0is', 'It', 'is']]],
	['an accent breaks the key',           'Ít is slow.',                                []],
	['Cyrillic text',                      'Это ломает сборку.',                         []],
	['CJK text',                           'これは壊れます。',                                  []],
	['an emoji before the match',          '🎉 It is slow.',                             [[3, 'It is', 'It', 'is']]],
	['an emoji stuck to the pronoun',      '🎉It is slow.',                              [[2, 'It is', 'It', 'is']]],

	// markdown leftovers
	// name                                text                                          matches
	['a heading marker',                   '## It is slow.',                             [[3, 'It is', 'It', 'is']]],
	['a numbered list marker',             '1. It is slow.',                             []],
	['bold marks around the pronoun',      '**It** is slow.',                            [[2, 'It** is', 'It', 'is']]],
	['backtick code around the pronoun',   '`it` is broken.',                            [[1, 'it` is', 'it', 'is']]],
	['a link swallows the pronoun',        '[It](url) is slow.',                         []],
	['a table row',                        '| It | is |',                                [[2, 'It | is', 'It', 'is']]],
	['a quote marker',                     '> It is slow.',                              [[2, 'It is', 'It', 'is']]],

	// code and URLs
	// name                                text                                          matches
	['snake case looks like a pronoun',    'this_file works.',                           []],
	['camel case looks like a pronoun',    'thisMeans a bug.',                           []],
	['a Windows path after the match',     'It is at C:\\Users\\Name.',                  [[0, 'It is', 'It', 'is']]],
	['a URL after the match',              'It is https://example.com/it now.',          [[0, 'It is', 'It', 'is']]],
	['an email after the match',           'It is dev@example.com now.',                 [[0, 'It is', 'It', 'is']]],
	['a version after the match',          'It has v1.2.3 installed.',                   [[0, 'It has', 'It', 'has']]],
	['a hash after the match',             'It is a1b2c3d now.',                         [[0, 'It is', 'It', 'is']]],
	['a slot after the match',             'It is ${slot} now.',                         [[0, 'It is', 'It', 'is']]],
	['a shell variable after the match',   'It is $HOME now.',                           [[0, 'It is', 'It', 'is']]],

	// numbers and dates
	// name                                text                                          matches
	['a thousands comma',                  'It is 1,000 lines.',                         [[0, 'It is', 'It', 'is']]],
	['a percent',                          'It is 50% done.',                            [[0, 'It is', 'It', 'is']]],
	['a price and a verb off the list',    'It costs $5.',                               []],
	['a clock time',                       'It is 10:30 now.',                           [[0, 'It is', 'It', 'is']]],
	['an ISO date',                        'It has 2026-09-04 in the log.',              [[0, 'It has', 'It', 'has']]],
	['a slash date',                       'It is 9/4/2026 today.',                      [[0, 'It is', 'It', 'is']]],
	['an ordinal',                         'They are 3rd in line.',                      [[0, 'They are', 'They', 'are']]],

	// punctuation
	// name                                text                                          matches
	['brackets around the pronoun',        '(It) is slow.',                              [[1, 'It) is', 'It', 'is']]],
	['quotes around the pronoun only',     '"It" means trouble.',                        [[1, 'It" means', 'It', 'means']]],
	['an ellipsis at the end',             'It is slow…',                                [[0, 'It is', 'It', 'is']]],
	['an em dash inside the sentence',     'It is slow — really.',                       [[0, 'It is', 'It', 'is']]],
	['a question mark and a bang',         'It is slow?!',                               [[0, 'It is', 'It', 'is']]],
	['a match after a question',           'Why? It works!',                             [[5, 'It works', 'It', 'works']]],
	['an inverted question mark',          '¿It is slow?',                               [[1, 'It is', 'It', 'is']]],
	['a hash stuck to the pronoun',        '#It is slow.',                               [[1, 'It is', 'It', 'is']]],

	// case
	// name                                text                                          matches
	['all caps',                           'THIS BREAKS THE BUILD.',                     [[0, 'THIS BREAKS', 'THIS', 'BREAKS']]],
	['title case',                         'This Means A Bug.',                          [[0, 'This Means', 'This', 'Means']]],
	['lower case at the start',            'it is slow.',                                [[0, 'it is', 'it', 'is']]],
	['camel case joins the two words',     'itIs slow.',                                 []],

	// contractions
	// name                                text                                          matches
	['a contracted pronoun',               "It's slow.",                                 []],
	['a contracted verb',                  "It isn't slow.",                             []],
	['they are contracted',                "They're broken.",                            []],
	['does not contracted',                "It doesn't work.",                           []],
	['a possessive later in the sentence', "It is the tool's file.",                     [[0, 'It is', 'It', 'is']]],
	['a plural possessive later',          "This is James' file.",                       [[0, 'This is', 'This', 'is']]],

	// traps: it looks like a hit, it is not
	// name                                text                                          matches
	['its is not it',                      'Its meaning is clear.',                      []],
	['a hyphen joins the two words',       'This-is broken.',                            []],
	['a digit on the pronoun',             'These2 need review.',                        []],
	['a period joins the two words',       'It.is broken.',                              []],
	['a pronoun then a noun',              'Those files need review.',                   []],
	['an adverb splits the pair',          'They rarely fail.',                          []],
	['a pronoun then a preposition',       'It in the log.',                             []],

	// traps: it looks clean, it is a hit
	// name                                text                                          matches
	['the passive voice still hits',       'It has been moved.',                         [[0, 'It has', 'It', 'has']]],
	['a modal verb',                       'This will break the build.',                 [[0, 'This will', 'This', 'will']]],
	['a polite sentence',                  'This helps a lot.',                          [[0, 'This helps', 'This', 'helps']]],
	['a long sentence still hits',         'These need review from the team before the release goes out today.',  [[0, 'These need', 'These', 'need']]],
	['a second paragraph hits',            'Fix the import.\n\nIt breaks the build.',    [[17, 'It breaks', 'It', 'breaks']]],
	['a hit after a heading line',         '## Result\n\nIt fails.',                     [[11, 'It fails', 'It', 'fails']]],
]

for (const [name, text, matches] of cases) {
	test(name, () => {
		const found = clearPronouns(text)
		assert.deepEqual(found.map(m => [m.index, m.text, m.pronoun, m.verb]), matches)
		for (const m of found) assert.equal(text.slice(m.index, m.index + m.length), m.text, 'length')
	})
}

const fields = [
	// text                                  field       value
	['This breaks the build.',               'pronoun',  'This'],
	['This breaks the build.',               'verb',     'breaks'],
	['This breaks the build.',               'context',  'This breaks the build.'],
	['The build fails. This means a bug.',   'context',  'This means a bug.'],
	['This breaks the build.',               'message',  'Say what "This" refers to: "This <noun> breaks".'],
	['IT IS SLOW.',                          'message',  'Say what "IT" refers to: "IT <noun> IS".'],
	['They fail often.',                     'message',  'Say what "They" refers to: "They <noun> fail".'],
	['`it` is broken.',                      'message',  'Say what "it" refers to: "it <noun> is".'],
	['**It** is slow.',                      'message',  'Say what "It" refers to: "It <noun> is".'],
	['It has been moved.',                   'message',  'Say what "It" refers to: "It <noun> has".'],
	['## It is slow.',                       'context',  '## It is slow.'],
	['| It | is |',                          'context',  '| It | is |'],
	['Why? It works!',                       'context',  'It works!'],
]

for (const [text, field, value] of fields) {
	test(`the match carries ${field}`, () => assert.deepEqual(clearPronouns(text)[0][field], value))
}

// The whole output, every field but message
const outputs = [
	// text                                 matches
	['The build fails.',                    []],
	['This breaks the build.',              [{ index: 0, length: 11, text: 'This breaks', context: 'This breaks the build.', pronoun: 'This', verb: 'breaks' }]],
	['It, is slow.',                        [{ index: 0, length: 6, text: 'It, is', context: 'It, is slow.', pronoun: 'It', verb: 'is' }]],
	['IT IS SLOW.',                         [{ index: 0, length: 5, text: 'IT IS', context: 'IT IS SLOW.', pronoun: 'IT', verb: 'IS' }]],
	['Does it work? It seems fine.',        [{ index: 14, length: 8, text: 'It seems', context: 'It seems fine.', pronoun: 'It', verb: 'seems' }]],
	['It is slow. They fail often.',        [{ index: 0, length: 5, text: 'It is', context: 'It is slow.', pronoun: 'It', verb: 'is' }, { index: 12, length: 9, text: 'They fail', context: 'They fail often.', pronoun: 'They', verb: 'fail' }]],
	// text                                 matches
	['## It is slow.',                      [{ index: 3, length: 5, text: 'It is', context: '## It is slow.', pronoun: 'It', verb: 'is' }]],
	['**It** is slow.',                     [{ index: 2, length: 7, text: 'It** is', context: '**It** is slow.', pronoun: 'It', verb: 'is' }]],
	['`it` is broken.',                     [{ index: 1, length: 6, text: 'it` is', context: '`it` is broken.', pronoun: 'it', verb: 'is' }]],
	['| It | is |',                         [{ index: 2, length: 7, text: 'It | is', context: '| It | is |', pronoun: 'It', verb: 'is' }]],
	['(It) is slow.',                       [{ index: 1, length: 6, text: 'It) is', context: '(It) is slow.', pronoun: 'It', verb: 'is' }]],
	['It is slow.',                   [{ index: 0, length: 5, text: 'It is', context: 'It is slow.', pronoun: 'It', verb: 'is' }]],
	['Why? It works!',                      [{ index: 5, length: 8, text: 'It works', context: 'It works!', pronoun: 'It', verb: 'works' }]],
	['It fails.\r\n\r\nThis means a bug.',  [{ index: 0, length: 8, text: 'It fails', context: 'It fails.', pronoun: 'It', verb: 'fails' }, { index: 13, length: 10, text: 'This means', context: 'This means a bug.', pronoun: 'This', verb: 'means' }]],
]

for (const [text, matches] of outputs) {
	test(`clearPronouns output for ${JSON.stringify(text)}`, () => assert.deepEqual(clearPronouns(text).map(({ message, ...m }) => m), matches))
}

// Every match of every row must point at its own text.
test('index and length always cut the match text', () => {
	for (const [name, text] of cases) {
		for (const m of clearPronouns(text)) assert.equal(text.slice(m.index, m.index + m.length), m.text, name)
	}
	for (const [text] of outputs) {
		for (const m of clearPronouns(text)) assert.equal(text.slice(m.index, m.index + m.length), m.text, text)
	}
})

// The rule takes no options. A second argument changes nothing, and a non-string input is coerced.
const inputs = [
	// name                        call                                            matches
	['no argument',                () => clearPronouns(),                          []],
	['undefined',                  () => clearPronouns(undefined),                 []],
	['null',                       () => clearPronouns(null),                      []],
	['a number',                   () => clearPronouns(123),                       []],
	['an object',                  () => clearPronouns({}),                        []],
	['an array of one string',     () => clearPronouns(['It is slow.']),           [[0, 'It is', 'It', 'is']]],
	['an extra option object',     () => clearPronouns('It is slow.', {}),         [[0, 'It is', 'It', 'is']]],
	['an extra zero knob',         () => clearPronouns('It is slow.', { max: 0 }), [[0, 'It is', 'It', 'is']]],
	['an extra wrong type knob',   () => clearPronouns('It is slow.', 'nonsense'), [[0, 'It is', 'It', 'is']]],
]

for (const [name, call, matches] of inputs) {
	test(`input: ${name}`, () => assert.deepEqual(call().map(m => [m.index, m.text, m.pronoun, m.verb]), matches))
}

test('a long paragraph still reports one match', () => {
	const text = 'It is ' + 'slow and old and wrong '.repeat(200) + 'today.'
	assert.deepEqual(clearPronouns(text).map(m => [m.index, m.text]), [[0, 'It is']])
})
