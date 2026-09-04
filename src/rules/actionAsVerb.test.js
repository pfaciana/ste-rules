import { test } from 'node:test'
import assert from 'node:assert/strict'
import { actionAsVerb } from './actionAsVerb.js'

// Every match, exactly: [index, text, noun]. The match runs from the weak verb to the action noun.
const cases = [
	// name                                    text                                             matches
	['empty',                                  '',                                              []],
	['a plain verb',                           'Validate the input.',                           []],
	['at the very start',                      'Perform a validation of the input.',            [[0, 'Perform a validation', 'validation']]],
	['at the very end',                        'The team will perform a validation',            [[14, 'perform a validation', 'validation']]],
	['upper case',                             'PERFORM A VALIDATION.',                         [[0, 'PERFORM A VALIDATION', 'VALIDATION']]],
	['across a line break',                    'Perform a\nvalidation.',                        [[0, 'Perform a\nvalidation', 'validation']]],
	['brackets around the match',              '(Perform a validation).',                       [[1, 'Perform a validation', 'validation']]],
	['commas inside the match',                'Perform, then, a validation.',                  [[0, 'Perform, then, a validation', 'validation']]],
	['two matches, exact places',              'Perform a validation. Conduct an assessment.',  [[0, 'Perform a validation', 'validation'], [22, 'Conduct an assessment', 'assessment']]],
	['two matches in one sentence',            'Perform a validation and provide an explanation.', [[0, 'Perform a validation', 'validation'], [25, 'provide an explanation', 'explanation']]],
	// the window: the noun must come within three words of the verb
	['the noun one word away',                 'Perform validation.',                           [[0, 'Perform validation', 'validation']]],
	['the noun two words away',                'Perform a validation.',                         [[0, 'Perform a validation', 'validation']]],
	['the noun three words away',              'Perform a full validation.',                    [[0, 'Perform a full validation', 'validation']]],
	['the noun four words away',               'Perform the long and slow validation.',         []],
	['the verb at the end of the text',        'This is what we perform',                       []],
	['the first noun in the window wins',      'Perform a validation assessment.',              [[0, 'Perform a validation', 'validation']]],
	// weakVerbs: one row per entry
	['perform',                                'Perform a validation.',                         [[0, 'Perform a validation', 'validation']]],
	['performs',                               'She performs a validation.',                    [[4, 'performs a validation', 'validation']]],
	['performed',                              'We performed a validation.',                    [[3, 'performed a validation', 'validation']]],
	['conduct',                                'We conduct an assessment each week.',           [[3, 'conduct an assessment', 'assessment']]],
	['conducts',                               'He conducts an assessment.',                    [[3, 'conducts an assessment', 'assessment']]],
	['conducted',                              'They conducted an assessment.',                 [[5, 'conducted an assessment', 'assessment']]],
	['provide',                                'Provide an explanation.',                       [[0, 'Provide an explanation', 'explanation']]],
	['provides',                               'It provides an explanation.',                   [[3, 'provides an explanation', 'explanation']]],
	['provided',                               'She provided an explanation.',                  [[4, 'provided an explanation', 'explanation']]],
	// suffixes: one row per entry
	['the tion ending',                        'Perform a validation.',                         [[0, 'Perform a validation', 'validation']]],
	['the ment ending',                        'Conduct an assessment.',                        [[0, 'Conduct an assessment', 'assessment']]],
	['the ance ending',                        'Provide maintenance.',                          [[0, 'Provide maintenance', 'maintenance']]],
	['the ence ending',                        'Provide adherence to the rules.',               [[0, 'Provide adherence', 'adherence']]],
	['a hyphen inside the noun',               'Perform a re-validation.',                      [[0, 'Perform a re-validation', 're-validation']]],
	// concrete: one row per ending, with a real entry from the list
	['function is concrete',                   'Perform the function of the parser.',           []],
	['document is concrete',                   'Provide the document.',                         []],
	['distance is concrete',                   'Provide a distance.',                           []],
	['sentence is concrete',                   'Provide a sentence.',                           []],
	['information is concrete',                'Provide information.',                          []],
	// near misses
	['performance is not the verb perform',    'The performance was slow.',                     []],
	['a strong verb with an action noun',      'We complete a validation.',                     []],
	['an action noun with no weak verb',       'The validation failed.',                        []],
	['a weak verb with no noun after it',      'Perform the task and stop.',                    []],
	// empty and tiny
	['the user sent only spaces',              '   \t\n  ',                                     []],
	['the user sent one letter',               'a',                                             []],
	['the user sent one word',                 'perform',                                       []],
	['the user sent no punctuation at all',    'Perform a validation',                          [[0, 'Perform a validation', 'validation']]],
	// whitespace and Unicode
	['the agent used tabs between the words',  'Perform\ta\tvalidation.',                       [[0, 'Perform\ta\tvalidation', 'validation']]],
	['the agent used a CRLF line end',         'Perform a\r\nvalidation.',                      [[0, 'Perform a\r\nvalidation', 'validation']]],
	['the agent used a no-break space',        'Perform a validation.',               [[0, 'Perform a validation', 'validation']]],
	['the agent wrote an accent in the match', 'Perform a rôle validation.',                    [[0, 'Perform a rôle validation', 'validation']]],
	['the agent wrote Cyrillic before it',     'Это perform a validation.',                     [[4, 'perform a validation', 'validation']]],
	['the agent ended with a CJK stop',        'Perform a validation。',                        [[0, 'Perform a validation', 'validation']]],
	['the agent put an emoji on the noun',     'Perform a validation🎉 now.',                   [[0, 'Perform a validation', 'validation']]],
	// markdown leftovers
	['the agent left a heading marker',        '## Perform a validation',                       [[3, 'Perform a validation', 'validation']]],
	['the agent left a dash list marker',      '- Perform a validation',                        [[2, 'Perform a validation', 'validation']]],
	['the agent left a number list marker',    '1. Perform a validation',                       [[3, 'Perform a validation', 'validation']]],
	['the agent left bold marks',              '**Perform a validation**',                      [[2, 'Perform a validation', 'validation']]],
	['the agent left backtick code marks',     '`perform a validation`',                        [[1, 'perform a validation', 'validation']]],
	['the agent left a table row',             '| Perform a validation | ok |',                 [[2, 'Perform a validation', 'validation']]],
	['the agent left a block quote marker',    '> Perform a validation.',                       [[2, 'Perform a validation', 'validation']]],
	['the noun sits inside a link target',     '[Perform a validation](https://x.test)',        []],
	['the verb sits inside a link target',     '[Perform](https://x.test) a validation.',       []],
	// code and URLs
	['the noun is a snake_case name',          'Perform a run_validation.',                     [[0, 'Perform a run_validation', 'run_validation']]],
	['the noun is a camelCase name',           'Perform a validationCheck.',                    []],
	['a file path follows the match',          'Perform a validation of src/lib/validation.js.', [[0, 'Perform a validation', 'validation']]],
	['a URL follows the match',                'Perform a validation at https://example.test/validation.', [[0, 'Perform a validation', 'validation']]],
	['an email follows the match',             'Provide an explanation to dev@example.test.',   [[0, 'Provide an explanation', 'explanation']]],
	['a version number follows the match',     'Perform a validation of v1.2.3.',               [[0, 'Perform a validation', 'validation']]],
	['a commit hash follows the match',        'Perform a validation on a1b2c3d.',              [[0, 'Perform a validation', 'validation']]],
	['the noun sits in a template slot',       'Perform a ${validation}.',                      [[0, 'Perform a ${validation', 'validation']]],
	['a shell variable follows the match',     'Perform a validation of $HOME.',                [[0, 'Perform a validation', 'validation']]],
	// numbers and dates
	['a grouped number follows the match',     'Perform a validation of 1,000 rows.',           [[0, 'Perform a validation', 'validation']]],
	['a percent follows the match',            'Perform a validation of 50% of rows.',          [[0, 'Perform a validation', 'validation']]],
	['a price follows the match',              'Provide an explanation of $5 fees.',            [[0, 'Provide an explanation', 'explanation']]],
	['a clock time follows the match',         'Perform a validation at 10:30.',                [[0, 'Perform a validation', 'validation']]],
	['an ISO date follows the match',          'Perform a validation on 2026-09-04.',           [[0, 'Perform a validation', 'validation']]],
	['a slash date follows the match',         'Perform a validation on 9/4/2026.',             [[0, 'Perform a validation', 'validation']]],
	['an ordinal follows the match',           'Provide an explanation on the 3rd.',            [[0, 'Provide an explanation', 'explanation']]],
	// punctuation
	['quotes around the match',                '"Perform a validation."',                       [[1, 'Perform a validation', 'validation']]],
	['an ellipsis after the match',            'Perform a validation... Now stop.',             [[0, 'Perform a validation', 'validation']]],
	['an em dash inside the match',            'Perform — a validation.',                       [[0, 'Perform — a validation', 'validation']]],
	['a question and a bang after it',         'Perform a validation?!',                        [[0, 'Perform a validation', 'validation']]],
	['the match ends the second sentence',     'Ok. Then perform a validation.',                [[9, 'perform a validation', 'validation']]],
	// case
	['the agent wrote Title Case',             'Perform A Validation.',                         [[0, 'Perform A Validation', 'Validation']]],
	['the agent wrote a camelCase call',       'performAValidation();',                         []],
	// contractions and possessives
	['a contraction before the match',         "It's time to perform a validation.",            [[13, 'perform a validation', 'validation']]],
	['a negative contraction starts it',       "Don't perform a validation.",                   [[6, 'perform a validation', 'validation']]],
	['a possessive inside the match',          "Perform the tool's validation.",                [[0, "Perform the tool's validation", 'validation']]],
	['a possessive with no weak verb',         "The tool's validation is fine.",                []],
	['a plural possessive with no verb',       "James' validation was provided.",               []],
	['they are, then the match',               "They're going to provide an explanation.",      [[17, 'provide an explanation', 'explanation']]],
	// traps: it looks like a hit and it is not
	['a typo of the weak verb',                'We preformed a validation.',                    []],
	['the noun performance starts it',         'Performance validation is required.',           []],
	['the noun is four words away',            'Perform a test of the validation later.',       []],
	['the agent named a provider',             'The provider gave an explanation.',             []],
	['the plural options has no ending',       'Provide options.',                              []],
	['the option is a concrete thing',         'Provide the option.',                           []],
	// traps: it reads well and it is still a hit
	['provide an implementation',              'Provide an implementation.',                    [[0, 'Provide an implementation', 'implementation']]],
	['provide assurance',                      'Provide assurance.',                            [[0, 'Provide assurance', 'assurance']]],
	['conduct an experiment',                  'Conduct an experiment.',                        [[0, 'Conduct an experiment', 'experiment']]],
	['provide guidance',                       'Provide guidance.',                             [[0, 'Provide guidance', 'guidance']]],
	['perform an inspection',                  'Perform an inspection.',                        [[0, 'Perform an inspection', 'inspection']]],
	['provide confidence',                     'Provide confidence.',                           [[0, 'Provide confidence', 'confidence']]],
	['documentation is not document',          'Provide the documentation.',                    [[0, 'Provide the documentation', 'documentation']]],
	// length extremes
	['a long paragraph, one hit at the end',   'The team met on Monday and the team read the notes and the team agreed on a plan, then the team will perform a validation.', [[101, 'perform a validation', 'validation']]],
]

for (const [name, text, matches] of cases) {
	test(name, () => {
		const found = actionAsVerb(text)
		assert.deepEqual(found.map(m => [m.index, m.text, m.noun]), matches)
		for (const m of found) assert.equal(text.slice(m.index, m.index + m.length), m.text, 'length')
	})
}

const fields = [
	// text                                    at   field       value
	['Perform a validation.',                  0,   'verb',     'Perform'],
	['Perform a validation.',                  0,   'noun',     'validation'],
	['We performed a validation.',             0,   'verb',     'performed'],
	['PERFORM A VALIDATION.',                  0,   'noun',     'VALIDATION'],
	['Ok. Perform a validation.',              0,   'context',  'Perform a validation.'],
	['Perform a validation. Conduct a test.',  0,   'context',  'Perform a validation.'],
	['Ok. Conduct an assessment.',             0,   'message',  'Use the verb behind "assessment", not "Conduct an assessment".'],
	['Perform a validation.',                  0,   'message',  'Use the verb behind "validation", not "Perform a validation".'],
	['Perform a validation. Provide a plan.',  0,   'message',  'Use the verb behind "validation", not "Perform a validation".'],
	['Perform a validation. Conduct an assessment.', 1, 'verb',    'Conduct'],
	['Perform a validation. Conduct an assessment.', 1, 'noun',    'assessment'],
	['Perform a validation. Conduct an assessment.', 1, 'context', 'Conduct an assessment.'],
	['Perform a validation. Conduct an assessment.', 1, 'message', 'Use the verb behind "assessment", not "Conduct an assessment".'],
]

for (const [text, at, field, value] of fields) {
	test(`match ${at} carries ${field} for "${text}"`, () => assert.deepEqual(actionAsVerb(text)[at][field], value))
}

// The whole output, every field but message
const outputs = [
	// text                                              matches
	['Validate the input.',                              []],
	['Perform a validation.',                            [{ index: 0, length: 20, text: 'Perform a validation', context: 'Perform a validation.', verb: 'Perform', noun: 'validation' }]],
	['The team will perform a validation',               [{ index: 14, length: 20, text: 'perform a validation', context: 'The team will perform a validation', verb: 'perform', noun: 'validation' }]],
	['Perform a\nvalidation.',                           [{ index: 0, length: 20, text: 'Perform a\nvalidation', context: 'Perform a\nvalidation.', verb: 'Perform', noun: 'validation' }]],
	['Perform a validation. Conduct an assessment.',     [{ index: 0, length: 20, text: 'Perform a validation', context: 'Perform a validation.', verb: 'Perform', noun: 'validation' }, { index: 22, length: 21, text: 'Conduct an assessment', context: 'Conduct an assessment.', verb: 'Conduct', noun: 'assessment' }]],
	['Perform a validation and provide an explanation.', [{ index: 0, length: 20, text: 'Perform a validation', context: 'Perform a validation and provide an explanation.', verb: 'Perform', noun: 'validation' }, { index: 25, length: 22, text: 'provide an explanation', context: 'Perform a validation and provide an explanation.', verb: 'provide', noun: 'explanation' }]],
]

for (const [text, matches] of outputs) {
	test(`actionAsVerb output for ${JSON.stringify(text)}`, () => assert.deepEqual(actionAsVerb(text).map(({ message, ...m }) => m), matches))
}

// Every match of every row, in full: the span, the extra keys, and the message built from them.
for (const [name, text] of cases) {
	test(`every field holds for "${name}"`, () => {
		for (const m of actionAsVerb(text)) {
			assert.equal(text.slice(m.index, m.index + m.length), m.text, 'slice')
			assert.equal(m.length, m.text.length, 'length')
			assert.ok(m.text.startsWith(m.verb), 'verb at the start')
			assert.ok(m.text.endsWith(m.noun), 'noun at the end')
			assert.equal(typeof m.context, 'string')
			assert.ok(m.context.length > 0, 'context')
			assert.equal(m.message, `Use the verb behind "${m.noun}", not "${m.text}".`)
		}
	})
}

// The input the function gets is not always a string. The code coerces it.
const coercions = [
	// name                          input                   matches
	['no argument at all',           undefined,              []],
	['null',                         null,                   []],
	['a number',                     123,                    []],
	['an empty object',              {},                     []],
	['an empty array',               [],                     []],
	['an array of one string',       ['Perform a validation.'], [[0, 'Perform a validation', 'validation']]],
]

for (const [name, input, matches] of coercions) {
	test(`the input is ${name}`, () => assert.deepEqual(actionAsVerb(input).map(m => [m.index, m.text, m.noun]), matches))
}

test('a second argument is ignored', () => assert.equal(actionAsVerb('Perform a validation.', {}).length, 1))
test('a zero option is ignored', () => assert.equal(actionAsVerb('Perform a validation.', { limit: 0 }).length, 1))
test('a wrong type for an option is ignored', () => assert.equal(actionAsVerb('Perform a validation.', 'nope').length, 1))
