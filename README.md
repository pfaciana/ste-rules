# ste-rules

ste-rules is a set of writing rules for plain text, for Node.js, with zero dependencies. It checks the text that LLM agents write.

A string goes in. A list of matches comes out. Each match points at the exact span, with a message.

The rules come from Simplified Technical English, from Orwell's rules for plain writing, and from hard size caps. One function per rule. The caller picks the rules.

ste-rules also gives you:

- A match with `index`, `length`, `text`, `context`, and `message`
- A knob per rule, such as a word limit
- The text helpers: sentences, words, paragraphs, phrases
- One folder to copy, or one npm package

## Requirements

- Node.js v20 or later
- Plain text. The rules do not read markdown. Strip the markup first, with [mdast-zero](https://github.com/pfaciana/mdast-zero) or any other tool.

## Install

### With npm

```sh
npm install ste-rules
```

```js
import { noSemicolons } from 'ste-rules'
```

### As a copy

Install the library into your project with `tiged`. No `node_modules`. You can pick any folder.

```sh
npx tiged pfaciana/ste-rules scripts/ste-rules
```

Add the import map to your `package.json`:

```json
{
	"type": "module",
	"imports": {
		"#ste-rules": "./scripts/ste-rules/index.js"
	}
}
```

Every file in your project can then use the same import:

```js
import { noSemicolons } from '#ste-rules'
```

If you picked a different folder, change the path in `imports`.

To pin a version, put a release tag after the repo name, in the form `#v1.2.3`:

```sh
npx tiged pfaciana/ste-rules#v1.2.3 scripts/ste-rules
```

The tag list is on the [releases page](https://github.com/pfaciana/ste-rules/releases).

The `demo` folder in this repo is a complete consumer: the import map, one script, and a test.

## Update

With npm:

```sh
npm update ste-rules
```

As a copy, the update is a fresh copy. The `--force` flag removes the old copy first, so files from old versions cannot linger:

```sh
npx tiged pfaciana/ste-rules scripts/ste-rules --force
```

If you pinned a version, change the tag in the command to the new release.

After the update, read the release notes for changed behavior, then run your tests. A word list can grow, so a text that passed before can get new matches.

Keep your own code out of the library folder. The update removes everything inside it.

## Usage

One import per rule, one call. The text goes in. The matches come out. An empty array means pass.

```js
import { noSemicolons, noPhrasalVerbs, maxWordsPerSentence } from 'ste-rules'

noSemicolons('Run the tests. Then commit.')
// []

noSemicolons('Run the tests; then commit.')
// [ { index: 13, length: 1, text: ';', context: 'Run the tests; then commit.',
//     message: 'Cut the semicolon. Write two sentences.' } ]
```

### The Match

Every match has the same five fields:

```
index     where the span starts in the input string
length    how long the span is
text      the exact span to change
context   the unit the rule read: the sentence, the paragraph, or the whole text
message   what to do, in one or two sentences
```

Some rules add fields with the facts behind the message. `noPhrasalVerbs` adds `alternatives`:

```js
noPhrasalVerbs('Commit prior to the release.')
// [ { index: 7, length: 8, text: 'prior to', context: 'Commit prior to the release.',
//     alternatives: [ 'before' ],
//     message: 'Use one plain verb. Replace "prior to" with "before".' } ]
```

The extra fields per rule are in [docs/reference.md](docs/reference.md).

### Options

A rule with a knob takes an options object as the second argument. Every knob has a default.

```js
maxWordsPerSentence(text, { limit: 25 })            // default 20
noAmbiguousAbbreviations(text, { allow: ['CDP'] })  // more abbreviations to pass
noPhrasalVerbs(text, { allow: ['spin up'] })        // entries to pass, such as a project's own terms
```

### Several Rules

The caller picks the rules. Put them in an object, loop, and keep the rule name:

```js
const rules = { noSemicolons, noPhrasalVerbs, maxWordsPerSentence }

const matches = []
for (const [rule, fn] of Object.entries(rules)) for (const m of fn(text)) matches.push({ rule, ...m })
matches.sort((a, b) => a.index - b.index)
```

The `demo` folder holds this loop as a small script with a test.

## The Rules

One function per rule. Each one reads one unit: the whole text, a paragraph, a sentence, or a word. The extra fields per rule are in [docs/reference.md](docs/reference.md).

### Counts

| Function                | Reads     | Match when                                    |
|-------------------------|-----------|-----------------------------------------------|
| `noSemicolons`          | text      | a `;` is found                                |
| `maxWordsPerSentence`   | sentence  | over 20 words. `limit`                        |
| `maxWordsPerParagraph`  | paragraph | over 50 words. `limit`                        |
| `maxParagraphs`         | text      | over 4 paragraphs. `limit`                    |
| `maxWordsLastParagraph` | text      | the last paragraph has over 10 words. `limit` |

`maxWordsLastParagraph` serves one house rule: end with the next step, in one short line. The function checks the length. It cannot check the meaning. A person, or a prompt rule, checks that the line names a next step.

### Word Lists

| Function                   | Reads    | Match when                                        |
|----------------------------|----------|---------------------------------------------------|
| `approvedModals`           | sentence | a modal other than can, will, must                |
| `noPhrasalVerbs`           | sentence | a phrase with a shorter form. `allow`             |
| `noWordyPhrases`           | sentence | a wordy phrase with a shorter form. `allow`       |
| `plainWords`               | sentence | a formal word with a plain form. `allow`          |
| `noUnnamedAuthority`       | sentence | "experts say" or a similar phrase                 |
| `noNeedlessWords`          | sentence | slop, restatement, marketing, or filler. `allow`  |
| `oneHedge`                 | sentence | over one hedge word. `limit`                      |
| `noPreamble`               | text     | an opener or a closing remark                     |

### Heuristics

| Function                   | Reads    | Match when                                                |
|----------------------------|----------|-----------------------------------------------------------|
| `noIngVerbs`               | sentence | a be-verb, then an -ing word                              |
| `activeVoice`              | sentence | a be-verb, then a past participle                         |
| `passiveWithNamedAgent`    | sentence | a passive, then "by" and a name                           |
| `actionAsVerb`             | sentence | a weak verb, then a -tion, -ment, -ance, or -ence noun    |
| `noStackedAuxiliaries`     | sentence | two auxiliaries in a row, except will be, can be, must be |
| `noPerfectTense`           | sentence | have, has, or had, then a past participle                 |
| `clearPronouns`            | sentence | the sentence opens with a bare pronoun                    |
| `noAmbiguousAbbreviations` | sentence | a run of capitals not in the allow list. `allow`          |
| `oneInstruction`           | sentence | "and then", or ", then" with no condition word first      |

### Opt-in

| Function        | Reads | Match when                                      |
|-----------------|-------|-------------------------------------------------|
| `approvedWords` | word  | the word is not in `approved`. `technicalNames` |

`maxParagraphs`, `maxWordsLastParagraph`, and `noPreamble` read a whole answer, not a document. A long document has many paragraphs by design.

A name after the check, such as `limit` or `allow`, is the option that tunes the rule.

## False Hits

The heuristics read word patterns, not grammar. There is no parser and no tagger. So each one guesses, and a guess can be wrong in two ways.

Over-flags, a match on good text:

- `activeVoice` reads "is closed" as passive. The adjective looks like a participle. A list of common non-participles covers the usual cases.
- `noNeedlessWords` flags a slop word in a quote or a name.
- `clearPronouns` flags "This" at the start of a short bullet, where the referent is the bullet above.
- `noAmbiguousAbbreviations` reads a sentence in capitals as a shout and skips it whole, so an abbreviation inside it passes.
- `noPerfectTense` reads a name after "We've" as a verb. "We've Ted to thank" is flagged.

Misses, no match on bad text:

- `noIngVerbs` needs a be-verb before the -ing word. "Running the tests shows" passes.
- `clearPronouns` reads the first word only. A bare "it" in the middle of a sentence passes.
- `noPreamble` and `noUnnamedAuthority` know their lists. A new phrase passes.
- `activeVoice` starts at a be-verb only. "It got fixed" passes.
- `noPerfectTense` needs a word such as "the" after the verb. "We have received approval" passes.

Treat a heuristic match as a hint, not a verdict. Give it a lower level than a count rule, or let a person confirm it. Only a count is exact. A word list flags every listed word, so it also flags a listed word in a quote or a name.

Some lists overlap. `may` is a modal and a hedge. `prior to` is a phrasal verb, a wordy phrase, and a formal word. One span can get a match from each rule that lists it.

## Your Own Rules

The rules are built on six text helpers. They are exported too, so a new rule takes a few lines.

```js
import { sentences, sentenceAt, paragraphs, words, wordCount, phrases } from 'ste-rules'

sentences('Run the tests. Then commit.')
// [ { text: 'Run the tests.', index: 0, length: 14 }, { text: 'Then commit.', index: 15, length: 12 } ]

sentenceAt('Run the tests. Then commit.', 20)
// 'Then commit.'                        the sentence around an index, for a match's context

paragraphs('One.\n\nTwo two.')
// [ { text: 'One.', index: 0, length: 4 }, { text: 'Two two.', index: 6, length: 8 } ]

words('Run the flat-tool, now.')
// [ { text: 'Run', index: 0 }, { text: 'the', index: 4 }, { text: 'flat-tool,', index: 8 }, { text: 'now.', index: 19 } ]

wordCount('Run the flat-tool, now.')
// 4

phrases('Commit prior to the release.', ['prior to', 'in order to'])
// [ { index: 7, length: 8, text: 'prior to', entry: 'prior to' } ]
```

A word is a run between whitespace, whole: `flat-tool,` and `don't` and `https://x.com/a` are each one word. Nothing inside a run is cut. A run with no letter and no digit, such as `-` or `...`, is not a word. A rule that looks a word up ignores the punctuation at its ends and the case: `Stop.` is looked up as `stop`.

A rule of your own returns the same match shape, so it drops into the same loop:

```js
export function noExclamations(text) {
	const out = []
	for (let i = text.indexOf('!'); i !== -1; i = text.indexOf('!', i + 1)) {
		out.push({ index: i, length: 1, text: '!', context: sentenceAt(text, i), message: 'Cut the exclamation mark.' })
	}
	return out
}
```

## Approved Words

Simplified Technical English has one core rule: use only the approved words, plus the technical names of your own project. The rule `approvedWords` does that check. It is opt-in, and it ships with no word list.

The approved words are Part 2 of the ASD-STE100 specification. ASD owns that document. ste-rules does not copy it. You bring your own list:

```js
import { approvedWords } from 'ste-rules'

const approved = ['remove', 'the', 'tool', ...]     // your list, one word per entry

approvedWords('Remove the widget.', { approved })
// [ { index: 11, length: 6, text: 'widget', context: 'Remove the widget.',
//     message: '"widget" is not an approved word. Use a dictionary word, or add it as a technical name.' } ]

approvedWords('Remove the widget.', { approved, technicalNames: ['widget'] })
// []
```

With no `approved` list, the rule returns nothing. Both lists are case folded. A number and a single letter always pass.

The specification is free from ASD, after a registration on their site: https://www.asd-ste100.org. A list of words you make from it is yours to keep, and yours to publish or not.

## License

MIT. Two helpers and most word lists are ported from other open projects, under MIT and Apache-2.0. Their notices are in [docs/THIRD_PARTY_NOTICES.md](docs/THIRD_PARTY_NOTICES.md).

ste-rules is unofficial. It is not affiliated with, endorsed by, or sponsored by ASD. ASD-STE100 is a registered European Union trade mark. ste-rules ships no part of the specification, and no word of its dictionary.
