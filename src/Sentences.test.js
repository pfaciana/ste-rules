import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sentences, sentenceAt } from './Sentences.js'

const cases = [
	// name                              text                                        sentence texts
	['one sentence',                     'Run the tests.',                            ['Run the tests.']],
	['two sentences',                    'Run the tests. Then commit.',               ['Run the tests.', 'Then commit.']],
	['question and exclamation',         'Ready? Go! Now.',                           ['Ready?', 'Go!', 'Now.']],
	['no final period',                  'Run the tests',                             ['Run the tests']],
	['closing quote after the period',   'He said "stop." Then left.',                ['He said "stop."', 'Then left.']],
	['closing bracket after the period', 'See the log (below). Then commit.',         ['See the log (below).', 'Then commit.']],
	['e.g. inside a sentence',           'Use a tool, e.g. rg, for search.',          ['Use a tool, e.g. rg, for search.']],
	['a title holds, an initial splits', 'Dr. Smith met Mr. J. Jones. Then they left.', ['Dr. Smith met Mr. J.', 'Jones.', 'Then they left.']],
	['a dotted run holds',               'It is in the U.S.A. at 9 a.m. today. Then noon.', ['It is in the U.S.A. at 9 a.m. today.', 'Then noon.']],
	['a numbered list marker is not an end', 'Steps:\n1. Run it.\n2. Stop it.',        ['Steps:\n1. Run it.', '2. Stop it.']],
	['a marker at the text start',       '1. Run it.',                                ['1. Run it.']],
	['an indented marker',               '  10. Run it.',                              ['10. Run it.']],
	['a number then a period mid-line',  'Add 5. Then stop.',                         ['Add 5.', 'Then stop.']],
	['a dotted run at a sentence end',   'Meet at 9 p.m. Then go.',                   ['Meet at 9 p.m.', 'Then go.']],
	['a dotted run at the very end',     'It is in the U.S.A.',                       ['It is in the U.S.A.']],
	['a file name and a domain',         'Open file.js on www.example.com. Then go.', ['Open file.js on www.example.com.', 'Then go.']],
	['every title',                      'Mrs. A, Ms. B, Prof. C, Sr. D, Jr. E, St. Louis. Done.', ['Mrs. A, Ms. B, Prof. C, Sr. D, Jr. E, St. Louis.', 'Done.']],
	['a title at the very end',          'Ask the Dr.',                               ['Ask the Dr.']],
	['a title in lower case is no title', 'Ask the dr. Then go.',                     ['Ask the dr.', 'Then go.']],
	['a longer word that ends in a title', 'Call the Costr. Then go.',                ['Call the Costr.', 'Then go.']],
	['etc. at the end',                  'Add nouns, verbs, etc. Then stop.',         ['Add nouns, verbs, etc.', 'Then stop.']],
	['decimal number',                   'It took 3.5 seconds. Fine.',                ['It took 3.5 seconds.', 'Fine.']],
	['the pronoun I at the end',         'It was I. Then it was you.',                ['It was I.', 'Then it was you.']],
	['a label letter at the end',        'Choose option B. Then run it.',             ['Choose option B.', 'Then run it.']],
	['a key letter at the end',          'Press Q. The menu opens.',                  ['Press Q.', 'The menu opens.']],
	['a value letter at the end',        'Set the flag to N. Save the file.',         ['Set the flag to N.', 'Save the file.']],
	['a letter at the very end',         'Choose option B.',                          ['Choose option B.']],
	['known cost: an initial splits',    'Ask J. Smith for help.',                    ['Ask J.', 'Smith for help.']],
	['version dots',                     'Use v2.0.3 now. Done.',                     ['Use v2.0.3 now.', 'Done.']],
	['line break inside a sentence',     'Run the\ntests. Done.',                     ['Run the\ntests.', 'Done.']],
	['blank line ends a sentence',       'First\n\nSecond',                           ['First', 'Second']],
	['ellipsis',                         'Wait... Go.',                               ['Wait...', 'Go.']],
]

for (const [name, text, expected] of cases) {
	test(name, () => assert.deepEqual(sentences(text).map(s => s.text), expected))
}

test('index and length point into the input', () => {
	const [a, b] = sentences('  Run the tests.  Then commit.')
	assert.equal(a.index, 2)
	assert.equal(a.length, 14)
	assert.equal(b.index, 18)
	assert.equal('  Run the tests.  Then commit.'.slice(b.index, b.index + b.length), 'Then commit.')
})

const at = [
	// text                          index   sentence
	['Run the tests. Then commit.',  0,      'Run the tests.'],
	['Run the tests. Then commit.',  15,     'Then commit.'],
	['Run the tests. Then commit.',  99,     'Run the tests. Then commit.'],
]

for (const [text, index, expected] of at) {
	test(`sentenceAt ${index} of ${text}`, () => assert.equal(sentenceAt(text, index), expected))
}

const more = [
	// name                                  text                                              sentence texts
	['empty',                                '',                                                []],
	['whitespace only',                      '  \n\t ',                                         []],
	['one letter',                           'a',                                               ['a']],
	['one word, no punctuation',             'run',                                             ['run']],
	['a period only',                        '.',                                               ['.']],
	['tabs around a period',                 'Run\tthe\ttests.\tDone.',                         ['Run\tthe\ttests.', 'Done.']],
	['crlf after a period',                  'Run it.\r\nDone.',                                ['Run it.', 'Done.']],
	['a crlf blank line',                    'A\r\n\r\nB',                                      ['A', 'B']],
	['a no-break space after a period',      'Run it.\u00A0Done.',                              ['Run it.', 'Done.']],
	['accents',                              'Café ouvert. Fermé.',                             ['Café ouvert.', 'Fermé.']],
	['cyrillic',                             'Привет мир. Пока.',                               ['Привет мир.', 'Пока.']],
	['a cjk full stop is not a period',      '这是测试。完成。',                                     ['这是测试。完成。']],
	['an emoji next to the match',           'Ship it. \u{1F680} Done.',                        ['Ship it.', '\u{1F680} Done.']],
	['a heading, then a sentence',           '## Title\n\nRun it.',                             ['## Title', 'Run it.']],
	['a bullet list',                        '- item one. - item two.',                         ['- item one.', '- item two.']],
	['a numbered list item',                 '1. item',                                         ['1. item']],
	['bold text',                            '**bold** text. Done.',                            ['**bold** text.', 'Done.']],
	['inline code',                          'Use `rg -u` here. Done.',                         ['Use `rg -u` here.', 'Done.']],
	['a link',                               '[text](https://x.test/a) works. Done.',           ['[text](https://x.test/a) works.', 'Done.']],
	['a table row',                          '| a | b |\n|---|---|',                            ['| a | b |\n|---|---|']],
	['a block quote',                        '> quote. Next.',                                  ['> quote.', 'Next.']],
	['snake_case',                           'Call run_all_tests. Done.',                       ['Call run_all_tests.', 'Done.']],
	['camelCase',                            'Call runAllTests. Done.',                         ['Call runAllTests.', 'Done.']],
	['a unix path',                          'Open src/Words.js now. Done.',                    ['Open src/Words.js now.', 'Done.']],
	['a windows path',                       'Open C:\\Users\\me\\a.txt now.',                ['Open C:\\Users\\me\\a.txt now.']],
	['an https url with a question mark',    'See https://x.test/a?b=1 now. Done.',             ['See https://x.test/a?b=1 now.', 'Done.']],
	['an email address',                     'Mail a@b.test now. Done.',                        ['Mail a@b.test now.', 'Done.']],
	['a semantic version',                   'Use v1.2.3 now. Done.',                           ['Use v1.2.3 now.', 'Done.']],
	['a commit hash',                        'Commit a1b2c3d4. Done.',                          ['Commit a1b2c3d4.', 'Done.']],
	['a slot placeholder',                   'Set ${slot} now. Done.',                          ['Set ${slot} now.', 'Done.']],
	['a shell variable',                     'Print $HOME now. Done.',                          ['Print $HOME now.', 'Done.']],
	['a thousands separator',                'It costs 1,000 dollars. Done.',                   ['It costs 1,000 dollars.', 'Done.']],
	['a percent',                            'Use 50% now. Done.',                              ['Use 50% now.', 'Done.']],
	['a dollar amount',                      'It costs $5. Then stop.',                         ['It costs $5.', 'Then stop.']],
	['a clock time',                         'Meet at 10:30. Done.',                            ['Meet at 10:30.', 'Done.']],
	['an iso date',                          'Ship on 2026-09-04. Done.',                       ['Ship on 2026-09-04.', 'Done.']],
	['a us date',                            'Ship on 9/4/2026. Done.',                         ['Ship on 9/4/2026.', 'Done.']],
	['an ordinal number',                    'Ship on the 3rd. Done.',                          ['Ship on the 3rd.', 'Done.']],
	['quotes around a whole sentence',       '"Stop." Then go.',                                ['"Stop."', 'Then go.']],
	['brackets around a whole sentence',     '(Stop.) Then go.',                                ['(Stop.)', 'Then go.']],
	['an ellipsis, then lower case',         'Wait... then go.',                                ['Wait...', 'then go.']],
	['an em dash inside a sentence',         'Stop — then go. Done.',                           ['Stop — then go.', 'Done.']],
	['a question mark and a bang',           'Really?! Yes.',                                   ['Really?!', 'Yes.']],
	['all caps',                             'STOP THE BUILD. THEN GO.',                        ['STOP THE BUILD.', 'THEN GO.']],
	['title case',                           'Stop The Build. Then Go.',                        ['Stop The Build.', 'Then Go.']],
	['a contraction',                        "It's fine. Don't stop.",                          ["It's fine.", "Don't stop."]],
	['more contractions',                    "They're here. It isn't done.",                    ["They're here.", "It isn't done."]],
	['possessive forms',                     "The tool's log is here. James' log too.",         ["The tool's log is here.", "James' log too."]],

	// a period that looks like an end and is not
	['no. and a digit',                      'See No. 7 next. Done.',                           ['See No. 7 next.', 'Done.']],
	['fig. and a letter',                    'See Fig. A now. Done.',                           ['See Fig. A now.', 'Done.']],
	['vs. and lower case',                   'Read this vs. that. Done.',                       ['Read this vs. that.', 'Done.']],
	['i.e. and lower case',                  'Use i.e. it works. Done.',                        ['Use i.e. it works.', 'Done.']],
	['node.js in a sentence',                'Node.js runs it. Done.',                          ['Node.js runs it.', 'Done.']],
	['a.m. and lower case',                  'Meet at 9 a.m. today. Done.',                     ['Meet at 9 a.m. today.', 'Done.']],

	// a period that looks internal and is an end
	['e.g. and a capital word',              'Use a tool, e.g. Rg, for search.',                ['Use a tool, e.g.', 'Rg, for search.']],
	['no. and a capital word',               'No. Then go.',                                    ['No.', 'Then go.']],
	['fig. and a long capital word',         'Fig. Charts help. Done.',                         ['Fig.', 'Charts help.', 'Done.']],
	['etc. and a capital word',              'Add nouns, etc. Then stop.',                      ['Add nouns, etc.', 'Then stop.']],
	['an initial before a surname',          'Ask A. Jones for help.',                          ['Ask A.', 'Jones for help.']],
	['a lower case title',                   'Ask the prof. Then go.',                          ['Ask the prof.', 'Then go.']],

	// length
	['a sentence at the word limit',         'w1 w2 w3 w4 w5 w6 w7 w8 w9 w10 w11 w12 w13 w14 w15 w16 w17 w18 w19 w20.',     ['w1 w2 w3 w4 w5 w6 w7 w8 w9 w10 w11 w12 w13 w14 w15 w16 w17 w18 w19 w20.']],
	['a sentence one word over',             'w1 w2 w3 w4 w5 w6 w7 w8 w9 w10 w11 w12 w13 w14 w15 w16 w17 w18 w19 w20 w21.', ['w1 w2 w3 w4 w5 w6 w7 w8 w9 w10 w11 w12 w13 w14 w15 w16 w17 w18 w19 w20 w21.']],

	// wrong types
	['null',                                 null,                                              []],
	['undefined',                            undefined,                                         []],
	['a number, not a string',               12,                                                ['12']],
]

for (const [name, text, expected] of more) {
	test(`more: ${name}`, () => assert.deepEqual(sentences(text).map(s => s.text), expected))
}

test('slice(index, index + length) is the sentence text', () => {
	for (const [name, text] of [...cases, ...more]) {
		const input = String(text ?? '')
		for (const s of sentences(text)) assert.equal(input.slice(s.index, s.index + s.length), s.text, name)
	}
})

test('an options argument is ignored', () => {
	assert.deepEqual(sentences('Run it. Done.', {}).map(s => s.text), ['Run it.', 'Done.'])
	assert.deepEqual(sentences('Run it. Done.', { max: 0 }).map(s => s.text), ['Run it.', 'Done.'])
	assert.deepEqual(sentences('Run it. Done.', 'not an object').map(s => s.text), ['Run it.', 'Done.'])
})

test('a long text returns an array', () => {
	const block = 'Run the tests. Then commit the work.\n\n'
	const big = block.repeat(Math.ceil(1024 * 1024 / block.length))
	const out = sentences(big)
	assert.ok(Array.isArray(out))
	assert.ok(out.length > 0)
	assert.equal(big.slice(out[0].index, out[0].index + out[0].length), out[0].text)
})

const atMore = [
	// text                           index   sentence
	['',                              0,      ''],
	['Run it. Done.',                 -1,     'Run it. Done.'],
	['Run it. Done.',                 6,      'Run it.'],
	['Run it. Done.',                 7,      'Run it. Done.'],
	['Run it. Done.',                 8,      'Done.'],
	['A\n\nB',                        3,      'B'],
]

for (const [text, index, expected] of atMore) {
	test(`more: sentenceAt ${index} of ${JSON.stringify(text)}`, () => assert.equal(sentenceAt(text, index), expected))
}
