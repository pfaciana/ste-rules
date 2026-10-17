import { test } from 'node:test'
import assert from 'node:assert/strict'
import { plainWords } from './plainWords.js'

// Each row: a name, a text, and what the rule flags. A flag is [position, words].
const cases = [
	// name                              text                                    matches

	// the right way, then the wrong way
	['utilize, plain',                   'We use the cache.',                    []],
	['utilize, formal',                  'We utilize the cache.',                [[3, 'utilize']]],
	['utilized, plain',                  'The cache was used.',                  []],
	['utilized, formal',                 'The cache was utilized.',              [[14, 'utilized']]],
	['initiate, plain',                  'Start the job.',                       []],
	['initiate, formal',                 'Initiate the job.',                    [[0, 'Initiate']]],
	['facilitates, plain',               'It helps the team.',                   []],
	['facilitates, formal',              'It facilitates the team.',             [[3, 'facilitates']]],
	['indicated, plain',                 'The test showed the bug.',             []],
	['indicated, formal',                'The test indicated the bug.',          [[9, 'indicated']]],
	['obtained, plain',                  'We got the key.',                      []],
	['obtained, formal',                 'We obtained the key.',                 [[3, 'obtained']]],
	['ensure, plain',                    'Make sure the file exists.',           []],
	['ensure, formal',                   'Ensure the file exists.',              [[0, 'Ensure']]],
	['approximately, plain',             'It takes about 5 seconds.',            []],
	['approximately, formal',            'It takes approximately 5 seconds.',    [[9, 'approximately']]],
	['prior to, plain',                  'Do it before the release.',            []],
	['prior to, formal',                 'Do it prior to the release.',          [[6, 'prior to']]],
	['subsequent, plain',                'It is faster on later runs.',          []],
	['subsequent, formal',               'It is faster on subsequent runs.',     [[16, 'subsequent']]],
	['comprehensively, plain',           'It was completely tested.',            []],
	['comprehensively, formal',          'It was comprehensively tested.',       [[7, 'comprehensively']]],
	['a plethora of, plain',             'Many options exist.',                  []],
	['a plethora of, formal',            'A plethora of options exist.',         [[0, 'A plethora of']]],
	['pertaining to, plain',             'Notes about the build.',               []],
	['pertaining to, formal',            'Notes pertaining to the build.',       [[6, 'pertaining to']]],
	['the aforementioned, plain',        'Use this file.',                       []],
	['the aforementioned, formal',       'Use the aforementioned file.',         [[4, 'the aforementioned']]],
	['thus, plain',                      'It is fast, so we use it.',            []],
	['thus, formal',                     'It is fast, thus we use it.',          [[12, 'thus']]],
	['upper case, plain',                'USE THE CACHE.',                       []],
	['upper case, formal',               'UTILIZE THE CACHE.',                   [[0, 'UTILIZE']]],
	['two words, plain',                 'We use it and get the key.',           []],
	['two words, formal',                'We utilize it and obtain the key.',    [[3, 'utilize'], [18, 'obtain']]],
	['line break, plain',                'Notes about\nthe build.',              []],
	['line break, formal',               'Notes pertaining\nto the build.',      [[6, 'pertaining\nto']]],

	// left out of the list, because the word has a technical meaning
	['acquire a lock',                   'Acquire the lock first.',              []],
	['terminate a process',              'Terminate the process.',               []],
	['require a module',                 'Call require on the module.',          []],
	['a parking permit',                 'Show your parking permit.',            []],
	['elevate privileges',               'Elevate privileges with sudo.',        []],
	['at the beginning',                 'Go back to the beginning.',            []],
	['a purchase',                       'Make a purchase.',                     []],
	['Exhibit A',                        'See Exhibit A.',                       []],
	['employed by a company',            'She is employed by Acme.',             []],
	['a new endeavor',                   'It is a new endeavor.',                []],
	['a concerning trend',               'A concerning trend.',                  []],
	['thereby saving time',              'It runs once, thereby saving time.',   []],
	['a testament to',                   'It is a testament to the team.',       []],
	['the originating client',           'Reply to the originating client.',     []],
	['CPU utilization',                  'Check the CPU utilization.',           []],
	['prior art',                        'See the prior art section.',           []],
	['Pivotal Labs',                     'Built by Pivotal Labs.',               []],

	// not a formal word
	['empty text',                       '',                                     []],
	['priority is not prior',            'Set a high priority.',                 []],
	['utility is not utilize',           'The utility runs.',                    []],

	// known misses: formal, but not flagged
	['a formal word inside a hyphen',    'The job will auto-initiate a retry.',  []],
	['acquire, left out',                'We will acquire more users.',          []],
	['terminated, left out',             'The process was terminated early.',    []],

	// known false hits: correct text, but flagged
	['publicly perform, license text',   'You may publicly perform the work.',   [[17, 'perform']]],
]

for (const [name, text, matches] of cases) {
	test(name, () => {
		const found = plainWords(text)
		assert.deepEqual(found.map(m => [m.index, m.text]), matches)
		for (const m of found) {
			assert.equal(text.slice(m.index, m.index + m.length), m.text, 'length')
			assert.equal(m.message, `Use a plain word. Replace "${m.text}" with "${m.alternative}".`)
		}
	})
}