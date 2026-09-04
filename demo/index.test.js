import { test } from 'node:test'
import assert from 'node:assert/strict'
import { check } from './index.js'

const cases = [
	// name                      text                                              rules found, in index order
	['empty text',               '',                                               []],
	['clean text',               'Run the tests. Then commit.',                    []],
	['a semicolon',              'Run the tests; then commit.',                    ['noSemicolons']],
	['a phrasal verb',           'Commit prior to the release.',                   ['noPhrasalVerbs']],
	['two rules, index order',   'The file is written by the tool; then commit.',  ['activeVoice', 'noSemicolons']],
]

for (const [name, text, rules] of cases) {
	test(name, () => assert.deepEqual(check(text).map(m => m.rule), rules))
}
