import { test } from 'node:test'
import assert from 'node:assert/strict'
import { words, wordCount, strip, key } from './Words.js'

// A word is a whole run of non-whitespace. Every row: the words, in order. Nothing inside a run is cut.
const cases = [
	// name                                   text                                            words
	// edges
	['empty',                                 '',                                             []],
	['whitespace only',                       ' \t\n',                                        []],
	['one letter',                            'a',                                            ['a']],
	['one digit',                             '7',                                            ['7']],
	['tabs and many spaces',                  'Run\t\tthe   tests',                           ['Run', 'the', 'tests']],
	['line breaks',                           'Run\nthe\r\ntests',                            ['Run', 'the', 'tests']],
	['a no-break space is a separator',       'Run\u00A0the tests',                           ['Run', 'the', 'tests']],
	['leading and trailing space',            '  Run the  ',                                  ['Run', 'the']],
	// punctuation stays on the run
	['a comma and a period stay',             'Run, then stop.',                              ['Run,', 'then', 'stop.']],
	['quotes and brackets stay',              '"run" (now.) [it]',                            ['"run"', '(now.)', '[it]']],
	['punctuation alone is not a word',       'a - b ... c',                                  ['a', 'b', 'c']],
	['punctuation only, no words',            '... --- ??? ** #',                             []],
	['an emoji alone is not a word',          'Done \u{1F44D} now',                           ['Done', 'now']],
	['markdown leftovers stay on a word',     '**bold** `code` ## Title',                     ['**bold**', '`code`', 'Title']],
	// nothing inside a run is cut
	['an apostrophe',                         "Don't stop the tool's run",                    ["Don't", 'stop', 'the', "tool's", 'run']],
	['a hyphen',                              'Use e-mail and well-known',                    ['Use', 'e-mail', 'and', 'well-known']],
	['a period inside',                       'Node.js and www.x.org',                        ['Node.js', 'and', 'www.x.org']],
	['an underscore, a plus, a hash',         'snake_case C++ C# #123 a+b',                   ['snake_case', 'C++', 'C#', '#123', 'a+b']],
	['a colon, a slash, a backslash',         '10:30 foo::bar src/foo.js C:\\Users\\x',       ['10:30', 'foo::bar', 'src/foo.js', 'C:\\Users\\x']],
	['a URL and an email',                    'See https://example.com/a?b=c#d or me@x.test', ['See', 'https://example.com/a?b=c#d', 'or', 'me@x.test']],
	['numbers with signs',                    '1,000 50% $5.00 -1 1-5 v1.2.3 2026-09-04',     ['1,000', '50%', '$5.00', '-1', '1-5', 'v1.2.3', '2026-09-04']],
	['a template slot and a variable',        'Use ${limit} and $HOME',                       ['Use', '${limit}', 'and', '$HOME']],
	// scripts and symbols
	['unicode letters',                       'Caf\u00E9 \u00FCber na\u00EFve',               ['Caf\u00E9', '\u00FCber', 'na\u00EFve']],
	['other scripts',                         '\u041F\u0440\u0438\u0432\u0435\u0442 \u65E5\u672C\u8A9E \u05E9\u05DC\u05D5\u05DD', ['\u041F\u0440\u0438\u0432\u0435\u0442', '\u65E5\u672C\u8A9E', '\u05E9\u05DC\u05D5\u05DD']],
	['an emoji inside stays',                 'a\u{1F600}b',                                  ['a\u{1F600}b']],
	['all caps',                              'RUN THE TESTS',                                ['RUN', 'THE', 'TESTS']],
]

for (const [name, text, expected] of cases) {
	test(name, () => {
		const found = words(text)
		assert.deepEqual(found.map(w => w.text), expected)
		for (const w of found) assert.equal(text.slice(w.index, w.index + w.text.length), w.text, 'index points at the run')
	})
}

test('wordCount counts runs', () => {
	assert.equal(wordCount('Run the tests; then commit.'), 5)
	assert.equal(wordCount('- item'), 1)
})

test('index points into the input', () => {
	assert.equal(words('  Run the')[1].index, 6)
})

// The lookup form. strip keeps case, key folds it. Both cut only the ends.
const keys = [
	// text            strip          key
	['Stop.',          'Stop',        'stop'],
	['(GC),',          'GC',          'gc'],
	['"Run"',          'Run',         'run'],
	["tool's",         "tool's",      "tool's"],
	['e-mail',         'e-mail',      'e-mail'],
	['$5.00',          '5.00',        '5.00'],
	['50%',            '50',          '50'],
	['C++',            'C',           'c'],
	['#123',           '123',         '123'],
	['snake_case',     'snake_case',  'snake_case'],
	['...',            '',            ''],
	['',               '',            ''],
	['\u201CRun\u201D', 'Run',        'run'],
	['Caf\u00E9!',     'Caf\u00E9',   'caf\u00E9'],
]

for (const [text, s, k] of keys) {
	test(`strip and key of ${JSON.stringify(text)}`, () => {
		assert.equal(strip(text), s)
		assert.equal(key(text), k)
	})
}

// The one check for the coercion line in every public function: a missing text is the empty text, a number is its string
test('every export takes a missing or non-string text', async () => {
	const ste = await import('../index.js')
	for (const [name, fn] of Object.entries(ste)) {
		if (typeof fn !== 'function') continue
		const args = name === 'phrases' ? [['a']] : name === 'sentenceAt' ? [0] : []
		assert.deepEqual(fn(undefined, ...args), fn('', ...args), `${name}(undefined)`)
		assert.deepEqual(fn(null, ...args), fn('', ...args), `${name}(null)`)
		assert.deepEqual(fn(42, ...args), fn('42', ...args), `${name}(42)`)
	}
})
