import { test } from 'node:test'
import assert from 'node:assert/strict'
import { noPerfectTense } from './noPerfectTense.js'
import { sentenceAt } from '../Sentences.js'

// Every match, exactly: [index, text]. A match is have, has or had, then a participle that a function word follows.
// Read the known misses and the known false hits at the end before you use the rule.
const cases = [
	// name                                  text                                         matches
	// the right way, then the wrong way
	['article follows, simple past',         'We fixed the bug.',                         []],
	['article follows, perfect',             'We have fixed the bug.',                    [[3, 'have fixed']]],
	['pronoun follows, simple past',         'She received it.',                          []],
	['pronoun follows, perfect',             'She has received it.',                      [[4, 'has received']]],
	['sentence ends, simple past',           'The build finished.',                       []],
	['sentence ends, perfect',               'The build has finished.',                   [[10, 'has finished']]],
	['text ends, simple past',               'The build finished',                        []],
	['text ends, perfect',                   'The build has finished',                    [[10, 'has finished']]],
	['bracket then period, simple past',     '(The build finished).',                     []],
	['bracket then period, perfect',         '(The build has finished).',                 [[11, 'has finished']]],
	['preposition follows, simple past',     'The file moved to /tmp.',                   []],
	['preposition follows, perfect',         'The file has moved to /tmp.',               [[9, 'has moved']]],
	['irregular verb, simple past',          'They wrote the test.',                      []],
	['irregular verb, perfect',              'They had written the test.',                [[5, 'had written']]],
	['not between, simple past',             'We did not receive the file.',              []],
	['not between, perfect',                 'We have not received the file.',            [[3, 'have not received']]],
	['already between, simple past',         'It already ran the tests.',                 []],
	['already between, perfect',             'It has already run the tests.',             [[3, 'has already run']]],
	['contraction, simple past',             'They fixed the bug.',                       []],
	['contraction, perfect',                 "They've fixed the bug.",                    [[0, "They've fixed"]]],
	['curly contraction, simple past',       'We fixed it.',                              []],
	['curly contraction, perfect',           'We’ve fixed it.',                           [[0, 'We’ve fixed']]],
	['negative contraction, simple past',    'She did not fix the bug.',                  []],
	['negative contraction, perfect',        "She hasn't fixed the bug.",                 [[4, "hasn't fixed"]]],
	['upper case, simple past',              'WE FIXED THE BUG.',                         []],
	['upper case, perfect',                  'WE HAVE FIXED THE BUG.',                    [[3, 'HAVE FIXED']]],
	['line break, simple past',              'We\nfixed it.',                             []],
	['line break, perfect',                  'We have\nfixed it.',                        [[3, 'have\nfixed']]],
	['two sentences, simple past',           'We fixed it. She ran the tests.',           []],
	['two sentences, perfect',               'We have fixed it. She has run the tests.',  [[3, 'have fixed'], [22, 'has run']]],
	['limited with an object, simple past',  'We limited the scope.',                     []],
	['limited with an object, perfect',      'We have limited the scope.',                [[3, 'have limited']]],
	// sentences that use "have" but are fine. The rule must not flag them
	['have means own',                       'We have a plan.',                           []],
	['limited is an adjective',              'We have limited time.',                     []],
	['read describes access',                'Users have read access.',                   []],
	['escaped is an adjective',              'The string has escaped quotes.',            []],
	['cached is an adjective',               'The page has cached data.',                 []],
	['a comma breaks the pair',              'We have limited, shared resources.',        []],
	['an -ly word, then an adjective',       'We have highly detailed docs.',             []],
	['have got means own',                   "I've got a question.",                      []],
	["it's means it is",                     "It's fixed.",                               []],
	['need is a noun',                       'We have need of it.',                       []],
	['a hyphen keeps one word',              'It has built-in tests.',                    []],
	['a period breaks the pair',             'It had. Fixed it.',                         []],
	['limited to no is a range',             'We have limited to no visibility.',         []],
	['mixed to positive is a range',         'We have mixed to positive reviews.',        []],
	['Ted is a name',                        'We have Ted to thank.',                     []],
	['Fred is a name',                       'We have Fred in the lab.',                  []],
	// no sentence: empty text, or input that is not a string. The rule converts it to a string
	['empty text',                           '',                                          []],
	['no text at all',                       undefined,                                   []],
	['null',                                 null,                                        []],
	['a number',                             123,                                         []],
	['an array of one string',               ['We have fixed it.'],                       [[3, 'have fixed']]],
	// known misses: the perfect, but no match
	['a noun follows',                       'We have received approval.',                []],
	['a plural noun follows',                'We have fixed bugs.',                       []],
	['question order',                       'Have the tests passed?',                    []],
	["'s can also mean is",                  "He's fixed the bug.",                       []],
	["'d can also mean would",               "I'd started the job.",                      []],
	['an -ly word between',                  'We have finally fixed the bug.',            []],
	['a comma after the participle',         'We have finished, so we can go.',           []],
	['been, noStackedAuxiliaries flags it',  'It has been fixed.',                        []],
	['an object before the verb',            'The size we have limited to 10 MB.',        []],
	// known false hits: correct text, but a match
	['a name after a capital auxiliary',     "We've Ted to thank.",                       [[0, "We've Ted"]]],
]

// Each row: the matches, then every field of every match
for (const [name, text, matches] of cases) {
	test(name, () => {
		const found = noPerfectTense(text)
		assert.deepEqual(found.map(m => [m.index, m.text]), matches)
		for (const m of found) {
			const input = String(text)
			assert.equal(input.slice(m.index, m.index + m.length), m.text, 'length')
		}
	})
}
