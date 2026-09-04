// Action nouns that hide a verb.
// Source: stazelabs-ste internal/lint/rules_syntax.go, MIT. weakVerbs 9, suffixes 4, concrete 48.

/** verbs that usually carry a nominal noun: perform an analysis */
export const weakVerbs = [
	'perform',
	'performs',
	'performed',
	'conduct',
	'conducts',
	'conducted',
	'provide',
	'provides',
	'provided'
]

/** endings of a noun that hides a verb */
export const suffixes = [
	'tion',
	'ment',
	'ance',
	'ence',
]

/** nouns with such an ending that name a thing, not an action */
export const concrete = [
	'function',
	'information',
	'position',
	'condition',
	'direction',
	'section',
	'question',
	'connection',
	'extension',
	'exception',
	'option',
	'version',
	'station',
	'portion',
	'fraction',
	'location',
	'population',
	'solution',
	'junction',
	'convention',
	'document',
	'environment',
	'argument',
	'instrument',
	'element',
	'moment',
	'department',
	'equipment',
	'component',
	'segment',
	'increment',
	'fragment',
	'distance',
	'instance',
	'balance',
	'appliance',
	'sentence',
	'reference',
	'sequence',
	'experience',
	'difference',
	'license',
	'presence',
	'absence',
	'science',
	'audience',
	'evidence',
	'influence'
]
