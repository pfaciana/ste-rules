import { test } from 'node:test'
import assert from 'node:assert/strict'
import { paragraphs } from './Paragraphs.js'

const cases = [
	// name                      text                          paragraph texts
	['one paragraph',            'a b c',                       ['a b c']],
	['two paragraphs',           'a\n\nb',                      ['a', 'b']],
	['lines inside a paragraph', 'a\nb\n\nc',                   ['a\nb', 'c']],
	['blank line with spaces',   'a\n  \nb',                    ['a', 'b']],
	['several blank lines',      'a\n\n\n\nb',                  ['a', 'b']],
	['leading and trailing',     '\n\na\n\n',                   ['a']],
	['windows line endings',     'a\r\n\r\nb',                  ['a', 'b']],
	['empty',                    '',                            []],

	// name                          text                                    paragraph texts
	['whitespace only',              '  \n\t\n ',                            []],
	['one letter',                   'a',                                    ['a']],
	['one word, no punctuation',     'run',                                  ['run']],
	['a tab-only blank line',        'a\n\t\nb',                             ['a', 'b']],
	['a no-break space blank line',  'a\n \nb',                         ['a', 'b']],
	['crlf inside a paragraph',      'a\r\nb',                               ['a\r\nb']],
	['a trailing crlf',              'a\r\n',                                ['a']],
	['trailing spaces on a line',    'a  \n\nb',                             ['a', 'b']],
	['an indented block',            '   a\n   b',                           ['a\n   b']],
	['a heading, then a list',       '## Title\n\n- one\n- two',             ['## Title', '- one\n- two']],
	['a numbered list',              '1. one\n2. two',                       ['1. one\n2. two']],
	['bold text',                    '**bold** text',                        ['**bold** text']],
	['inline code',                  'Use `rg -u` here',                     ['Use `rg -u` here']],
	['a link',                       '[text](https://x.test/a)',             ['[text](https://x.test/a)']],
	['a table',                      '| a | b |\n|---|---|',                 ['| a | b |\n|---|---|']],
	['two block quotes',             '> quote\n\n> next',                    ['> quote', '> next']],
	['a fenced code block',          '```js\nlet a = 1\n```',                ['```js\nlet a = 1\n```']],
	['a blank line inside code',     '```\na\n\nb\n```',                     ['```\na', 'b\n```']],
	['a path, then a url',           'Open src/a.js\n\nSee https://x.test/a', ['Open src/a.js', 'See https://x.test/a']],
	['snake_case and camelCase',     'run_all_tests and runAllTests',        ['run_all_tests and runAllTests']],
	['an email address',             'Mail a@b.test',                        ['Mail a@b.test']],
	['a version and a hash',         'v1.2.3 and a1b2c3d4',                  ['v1.2.3 and a1b2c3d4']],
	['a slot and a variable',        'Set ${slot} and $HOME',                ['Set ${slot} and $HOME']],
	['numbers, then a date',         '1,000 and 50% and $5\n\n2026-09-04',   ['1,000 and 50% and $5', '2026-09-04']],
	['a time and a us date',         '10:30 on 9/4/2026',                    ['10:30 on 9/4/2026']],
	['an ellipsis and an em dash',   'Wait... — then go',                    ['Wait... — then go']],
	['a punctuation only line',      '---\n\na',                             ['---', 'a']],
	['an emoji paragraph',           '\u{1F680}\n\na',                       ['\u{1F680}', 'a']],
	['accents',                      'Café ouvert',                          ['Café ouvert']],
	['cyrillic, then cjk',           'Привет\n\n这是测试',                      ['Привет', '这是测试']],
	['all caps',                     'STOP THE BUILD',                       ['STOP THE BUILD']],
	['contractions',                 "It's fine, isn't it",                  ["It's fine, isn't it"]],
	['null',                         null,                                   []],
	['undefined',                    undefined,                              []],
	['a number, not a string',       12,                                     ['12']],
	['an empty options object',      '',                                     []],
]

for (const [name, text, expected] of cases) {
	test(name, () => assert.deepEqual(paragraphs(text).map(p => p.text), expected))
}

test('index and length point into the input', () => {
	const [, b] = paragraphs('a\n\n  b c')
	assert.equal(b.index, 5)
	assert.equal(b.length, 3)
})

test('slice(index, index + length) is the paragraph text', () => {
	for (const [name, text] of cases) {
		const input = String(text ?? '')
		for (const p of paragraphs(text)) assert.equal(input.slice(p.index, p.index + p.length), p.text, name)
	}
})

test('an options argument is ignored', () => {
	assert.deepEqual(paragraphs('a\n\nb', {}).map(p => p.text), ['a', 'b'])
	assert.deepEqual(paragraphs('a\n\nb', { limit: 0 }).map(p => p.text), ['a', 'b'])
	assert.deepEqual(paragraphs('a\n\nb', 'not an object').map(p => p.text), ['a', 'b'])
})

test('a paragraph at the word limit and one over', () => {
	const at = Array.from({ length: 50 }, (_, i) => `w${i}`).join(' ')
	const over = `${at} w50`
	assert.deepEqual(paragraphs(at).map(p => p.text), [at])
	assert.deepEqual(paragraphs(over).map(p => p.text), [over])
})

test('a long text returns an array', () => {
	const block = `${'word '.repeat(200).trim()}\n\n`
	const big = block.repeat(Math.ceil(1024 * 1024 / block.length))
	const out = paragraphs(big)
	assert.ok(Array.isArray(out))
	assert.ok(out.length > 0)
	assert.equal(big.slice(out[0].index, out[0].index + out[0].length), out[0].text)
})
