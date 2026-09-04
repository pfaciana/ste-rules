import { test } from 'node:test'
import assert from 'node:assert/strict'
import { noPreamble } from './noPreamble.js'
import { openers, closers } from '../data/preamble.js'

// Every match, exactly: [index, text, place]. The match is the whole paragraph, not the phrase.
const branches = [
	// name                                  text                                            matches
	['empty',                                '',                                             []],
	['blank lines only',                     '\n\n \n',                                      []],
	['plain answer',                         'The build fails.\n\nFix the import.',          []],
	['opener at the very start',             'Sure, here is the fix.\n\nFix the import.',    [[0, 'Sure, here is the fix.', 'start']]],
	['closer at the very end',               'Fix the import.\n\nHope this helps!',          [[17, 'Hope this helps!', 'end']]],
	['two matches, exact places',            'Certainly! Fix it.\n\nHope this helps!',       [[0, 'Certainly! Fix it.', 'start'], [20, 'Hope this helps!', 'end']]],
	['one paragraph hits the openers only',  'Let me know if you need more.',                [[0, 'Let me know if you need more.', 'start']]],
	['one paragraph, a closer word, passes', 'Overall, the build passes.',                   []],
	['two paragraphs, the closer is checked', 'Body.\n\nOverall, the build passes.',         [[7, 'Overall, the build passes.', 'end']]],
	['a middle paragraph is not checked',    'Fix it.\n\nSure, this too.\n\nDone.',          []],
	['upper case',                           'SURE, HERE IS THE FIX.\n\nFIX IT.',            [[0, 'SURE, HERE IS THE FIX.', 'start']]],
	['punctuation right after the opener',   'Sure: fix the import.\n\nFix it.',             [[0, 'Sure: fix the import.', 'start']]],
	['punctuation right after the closer',   'Fix it.\n\nOverall, this works.',              [[9, 'Overall, this works.', 'end']]],
	['the opener paragraph is one word',     'Sure\n\nFix it.',                              [[0, 'Sure', 'start']]],
	['the opener spans a line break',        'Sure, here\nis the fix.\n\nFix it.',           [[0, 'Sure, here\nis the fix.', 'start']]],
	['the closer spans a line break',        'Fix it.\n\nOverall, the code\nis fine.',       [[9, 'Overall, the code\nis fine.', 'end']]],
	['a line break inside the phrase',       'Fix it.\n\nHope this\nhelps a lot!',           []],
	['leading spaces shift the index',       '   Sure, fix it.\n\nFix it.',                  [[3, 'Sure, fix it.', 'start']]],
	['trailing blank lines',                 'Fix it.\n\nHope this helps!\n\n',              [[9, 'Hope this helps!', 'end']]],
	['a longer word is a near miss',         'Surely the build fails.\n\nFix it.',           []],
	['a longer closer word is a near miss',  'Fix it.\n\nOverallocation of memory failed.',  []],
	['the phrase inside a sentence',         'The tests are sure to pass.',                  []],
	['the closer phrase inside a sentence',  'Fix it.\n\nWe hope this helps nobody.',        []],

	// empty and tiny
	// name                                  text                                            matches
	['spaces only',                          '   ',                                          []],
	['one letter',                           'A',                                            []],
	['two one letter paragraphs',            'A\n\nB',                                       []],
	['one word, no punctuation',             'Sure',                                         [[0, 'Sure', 'start']]],

	// whitespace and Unicode
	// name                                  text                                            matches
	['CRLF between the paragraphs',          'Sure, fix it.\r\n\r\nHope this helps!',        [[0, 'Sure, fix it.', 'start'], [17, 'Hope this helps!', 'end']]],
	['a tab before the opener',              '\tSure, fix it.\n\nFix it.',                   [[1, 'Sure, fix it.', 'start']]],
	['a no-break space after the opener',    'Sure\u00A0fix it.\n\nFix it.',                 [[0, 'Sure\u00A0fix it.', 'start']]],
	['a no-break space line is blank',       'Fix it.\n\u00A0\nOverall, fine.',              [[10, 'Overall, fine.', 'end']]],
	['an accent breaks the opener',          'S\u00FAre, fix it.\n\nFix it.',                []],
	['Cyrillic text',                        'Конечно, вот исправление.\n\nFix it.',         []],
	['CJK text',                             'もちろん、修正はこれです。\n\n直して。',                    []],
	['an emoji before the opener',           '🎉 Sure, fix it.\n\nFix it.',                  []],
	['an emoji after the opener',            'Sure 🎉 fix it.\n\nFix it.',                   [[0, 'Sure 🎉 fix it.', 'start']]],

	// markdown leftovers
	// name                                  text                                            matches
	['a heading marker hides the opener',    '## Sure, here is the fix.\n\nFix it.',         []],
	['a list marker hides the opener',       '- Sure, here is the fix.\n\nFix it.',          []],
	['a numbered marker hides the opener',   '1. Sure, here is the fix.\n\nFix it.',         []],
	['bold marks hide the opener',           '**Sure**, here is the fix.\n\nFix it.',        []],
	['backticks hide the opener',            '`Here is` the fix.\n\nFix it.',                []],
	['a link hides the opener',              '[Sure](url) is the fix.\n\nFix it.',           []],
	['a table row hides the closer',         'Fix it.\n\n| Overall | fine |',                []],
	['a quote marker hides the closer',      'Fix it.\n\n> Overall, the code is fine.',      []],

	// code and URLs
	// name                                  text                                            matches
	['snake case after the opener',          'Sure, run build_all now.\n\nFix it.',          [[0, 'Sure, run build_all now.', 'start']]],
	['an identifier extends the closer',     'Fix it.\n\noverall_score is 5.',               [[9, 'overall_score is 5.', 'end']]],
	['camel case blocks the opener',         'sureThing is set.\n\nFix it.',                 []],
	['camel case blocks the closer',         'Fix it.\n\noverallScore is 5.',                []],
	['a path after the opener',              'Here is C:\\Users\\Name.\n\nFix it.',          [[0, 'Here is C:\\Users\\Name.', 'start']]],
	['a URL after the opener',               "Here's https://example.com/a.\n\nFix it.",     [[0, "Here's https://example.com/a.", 'start']]],
	['an email inside the closer',           'Fix it.\n\nFeel free to write dev@x.test.',    [[9, 'Feel free to write dev@x.test.', 'end']]],
	['a version after the opener',           'Sure, use v1.2.3.\n\nFix it.',                 [[0, 'Sure, use v1.2.3.', 'start']]],
	['a slot after the opener',              'Here is ${slot}.\n\nFix it.',                  [[0, 'Here is ${slot}.', 'start']]],
	['a shell variable after the opener',    'Here is $HOME.\n\nFix it.',                    [[0, 'Here is $HOME.', 'start']]],

	// numbers and dates
	// name                                  text                                            matches
	['a thousands comma',                    'Sure, 1,000 lines change.\n\nFix it.',         [[0, 'Sure, 1,000 lines change.', 'start']]],
	['a percent in the closer',              'Fix it.\n\nOverall, 50% passes.',              [[9, 'Overall, 50% passes.', 'end']]],
	['a price after the opener',             'Sure, it costs $5.\n\nFix it.',                [[0, 'Sure, it costs $5.', 'start']]],
	['a clock time in the closer',           'Fix it.\n\nIn short, 10:30 works.',            [[9, 'In short, 10:30 works.', 'end']]],
	['an ISO date after the opener',         'Sure, 2026-09-04 is the date.\n\nFix it.',     [[0, 'Sure, 2026-09-04 is the date.', 'start']]],
	['a slash date after the opener',        'Sure, 9/4/2026 is the date.\n\nFix it.',       [[0, 'Sure, 9/4/2026 is the date.', 'start']]],
	['an ordinal in the closer',             'Fix it.\n\nIn summary, the 3rd try works.',    [[9, 'In summary, the 3rd try works.', 'end']]],

	// punctuation
	// name                                  text                                            matches
	['quotes around the opener',             '"Sure, fix it."\n\nFix it.',                   []],
	['curly quotes around the opener',       '\u201CSure, fix it.\u201D\n\nFix it.',          []],
	['brackets around the opener',           '(Sure, fix it.)\n\nFix it.',                   []],
	['an ellipsis after the opener',         'Sure\u2026 fix it.\n\nFix it.',                [[0, 'Sure\u2026 fix it.', 'start']]],
	['an em dash after the opener',          'Sure \u2014 fix it.\n\nFix it.',               [[0, 'Sure \u2014 fix it.', 'start']]],
	['a question mark and a bang',           'Sure?! Fix it.\n\nFix it.',                    [[0, 'Sure?! Fix it.', 'start']]],
	['a period right after the opener',      'Sure. Here is the fix.\n\nFix it.',            [[0, 'Sure. Here is the fix.', 'start']]],

	// case
	// name                                  text                                            matches
	['all caps closer',                      'Fix it.\n\nHOPE THIS HELPS!',                  [[9, 'HOPE THIS HELPS!', 'end']]],
	['title case opener',                    'Great Question! The answer is 42.\n\nFix it.', [[0, 'Great Question! The answer is 42.', 'start']]],
	['mixed case opener',                    'SuRe, fix it.\n\nFix it.',                     [[0, 'SuRe, fix it.', 'start']]],
	['lower case opener',                    'sure, fix it.\n\nFix it.',                     [[0, 'sure, fix it.', 'start']]],

	// contractions
	// name                                  text                                            matches
	['a contraction with no mark, start',    'Heres the fix.\n\nFix it.',                    []],
	['a contraction with no mark, end',      'Fix it.\n\nDont hesitate to ask.',             []],
	['a curly apostrophe breaks the closer', 'Fix it.\n\nDon\u2019t hesitate to ask.',        []],
	['let us spelled out',                   'Fix it.\n\nLet us dive in.',                   []],
	['that is spelled out',                  'Fix it.\n\nThat is it.',                       []],
	['i would be happy at the end',          'Fix it.\n\nI would be happy to help.',         []],

	// traps: it looks like a hit, it is not
	// name                                  text                                            matches
	['thanks forever',                       'Thanks forever, I am done.\n\nFix it.',        []],
	['here island',                          'Here island is the fix.\n\nFix it.',           []],
	['let mention',                          'Let mention the fix.\n\nFix it.',              []],
	['feel freedom',                         'Fix it.\n\nFeel freedom now.',                 []],
	['in shortcuts',                         'Fix it.\n\nIn shortcuts we trust.',            []],
	['overalls',                             'Fix it.\n\nOveralls are pants.',               []],
	['i hopeful',                            'Fix it.\n\nI hopeful about it.',               []],
	['certainty',                            'Certainty is rare.\n\nFix it.',                []],

	// traps: it looks clean, it is a hit
	// name                                  text                                            matches
	['a hyphen after the opener',            'Sure-fire fix.\n\nFix it.',                    [[0, 'Sure-fire fix.', 'start']]],
	['a hyphen inside as an AI',             'As an AI-made note, this is fine.\n\nFix it.', [[0, 'As an AI-made note, this is fine.', 'start']]],
	['a digit right after the opener',       'Sure2 fix it.\n\nFix it.',                     [[0, 'Sure2 fix it.', 'start']]],
	['happy to at the end',                  'Fix it.\n\nHappy to help more.',               [[9, 'Happy to help more.', 'end']]],
	['a closer that reads like content',     'Fix it.\n\nOverall the design is right.',      [[9, 'Overall the design is right.', 'end']]],
	['a one paragraph opener',               'Let me explain.',                              [[0, 'Let me explain.', 'start']]],
	['four paragraphs, only the ends',       'Sure, one.\n\nSure, two.\n\nSure, three.\n\nOverall, four.',  [[0, 'Sure, one.', 'start'], [38, 'Overall, four.', 'end']]],
]

// One row per opener. The last paragraph blocks the closer check.
const openerRows = [
	// name                text                                              matches
	['sure',               'Sure, the answer is 42.\n\nFix it.',             [[0, 'Sure, the answer is 42.', 'start']]],
	['certainly',          'Certainly! The answer is 42.\n\nFix it.',        [[0, 'Certainly! The answer is 42.', 'start']]],
	['of course',          'Of course, the answer is 42.\n\nFix it.',        [[0, 'Of course, the answer is 42.', 'start']]],
	['absolutely',         'Absolutely, the answer is 42.\n\nFix it.',       [[0, 'Absolutely, the answer is 42.', 'start']]],
	['great question',     'Great question! The answer is 42.\n\nFix it.',   [[0, 'Great question! The answer is 42.', 'start']]],
	['good question',      'Good question. The answer is 42.\n\nFix it.',    [[0, 'Good question. The answer is 42.', 'start']]],
	['happy to help',      'Happy to help with this.\n\nFix it.',            [[0, 'Happy to help with this.', 'start']]],
	["i'd be happy",       "I'd be happy to explain.\n\nFix it.",            [[0, "I'd be happy to explain.", 'start']]],
	['i would be happy',   'I would be happy to explain.\n\nFix it.',        [[0, 'I would be happy to explain.', 'start']]],
	["here's",             "Here's the fix.\n\nFix it.",                     [[0, "Here's the fix.", 'start']]],
	['here is',            'Here is the fix.\n\nFix it.',                    [[0, 'Here is the fix.', 'start']]],
	['let me',             'Let me explain the fix.\n\nFix it.',             [[0, 'Let me explain the fix.', 'start']]],
	["let's dive",         "Let's dive into the code.\n\nFix it.",           [[0, "Let's dive into the code.", 'start']]],
	['as an ai',           'As an AI, I cannot run code.\n\nFix it.',        [[0, 'As an AI, I cannot run code.', 'start']]],
	['thanks for',         'Thanks for the report.\n\nFix it.',              [[0, 'Thanks for the report.', 'start']]],
	['thank you for',      'Thank you for the report.\n\nFix it.',           [[0, 'Thank you for the report.', 'start']]],
]

// One row per closer. The first paragraph blocks the opener check, so every index is 9.
const closerRows = [
	// name                text                                              matches
	['in summary',         'Fix it.\n\nIn summary, it was wrong.',           [[9, 'In summary, it was wrong.', 'end']]],
	['to summarize',       'Fix it.\n\nTo summarize, it was wrong.',         [[9, 'To summarize, it was wrong.', 'end']]],
	['in conclusion',      'Fix it.\n\nIn conclusion, it was wrong.',        [[9, 'In conclusion, it was wrong.', 'end']]],
	['to conclude',        'Fix it.\n\nTo conclude, it was wrong.',          [[9, 'To conclude, it was wrong.', 'end']]],
	['overall',            'Fix it.\n\nOverall, the code is fine.',          [[9, 'Overall, the code is fine.', 'end']]],
	['let me know',        'Fix it.\n\nLet me know if you need more.',       [[9, 'Let me know if you need more.', 'end']]],
	['feel free',          'Fix it.\n\nFeel free to ask.',                   [[9, 'Feel free to ask.', 'end']]],
	['hope this helps',    'Fix it.\n\nHope this helps!',                    [[9, 'Hope this helps!', 'end']]],
	['i hope',             'Fix it.\n\nI hope this is clear.',               [[9, 'I hope this is clear.', 'end']]],
	['if you have any',    'Fix it.\n\nIf you have any questions, ask.',     [[9, 'If you have any questions, ask.', 'end']]],
	['happy to',           'Fix it.\n\nHappy to answer more.',               [[9, 'Happy to answer more.', 'end']]],
	["don't hesitate",     "Fix it.\n\nDon't hesitate to ask.",              [[9, "Don't hesitate to ask.", 'end']]],
	['do not hesitate',    'Fix it.\n\nDo not hesitate to ask.',             [[9, 'Do not hesitate to ask.', 'end']]],
	["that's it",          "Fix it.\n\nThat's it.",                          [[9, "That's it.", 'end']]],
	['in short',           'Fix it.\n\nIn short, it was wrong.',             [[9, 'In short, it was wrong.', 'end']]],
	['to sum up',          'Fix it.\n\nTo sum up, it was wrong.',            [[9, 'To sum up, it was wrong.', 'end']]],
]

const cases = [...branches, ...openerRows, ...closerRows]

for (const [name, text, matches] of cases) {
	test(name, () => {
		const found = noPreamble(text)
		assert.deepEqual(found.map(m => [m.index, m.text, m.place]), matches)
		for (const m of found) assert.equal(text.slice(m.index, m.index + m.length), m.text, 'length')
	})
}

test('every opener has a row', () => assert.deepEqual(openerRows.map(r => r[0]), openers))
test('every closer has a row', () => assert.deepEqual(closerRows.map(r => r[0]), closers))

const fields = [
	// text                                       match   field       value
	['Sure, here is the fix.\n\nFix it.',         0,      'phrase',   'Sure'],
	['Sure, here is the fix.\n\nFix it.',         0,      'place',    'start'],
	['Sure, here is the fix.\n\nFix it.',         0,      'context',  'Sure, here is the fix.\n\nFix it.'],
	['Sure, here is the fix.\n\nFix it.',         0,      'message',  'Cut the preamble. Start with the answer, not "Sure".'],
	['SURE, HERE IS THE FIX.\n\nFIX IT.',         0,      'phrase',   'SURE'],
	['SURE, HERE IS THE FIX.\n\nFIX IT.',         0,      'message',  'Cut the preamble. Start with the answer, not "SURE".'],
	["Here's the fix.\n\nFix it.",                0,      'phrase',   "Here's"],
	['Fix it.\n\nHope this helps!',               0,      'phrase',   'Hope this helps'],
	['Fix it.\n\nHope this helps!',               0,      'place',    'end'],
	['Fix it.\n\nHope this helps!',               0,      'context',  'Fix it.\n\nHope this helps!'],
	['Fix it.\n\nHope this helps!',               0,      'message',  'Cut the closing remark. Stop when the content stops, not "Hope this helps".'],
	['Certainly! Fix it.\n\nHope this helps!',    1,      'phrase',   'Hope this helps'],
	['Certainly! Fix it.\n\nHope this helps!',    1,      'place',    'end'],
	['Let me know if you need more.',             0,      'phrase',   'Let me'],
	['Fix it.\n\nLet me know if you need more.',  0,      'phrase',   'Let me know'],
	['Sure-fire fix.\n\nFix it.',                 0,      'phrase',   'Sure'],
	['Fix it.\n\noverall_score is 5.',            0,      'phrase',   'overall'],
	['Fix it.\n\nHappy to help more.',            0,      'phrase',   'Happy to'],
	['As an AI-made note, it is fine.\n\nFix it.', 0,     'message',  'Cut the preamble. Start with the answer, not "As an AI".'],
	['Fix it.\n\nHOPE THIS HELPS!',               0,      'message',  'Cut the closing remark. Stop when the content stops, not "HOPE THIS HELPS".'],
	['Fix it.\n\nHOPE THIS HELPS!',               0,      'context',  'Fix it.\n\nHOPE THIS HELPS!'],
]

for (const [text, match, field, value] of fields) {
	test(`match ${match} carries ${field}`, () => assert.deepEqual(noPreamble(text)[match][field], value))
}

// The whole output, every field but message
const outputs = [
	// text                                     matches
	['The build fails.\n\nFix the import.',     []],
	['Sure, here is the fix.\n\nFix it.',       [{ index: 0, length: 22, text: 'Sure, here is the fix.', context: 'Sure, here is the fix.\n\nFix it.', phrase: 'Sure', place: 'start' }]],
	['Fix it.\n\nHope this helps!',             [{ index: 9, length: 16, text: 'Hope this helps!', context: 'Fix it.\n\nHope this helps!', phrase: 'Hope this helps', place: 'end' }]],
	['Certainly! Fix it.\n\nHope this helps!',  [{ index: 0, length: 18, text: 'Certainly! Fix it.', context: 'Certainly! Fix it.\n\nHope this helps!', phrase: 'Certainly', place: 'start' }, { index: 20, length: 16, text: 'Hope this helps!', context: 'Certainly! Fix it.\n\nHope this helps!', phrase: 'Hope this helps', place: 'end' }]],
	['Let me know if you need more.',           [{ index: 0, length: 29, text: 'Let me know if you need more.', context: 'Let me know if you need more.', phrase: 'Let me', place: 'start' }]],
	['   Sure, fix it.\n\nFix it.',              [{ index: 3, length: 13, text: 'Sure, fix it.', context: '   Sure, fix it.\n\nFix it.', phrase: 'Sure', place: 'start' }]],
	// text                                     matches
	['Sure. Here is the fix.\n\nFix it.',       [{ index: 0, length: 22, text: 'Sure. Here is the fix.', context: 'Sure. Here is the fix.\n\nFix it.', phrase: 'Sure', place: 'start' }]],
	['\tSure, fix it.\n\nFix it.',              [{ index: 1, length: 13, text: 'Sure, fix it.', context: '\tSure, fix it.\n\nFix it.', phrase: 'Sure', place: 'start' }]],
	['Sure\u00A0fix it.\n\nFix it.',            [{ index: 0, length: 12, text: 'Sure\u00A0fix it.', context: 'Sure\u00A0fix it.\n\nFix it.', phrase: 'Sure', place: 'start' }]],
	['Fix it.\n\noverall_score is 5.',          [{ index: 9, length: 19, text: 'overall_score is 5.', context: 'Fix it.\n\noverall_score is 5.', phrase: 'overall', place: 'end' }]],
	['Fix it.\n\nHOPE THIS HELPS!',             [{ index: 9, length: 16, text: 'HOPE THIS HELPS!', context: 'Fix it.\n\nHOPE THIS HELPS!', phrase: 'HOPE THIS HELPS', place: 'end' }]],
	['As an AI-made note, it is fine.\n\nFix it.',  [{ index: 0, length: 31, text: 'As an AI-made note, it is fine.', context: 'As an AI-made note, it is fine.\n\nFix it.', phrase: 'As an AI', place: 'start' }]],
]

for (const [text, matches] of outputs) {
	test(`noPreamble output for ${JSON.stringify(text)}`, () => assert.deepEqual(noPreamble(text).map(({ message, ...m }) => m), matches))
}

// Every match of every row must point at its own text.
test('index and length always cut the match text', () => {
	for (const [name, text] of cases) {
		for (const m of noPreamble(text)) assert.equal(text.slice(m.index, m.index + m.length), m.text, name)
	}
	for (const [text] of outputs) {
		for (const m of noPreamble(text)) assert.equal(text.slice(m.index, m.index + m.length), m.text, text)
	}
})

// The rule takes no options. A second argument changes nothing, and a non-string input is coerced.
const inputs = [
	// name                        call                                                matches
	['no argument',                () => noPreamble(),                                 []],
	['undefined',                  () => noPreamble(undefined),                        []],
	['null',                       () => noPreamble(null),                             []],
	['a number',                   () => noPreamble(123),                              []],
	['an object',                  () => noPreamble({}),                               []],
	['an array of one string',     () => noPreamble(['Sure, fix it.']),                [[0, 'Sure, fix it.', 'start']]],
	['an extra option object',     () => noPreamble('Sure, fix it.', {}),              [[0, 'Sure, fix it.', 'start']]],
	['an extra zero knob',         () => noPreamble('Sure, fix it.', { max: 0 }),      [[0, 'Sure, fix it.', 'start']]],
	['an extra wrong type knob',   () => noPreamble('Sure, fix it.', 'nonsense'),      [[0, 'Sure, fix it.', 'start']]],
]

for (const [name, call, matches] of inputs) {
	test(`input: ${name}`, () => assert.deepEqual(call().map(m => [m.index, m.text, m.place]), matches))
}

test('a long paragraph still reports one match', () => {
	const body = 'the build fails and the import is wrong '.repeat(200)
	const text = 'Sure, ' + body + 'today.'
	assert.deepEqual(noPreamble(text).map(m => [m.index, m.length, m.place]), [[0, text.length, 'start']])
})
