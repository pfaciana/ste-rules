import { test } from 'node:test'
import assert from 'node:assert/strict'
import { noAmbiguousAbbreviations } from './noAmbiguousAbbreviations.js'

// Every match, exactly: [index, text, full]. `full` is the term from the ambiguous list, or null.
// The fourth column, when present, is the options object.
const cases = [
	// name                                    text                                  matches                                                                              options
	['empty',                                  '',                                   []],
	['blank space only',                       '   \n\n   ',                         []],
	['ambiguous list entry',                   'The GC runs often.',                 [[4, 'GC', 'garbage collector']]],
	['a shouted sentence is skipped',          'RUN THE TESTS NOW.',                 []],
	['a shout with an abbreviation, skipped',  'RUN THE GC NOW.',                    []],
	['a shout with digits is a shout',         'RUN ALL 5 TESTS.',                   []],
	['a shout, then a normal sentence',        'RUN IT. The GC runs.',               [[12, 'GC', 'garbage collector']]],
	['abbreviations only, all caps, skipped',  'RUN GC TESTS.',                      []],
	['one capital word is not a shout',        'GC.',                                [[0, 'GC', 'garbage collector']]],
	['mixed case is not a shout',              'Run THE GC now.',                    [[4, 'THE', null], [8, 'GC', 'garbage collector']]],
	['ambiguous list entry, three letters',    'Write a POC first.',                 [[8, 'POC', 'proof of concept']]],
	['ambiguous list entry, longest term',     'Set the TTL now.',                   [[8, 'TTL', 'time to live']]],
	['unknown run of capitals',                'The XYZ runs often.',                [[4, 'XYZ', null]]],
	['allowed list entry',                     'Use HTML here.',                     []],
	['allowed list entry, two letters',        'Read the ID field.',                 []],
	['allowed list entry, five letters',       'Read the ASCII table.',              []],
	['units pass',                             'A 5 MB file needs 4 GB on a 2 TB disk.', []],
	['hardware names pass',                    'Plug the USB SSD into the PC.',      []],
	['marker words pass',                      'NOTE: a FIXME and a TODO. WARNING: hot.', []],
	['US passes',                              'It ships in the US.',                []],
	['allowed list entry with a digit',        'Deploy to EC2 now.',                 []],
	['allowed list entry, digit last',         'Put it in S3 today.',                []],
	['allowed entry too long for the regex',   'See the README file.',               []],
	['match at the very start',                'GC runs often.',                     [[0, 'GC', 'garbage collector']]],
	['match at the very end, no period',       'This is the GC',                     [[12, 'GC', 'garbage collector']]],
	['match at the very end, with a period',   'This is the GC.',                    [[12, 'GC', 'garbage collector']]],
	['two matches, exact places',              'The DI and the POC are done.',       [[4, 'DI', 'dependency injection'], [15, 'POC', 'proof of concept']]],
	['the same abbreviation twice',            'GC and GC.',                         [[0, 'GC', 'garbage collector'], [7, 'GC', 'garbage collector']]],
	['across a line break',                    'The GC runs\nthe DB now.',           [[4, 'GC', 'garbage collector'], [16, 'DB', 'database']]],
	['punctuation right next to the match',    '(GC), "db" and the DB!',             [[1, 'GC', 'garbage collector'], [19, 'DB', 'database']]],
	['known cost: two abbreviations alone read as a shout', '(GC), "DB"!',           []],
	['upper case is a shout',                  'THE GC RUNS OFTEN.',                 []],
	['two capitals, the low limit',            'The XY runs.',                       [[4, 'XY', null]]],
	['five capitals, the high limit',          'The MYABC runs.',                    [[4, 'MYABC', null]]],
	['one capital is past the low limit',      'Plan A works.',                      []],
	['six capitals is past the high limit',    'The SYSTEM works.',                  []],
	['eight capitals is a word',               'MARKDOWN is fine.',                  []],
	['digits after the first letter',          'The H2O tank.',                      [[4, 'H2O', null]]],
	['a digit first does not match',           'The 2FA login.',                     []],
	['a normal capitalized word',              'The Parser runs.',                   []],
	['mixed case does not match',              'The Gc runs.',                       []],
	['lower case does not match',              'The gc runs.',                       []],
	['a hyphenated form is one word',          'Use UTF-8 here.',                    []],
	['a dotted form is one word',              'The U.S.A rules.',                   []],
	['the allow option skips a name',          'The XYZ runs.',                      [],                                                                                  { allow: ['XYZ'] }],
	['the allow option is case sensitive',     'The XYZ runs.',                      [[4, 'XYZ', null]],                                                                  { allow: ['xyz'] }],
	['the allow option keeps other hits',      'The XYZ and DI.',                    [[12, 'DI', 'dependency injection']],                                                { allow: ['XYZ'] }],
	['the allow option beats the ambiguous list', 'The GC runs.',                    [],                                                                                  { allow: ['GC'] }],
	['an empty allow option changes nothing',  'The GC runs.',                       [[4, 'GC', 'garbage collector']],                                                    { allow: [] }],
	['an empty options object',                'The GC runs.',                       [[4, 'GC', 'garbage collector']],                                                    {}],
	// empty and tiny
	['one letter only',                        'A',                                  []],
	['one word, no punctuation',               'GC',                                 [[0, 'GC', 'garbage collector']]],
	['tabs only',                              '\t\t',                               []],
	['one lower case word',                    'gc',                                 []],
	// whitespace and Unicode
	['tabs around the match',                  '\tThe\tGC\truns.',                   [[5, 'GC', 'garbage collector']]],
	['a CRLF line break',                      'The GC runs.\r\nMore text.',         [[4, 'GC', 'garbage collector']]],
	['a no-break space around the match',      'The\u00a0GC\u00a0runs.',             [[4, 'GC', 'garbage collector']]],
	['accents next to the match',              'Le GC café runs.',                   [[3, 'GC', 'garbage collector']]],
	['Cyrillic next to the match',             'Кэш GC работает.',                   [[4, 'GC', 'garbage collector']]],
	['an emoji next to the match',             'The 🎉 GC runs.',                     [[7, 'GC', 'garbage collector']]],
	// markdown leftovers
	['a heading line',                         '## GC Notes',                        [[3, 'GC', 'garbage collector']]],
	['a dash list item',                       '- The GC runs.',                     [[6, 'GC', 'garbage collector']]],
	['a numbered list item',                   '1. The GC runs.',                    [[7, 'GC', 'garbage collector']]],
	['bold markers around the match',          'The **GC** runs.',                   [[6, 'GC', 'garbage collector']]],
	['backtick code around the match',         'Use `GC` here.',                     [[5, 'GC', 'garbage collector']]],
	['a markdown link swallows the match',     'See [the GC](https://x.test/gc) now.', []],
	['a table row',                            '| GC | DB |',                        []],
	['a block quote',                          '> The GC runs.',                     [[6, 'GC', 'garbage collector']]],
	// code and URLs
	['a snake_case name',                      'Call gc_run now.',                   []],
	['a camelCase name',                       'Call gcRun now.',                    []],
	['a Windows path',                         'Open C:\\temp\\GC\\notes.md now.',   []],
	['an https URL',                           'See https://example.test/GC now.',   []],
	['an email address',                       'Mail QA@example.test now.',          []],
	['a version number',                       'Ship v1.2.3 today.',                 []],
	['a commit hash',                          'Check a3f9c2 now.',                  []],
	['a template slot',                        'Set ${GC} now.',                     [[6, 'GC', 'garbage collector']]],
	['a shell variable is a hit',              'Read $HOME now.',                    [[6, 'HOME', null]]],
	// numbers and dates
	['a thousands separator',                  'The GC ran 1,000 times.',            [[4, 'GC', 'garbage collector']]],
	['a percent',                              'The GC used 50% of it.',             [[4, 'GC', 'garbage collector']]],
	['a dollar amount',                        'The GC cost $5 today.',              [[4, 'GC', 'garbage collector']]],
	['a clock time',                           'The GC ran at 10:30.',               [[4, 'GC', 'garbage collector']]],
	['an ISO date',                            'The GC ran on 2026-09-04.',          [[4, 'GC', 'garbage collector']]],
	['a slashed date',                         'The GC ran on 9/4/2026.',            [[4, 'GC', 'garbage collector']]],
	['an ordinal',                             'The GC ran on the 3rd.',             [[4, 'GC', 'garbage collector']]],
	// punctuation
	['quotes around the match',                'The "GC" runs.',                     [[5, 'GC', 'garbage collector']]],
	['brackets around the match',              'The [GC] runs.',                     [[5, 'GC', 'garbage collector']]],
	['an ellipsis after the match',            'The GC... runs on.',                 [[4, 'GC', 'garbage collector']]],
	['an em dash joins the match',             'The GC—fast—runs.',                  []],
	['a question and an exclamation',          'Is the GC slow?! Yes.',              [[7, 'GC', 'garbage collector']]],
	['the match at the sentence start',        'DB runs fast. Then stop.',           [[0, 'DB', 'database']]],
	['the match at the sentence end',          'This uses the DB.',                  [[14, 'DB', 'database']]],
	// case
	['ALL CAPS is a shout',                    'THE GC IS SLOW',                     []],
	['Title Case words',                       'The Garbage Collector Is Slow.',     []],
	['a camelCase name next to the match',     'The gcRun and the GC run.',          [[18, 'GC', 'garbage collector']]],
	['a capitalized word at a sentence start', 'Parser runs.',                       []],
	// contractions
	['it is, shortened, before the match',     'It\'s the GC.',                      [[9, 'GC', 'garbage collector']]],
	['is not, shortened, after the match',     'The GC isn\'t slow.',                [[4, 'GC', 'garbage collector']]],
	['they are, shortened, before the match',  'They\'re the DB users.',             [[12, 'DB', 'database']]],
	['do not, shortened, before the match',    'Don\'t touch the GC.',               [[16, 'GC', 'garbage collector']]],
	['a possessive on the match',              'The GC\'s log is long.',             []],
	['a possessive with a bare apostrophe',    'Ask James\' team.',                  []],
	// traps: it looks like a hit and it is not
	['trap: a digit comes first',              'The 3D model.',                      []],
	['trap: six capitals',                     'The BUFFER ran.',                    []],
	['trap: a hyphen joins a digit',           'The GC-1 runs.',                     []],
	['trap: an underscore joins it',           'The GC_LOG file.',                   []],
	['trap: a slash joins two names',          'The GC/DB pair.',                    []],
	['trap: a plural of capitals',             'Many GCs run.',                      []],
	['trap: an allowed name in a path',        'Read src/API.js now.',               []],
	// traps: it looks harmless and it is a hit
	['trap: a hit inside quotes',              'He said "MR" today.',                [[9, 'MR', 'merge request']]],
	['trap: a hit inside parentheses',         'Run it (FP).',                       [[8, 'FP', 'functional programming']]],
	['trap: a hit at the end of a bullet',     '- Fix the CR',                       [[10, 'CR', 'code review']]],
	['trap: a hit in a heading',               '# Notes on ES',                      [[11, 'ES', 'ECMAScript']]],
	['trap: a hit next to an emoji',           'Done 🎉 QA passed.',                  [[8, 'QA', 'quality assurance']]],
	['trap: a hit with a trailing colon',      'PR: fix the bug.',                   [[0, 'PR', 'pull request']]],
	// length extremes
	['exactly the five capital limit',         'The ABCDE runs.',                    [[4, 'ABCDE', null]]],
	['one over the five capital limit',        'The ABCDEF runs.',                   []],
	// options
	['the allow option holds an empty string', 'The GC runs.',                       [[4, 'GC', 'garbage collector']],                                                    { allow: [''] }],
	['the allow option is null',               'The GC runs.',                       [[4, 'GC', 'garbage collector']],                                                    { allow: null }],
	['the allow option is a string, not a list', 'The GC runs.',                     [[4, 'GC', 'garbage collector']],                                                    { allow: 'GC' }],
]

for (const [name, text, matches, options] of cases) {
	test(name, () => {
		const found = noAmbiguousAbbreviations(text, options)
		assert.deepEqual(found.map(m => [m.index, m.text, m.full]), matches)
		for (const m of found) assert.equal(text.slice(m.index, m.index + m.length), m.text, 'length')
	})
}

const fields = [
	// name                                text                                  field       value
	['known term, full',                   'The GC runs.',                       'full',     'garbage collector'],
	['unknown term, full',                 'The XYZ runs.',                      'full',     null],
	['length',                             'Write a POC first.',                 'length',   3],
	['context is the sentence',            'One line. The GC runs.',             'context',  'The GC runs.'],
	['context across a blank line',        'The GC runs.\n\nMore text.',         'context',  'The GC runs.'],
	['context with no sentence end',       'The GC runs',                        'context',  'The GC runs'],
	['message with the full term',         'The GC runs.',                       'message',  'Write the full term: "garbage collector", not "GC".'],
	['message without the full term',      'The XYZ runs.',                      'message',  'Write the full term, not "XYZ".'],
]

for (const [name, text, field, value] of fields) {
	test(`the match carries ${field}: ${name}`, () => assert.deepEqual(noAmbiguousAbbreviations(text)[0][field], value))
}

// The whole output, every field but message
const outputs = [
	// text                                 matches                                                                                                                     options
	['Use HTML here.',                      []],
	['The GC runs.',                        [{ index: 4, length: 2, text: 'GC', context: 'The GC runs.', full: 'garbage collector' }]],
	['The XYZ runs.',                       [{ index: 4, length: 3, text: 'XYZ', context: 'The XYZ runs.', full: null }]],
	['The DI and the POC are done.',        [{ index: 4, length: 2, text: 'DI', context: 'The DI and the POC are done.', full: 'dependency injection' }, { index: 15, length: 3, text: 'POC', context: 'The DI and the POC are done.', full: 'proof of concept' }]],
	['The XYZ runs.',                       [],                                                                                                                          { allow: ['XYZ'] }],
	['The XYZ and DI.',                     [{ index: 12, length: 2, text: 'DI', context: 'The XYZ and DI.', full: 'dependency injection' }],                             { allow: ['XYZ'] }],
]

for (const [text, matches, options] of outputs) {
	test(`noAmbiguousAbbreviations output for ${JSON.stringify(text)}`, () => assert.deepEqual(noAmbiguousAbbreviations(text, options).map(({ message, ...m }) => m), matches))
}

// The full shape of every match of every row: the span, the context, the full term, the message.
import { ambiguous as terms } from '../data/abbreviations.js'

test('every match of every row carries the full shape', () => {
	const threw = []
	for (const [name, text, , options] of cases) {
		let found
		try {
			found = noAmbiguousAbbreviations(text, options)
		} catch (e) {
			threw.push(`${name}: ${e.message}`)
			continue
		}
		for (const m of found) {
			assert.equal(text.slice(m.index, m.index + m.length), m.text, `${name}: the span`)
			assert.equal(m.length, m.text.length, `${name}: the length`)
			assert.equal(m.full, terms[m.text] ?? null, `${name}: the full term`)
			assert.ok(text.includes(m.context), `${name}: the context is part of the text`)
			assert.ok(m.context.includes(m.text), `${name}: the context holds the match`)
			assert.equal(m.message, m.full ? `Write the full term: "${m.full}", not "${m.text}".` : `Write the full term, not "${m.text}".`, `${name}: the message`)
		}
	}
	assert.deepEqual(threw, [], 'no row throws')
})

// options: none at all, and a null options object
test('no options argument works', () => assert.deepEqual(noAmbiguousAbbreviations('The GC runs.').map(m => [m.index, m.text]), [[4, 'GC']]))
test('a null options object throws', () => assert.throws(() => noAmbiguousAbbreviations('The GC runs.', null), TypeError))

// text that is not a string
test('null text returns an empty list', () => assert.deepEqual(noAmbiguousAbbreviations(null), []))
test('a number as text returns an empty list', () => assert.deepEqual(noAmbiguousAbbreviations(12345), []))

// length extremes
test('a long paragraph returns every hit', () => {
	const text = `The GC runs. ${'word '.repeat(400)}The DB runs.`
	const found = noAmbiguousAbbreviations(text)
	assert.deepEqual(found.map(m => m.text), ['GC', 'DB'])
})
