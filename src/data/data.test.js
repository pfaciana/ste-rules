import { test } from 'node:test'
import assert from 'node:assert/strict'
import { beVerbs, irregular, notParticiples, edAdjectives, contractions } from './participles.js'
import { ingNouns } from './ingNouns.js'
import { hedges } from './hedges.js'
import { slop, restatements, marketing, fillers } from './needlessWords.js'
import { authority } from './authority.js'
import { phrasalVerbs } from './phrasalVerbs.js'
import { wordyPhrases } from './wordyPhrases.js'
import { formalWords } from './formalWords.js'
import { ambiguous, allowed } from './abbreviations.js'
import { weakVerbs, suffixes, concrete } from './actionNouns.js'
import { modals } from './modals.js'
import { pronouns, bareVerbs } from './pronouns.js'
import { openers, closers } from './preamble.js'

// Every list: its name, the value, the minimum entry count, and one entry it must hold.
const lists = [
	['beVerbs',         beVerbs,                   8,    'was'],
	['irregular',       irregular,                 60,   'written'],
	['notParticiples',  notParticiples,            20,   'need'],
	['edAdjectives',    edAdjectives,              10,   'limited'],
	['contractions',    Object.keys(contractions), 14,   "it's"],
	['ingNouns',        ingNouns,                  35,   'string'],
	['hedges',          hedges,                    13,   'possibly'],
	['slop',            slop,                      25,   'delve'],
	['restatements',    restatements,              8,    'in other words'],
	['marketing',       marketing,                 20,   'seamless'],
	['fillers',         fillers,                   6,    'please note that'],
	['authority',       authority,                 30,   'experts say'],
	['phrasalVerbs',    Object.keys(phrasalVerbs), 60,   'prior to'],
	['wordyPhrases',    Object.keys(wordyPhrases), 30,   'in order to'],
	['formalWords',     Object.keys(formalWords),  80,   'use'],
	['ambiguous',       Object.keys(ambiguous),    6,    'GC'],
	['allowed',         allowed,                   40,   'HTML'],
	['weakVerbs',       weakVerbs,                 3,    'perform'],
	['suffixes',        suffixes,                  4,    'tion'],
	['concrete',        concrete,                  40,   'function'],
	['modals',          Object.keys(modals),       7,    'should'],
	['pronouns',        pronouns,                  5,    'this'],
	['bareVerbs',       bareVerbs,                 20,   'is'],
	['openers',         openers,                   10,   'sure'],
	['closers',         closers,                   10,   'in summary'],
]

for (const [name, list, min, sample] of lists) {
	test(`${name}: at least ${min} entries, holds "${sample}"`, () => {
		assert.ok(list.length >= min, `${name} has ${list.length}`)
		assert.ok(list.includes(sample), `${name} lacks ${sample}`)
	})
}
