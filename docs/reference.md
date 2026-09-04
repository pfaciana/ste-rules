# ste-rules Reference

This page lists the whole API: every rule, its options, its extra fields, and its message. Then the text helpers. The README shows the common path. This page is the lookup.

How to read the tables:

- Every rule is `rule(text, options?)`. It returns an array of matches, empty on pass.
- Inputs is the unit the rule reads: the whole text, a paragraph, a sentence, or a word.
- Options is the options object: key, type, default. A blank cell means the rule takes no options.
- Additional Result Keys are the keys a match carries beyond the five common ones.
- Message is the template. A `${key}` slot is filled from the match.

## The Match

| Field     | Type   | Value                                                |
|-----------|--------|------------------------------------------------------|
| `index`   | number | where the span starts in the input string, 0-based   |
| `length`  | number | the length of the span                               |
| `text`    | string | the exact span, `input.slice(index, index + length)` |
| `context` | string | the unit the rule read                               |
| `message` | string | what to do, one or two sentences                     |

What `text` and `context` hold depends on the unit the rule reads:

| Reads     | `text`                                | `context`              |
|-----------|---------------------------------------|------------------------|
| word      | the word or phrase                    | the sentence around it |
| sentence  | the words past the limit, or the span | the sentence           |
| paragraph | the words past the limit              | the paragraph          |
| text      | the paragraph or the line at fault    | the whole input        |

A rule returns one match per fault. A count rule returns one match per unit over the limit. `maxWordsLastParagraph` returns at most one.

## Count Rules

A count is exact. These rules have no false hits.

| Function                | Inputs    | Options               | Additional Result Keys                             |
|-------------------------|-----------|-----------------------|----------------------------------------------------|
| `noSemicolons`          | text      |                       |                                                    |
| `maxWordsPerSentence`   | sentence  | `limit?: number = 20` | `count: number`, `limit: number`                   |
| `maxWordsPerParagraph`  | paragraph | `limit?: number = 50` | `count: number`, `limit: number`                   |
| `maxParagraphs`         | text      | `limit?: number = 4`  | `number: number`, `total: number`, `limit: number` |
| `maxWordsLastParagraph` | text      | `limit?: number = 10` | `count: number`, `limit: number`                   |

Messages:

| Rule                    | Message                                                                |
|-------------------------|------------------------------------------------------------------------|
| `noSemicolons`          | `Cut the semicolon. Write two sentences.`                              |
| `maxWordsPerSentence`   | `Cut to ${limit} words. This sentence has ${count}.`                   |
| `maxWordsPerParagraph`  | `Cut to ${limit} words. This paragraph has ${count}.`                  |
| `maxParagraphs`         | `Cut to ${limit} paragraphs. This is paragraph ${number} of ${total}.` |
| `maxWordsLastParagraph` | `Cut the last paragraph to ${limit} words. It has ${count}.`           |

Notes:

- `noSemicolons` gives one match per `;`. `text` is the `;`, `context` the sentence around it.
- The two word limits give one match per long unit. `text` is the words past the limit, so `index` points at the first extra word.
- `maxParagraphs` gives one match per paragraph past the limit. `text` is that paragraph.
- `maxWordsLastParagraph` reads the last paragraph. `text` is that paragraph. Intended use: a response ends with the next step, in one short line. The rule checks the length, not the meaning.

## Word List Rules

A phrase is in the list or not. These rules have no false hits, but a list can miss a phrase.

| Function                   | Inputs   | Options                 | Additional Result Keys                                                       |
|----------------------------|----------|-------------------------|------------------------------------------------------------------------------|
| `approvedModals`           | sentence |                         | `modal: string`, `alternatives: string[]`                                    |
| `noPhrasalVerbs`           | sentence |                         | `alternatives: string[]`                                                     |
| `noUnnamedAuthority`       | sentence |                         | `phrase: string`                                                             |
| `noAmbiguousAbbreviations` | sentence | `allow?: string[] = []` | `full: string \| null`                                                       |
| `noNeedlessWords`          | sentence |                         | `phrase: string`, `kind: 'slop' \| 'restatement' \| 'marketing' \| 'filler'` |
| `oneHedge`                 | sentence | `limit?: number = 1`    | `count: number`, `limit: number`, `hedges: string[]`                         |

Messages:

| Rule                       | Message                                                                      |
|----------------------------|------------------------------------------------------------------------------|
| `approvedModals`           | `Use only can, will, or must. Replace "${modal}" with "${alternatives[0]}".` |
| `noPhrasalVerbs`           | `Use one plain verb. Replace "${text}" with "${alternatives}".`              |
| `noUnnamedAuthority`       | `Name the source, or cut the claim. "${text}" names no one.`                 |
| `noAmbiguousAbbreviations` | `Write the full term: "${full}", not "${text}".`                             |
|                            | `Write the full term, not "${text}".`                                        |
| `noNeedlessWords`          | `Cut "${phrase}". It adds nothing.`                                          |
| `oneHedge`                 | `Keep one hedge. This sentence has ${count}: ${hedges}.`                     |

`noAmbiguousAbbreviations` uses its second message when `full` is null. In `noPhrasalVerbs`, the alternatives are joined by `" or "`. In `oneHedge`, each hedge is quoted, and they are joined by `, `.

The lists:

| Rule                       | List                                                                  |
|----------------------------|-----------------------------------------------------------------------|
| `approvedModals`           | 7 modals: may, might, should, could, would, shall, ought              |
| `noPhrasalVerbs`           | 87 phrases, each with one or more shorter forms                       |
| `noUnnamedAuthority`       | 38 phrases, such as "experts say"                                     |
| `noAmbiguousAbbreviations` | 68 allowed, such as HTML, URL, MB. 14 ambiguous with their full term  |
| `noNeedlessWords`          | 29 slop, 8 restatement, 24 marketing, 6 filler                        |
| `oneHedge`                 | 13 hedge words, such as "possibly", "perhaps"                         |

Notes:

- `noAmbiguousAbbreviations` flags a word of two to five capitals or digits that starts with a capital, and is not in the allowed list. A sentence in which every word is upper case is skipped. `allow` adds your own, exact case.
- `oneHedge` gives one match per sentence over the limit. `text` is the span from the first extra hedge to the last.

## Heuristic Rules

These rules read word patterns, not grammar. Each one has a known limit. Treat a match as a hint.

| Function                | Inputs   | Additional Result Keys                               |
|-------------------------|----------|------------------------------------------------------|
| `noIngVerbs`            | sentence | `be: string`, `verb: string`                         |
| `activeVoice`           | sentence | `be: string`, `participle: string`, `agent: boolean` |
| `passiveWithNamedAgent` | sentence | `be: string`, `participle: string`                   |
| `actionAsVerb`          | sentence | `verb: string`, `noun: string`                       |
| `noStackedAuxiliaries`  | sentence | `auxiliaries: string[]`                              |
| `clearPronouns`         | sentence | `pronoun: string`, `verb: string`                    |
| `noPreamble`            | text     | `phrase: string`, `place: 'start' \| 'end'`          |
| `oneInstruction`        | sentence | `joiner: string`                                     |

Messages:

| Rule                    | Message                                                                 |
|-------------------------|-------------------------------------------------------------------------|
| `noIngVerbs`            | `Use the simple form, not "${text}".`                                   |
| `activeVoice`           | `Use the active voice. Name who does the action, not "${text}".`        |
| `passiveWithNamedAgent` | `The agent is named, so use the active voice: not "${text} by".`        |
| `actionAsVerb`          | `Use the verb behind "${noun}", not "${text}".`                         |
| `noStackedAuxiliaries`  | `Use one auxiliary, not "${auxiliaries}".`                              |
| `clearPronouns`         | `Say what "${pronoun}" refers to: "${pronoun} <noun> ${verb}".`         |
| `noPreamble`            | `Cut the preamble. Start with the answer, not "${phrase}".`             |
|                         | `Cut the closing remark. Stop when the content stops, not "${phrase}".` |
| `oneInstruction`        | `Write one instruction per sentence. Split at "${joiner}".`             |

`noPreamble` uses its first message at `place: 'start'` and its second at `place: 'end'`. In `noStackedAuxiliaries`, the auxiliaries are joined by a space.

What each one reads:

| Rule                    | Pattern                                                                   |
|-------------------------|---------------------------------------------------------------------------|
| `noIngVerbs`            | a be-verb, then an -ing word not in the noun list                         |
| `activeVoice`           | a be-verb, an optional -ly adverb, then a past participle                 |
| `passiveWithNamedAgent` | the `activeVoice` pattern, then "by"                                      |
| `actionAsVerb`          | a weak verb, then within two words a -tion, -ment, -ance, or -ence noun   |
| `noStackedAuxiliaries`  | two or more auxiliaries in a row, except `will be`, `can be`, `must be`   |
| `clearPronouns`         | it, this, these, those, or they at the start, then a verb                 |
| `noPreamble`            | the first paragraph starts with one of 16 openers, the last with a closer |
| `oneInstruction`        | "and then", or ", then" in a sentence with no condition word at its start |

Limits:

- `noIngVerbs`: an -ing verb with no be-verb before it passes.
- `activeVoice` and `passiveWithNamedAgent`: "is closed" the adjective reads as passive.
- `actionAsVerb`: a concrete noun list covers the common false hits.
- `clearPronouns`: a bare pronoun mid-sentence passes.
- `noPreamble`: a phrase outside the two lists of 16 passes.
- `oneInstruction`: a sentence joined by another word passes.

Notes:

- `activeVoice` flags every passive. `agent` is true when "by" follows. `passiveWithNamedAgent` flags only that case, for callers who allow the passive with no agent.
- `noPreamble` gives at most two matches, one per place. A one-paragraph text is checked against the openers only.

## Opt-in Rule

| Function        | Inputs | Options                                                         |
|-----------------|--------|-----------------------------------------------------------------|
| `approvedWords` | word   | `approved?: Iterable<string>`, `technicalNames?: string[] = []` |

| Rule            | Message                                                                                    |
|-----------------|--------------------------------------------------------------------------------------------|
| `approvedWords` | `"${text}" is not an approved word. Use a dictionary word, or add it as a technical name.` |

The pass rules, in order:

1. No `approved` list: the rule is off. It returns an empty array.
2. The word is in `approved` or in `technicalNames`, case folded: pass.
3. The word starts with a digit: pass. `3.5`, `3rd`.
4. The word is one character long: pass. `x`, `a`.
5. Anything else is a match. `text` is the word, `context` the sentence around it.

`approved` takes any iterable of strings: an array or a Set. The library ships no list. See the README, Approved Words.

## Text Helpers

The six functions the rules are built on. All are exported.

| Function                  | Returns                               |
|---------------------------|---------------------------------------|
| `sentences(text)`         | `{ text, index, length }[]`           |
| `sentenceAt(text, index)` | `string`, the sentence around `index` |
| `paragraphs(text)`        | `{ text, index, length }[]`           |
| `words(text)`             | `{ text, index }[]`                   |
| `wordCount(text)`         | `number`                              |
| `phrases(text, entries)`  | `{ index, length, text, entry }[]`    |

In every result, `index` and `length` point into the input string, and `text` is the exact slice.

A sentence ends at `.`, `!`, or `?`, then any closing quote or bracket, then whitespace or the end. A blank line ends a sentence too. A period inside `e.g.`, `i.e.`, `etc.`, `vs.`, `Fig.`, `No.` does not end one, unless a capital word follows. A period after a title, `Dr.`, `Mr.`, `Mrs.`, `Ms.`, `Prof.`, does not end one. A period inside a dotted run, `U.S.A.`, `a.m.`, `Node.js`, does not end one. A number and a period at a line start, `1.`, is a list marker. A period after one capital letter ends the sentence: `Choose option B.` A period between digits is a decimal.

A paragraph is a run of non-blank lines between blank lines. Its `text` is trimmed.

A word is a run of non-whitespace characters, whole: `don't`, `e-mail`, `ASD-STE100`, `1,000`, `$5.00`, `snake_case`, `C++`, and a URL are each one word. Nothing inside a run is cut, and the punctuation on its ends stays: `stop.` is the word. A run with no letter and no digit, such as `-`, `...`, or an emoji, is not a word.

A rule that looks a word up compares its key: the run with punctuation trimmed from both ends, case folded. `Stop.` has the key `stop`. A match points at that trimmed span, so `text` is `stop`, not `stop.`.

`phrases` finds the entries of a word or phrase list. The match is case folded and on whole words. A phrase is its words in order, with only whitespace between them. At one position the longest entry wins, and matches never overlap. `entry` is the list entry as given.
