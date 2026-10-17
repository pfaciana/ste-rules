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
| text      | the paragraph at fault                | the whole input        |

`noSemicolons` is the exception. It reads the whole text, but its `text` is the `;` and its `context` is the sentence around it.

A rule returns one match per fault. A count rule returns one match per unit over the limit. `maxWordsLastParagraph` returns at most one.

## Count Rules

A count is exact. The split into sentences and words is a guess, so a wrong split can give a wrong count. See Text Helpers for the split rules.

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

These rules match a word or phrase from a list. A list can miss a phrase. A listed word in good text, such as a quote or a name, is still flagged.

| Function                   | Inputs   | Options                 | Additional Result Keys                                                       |
|----------------------------|----------|-------------------------|------------------------------------------------------------------------------|
| `approvedModals`           | sentence |                         | `modal: string`, `alternatives: string[]`                                    |
| `noPhrasalVerbs`           | sentence | `allow?: string[] = []` | `alternatives: string[]`                                                     |
| `noWordyPhrases`           | sentence | `allow?: string[] = []` | `alternative: string`                                                        |
| `plainWords`               | sentence | `allow?: string[] = []` | `alternative: string`                                                        |
| `noUnnamedAuthority`       | sentence |                         | `phrase: string`                                                             |
| `noNeedlessWords`          | sentence | `allow?: string[] = []` | `phrase: string`, `kind: 'slop' \| 'restatement' \| 'marketing' \| 'filler'` |
| `oneHedge`                 | sentence | `limit?: number = 1`    | `count: number`, `limit: number`, `hedges: string[]`                         |
| `noPreamble`               | text     |                         | `phrase: string`, `place: 'start' \| 'end'`                                  |

Messages:

| Rule                       | Message                                                                      |
|----------------------------|------------------------------------------------------------------------------|
| `approvedModals`           | `Use only can, will, or must. Replace "${text}" with "${alternatives[0]}".`  |
| `noPhrasalVerbs`           | `Use one plain verb. Replace "${text}" with "${alternatives}".`              |
| `noWordyPhrases`           | `Use fewer words. Replace "${text}" with "${alternative}".`                  |
| `plainWords`               | `Use a plain word. Replace "${text}" with "${alternative}".`                 |
| `noUnnamedAuthority`       | `Name the source, or cut the claim. "${text}" names no one.`                 |
| `noNeedlessWords`          | `Cut "${text}". It adds nothing.`                                            |
| `oneHedge`                 | `Keep one hedge. This sentence has ${count}: ${hedges}.`                     |
| `noPreamble`               | `Cut the preamble. Start with the answer, not "${phrase}".`                  |
|                            | `Cut the closing remark. Stop when the content stops, not "${phrase}".`      |

`${text}` is the span as found, with its case. `modal` and `phrase` are the list entry, in lower case. In `noPhrasalVerbs`, the alternatives are joined by `" or "`. In `oneHedge`, each hedge is quoted, and they are joined by `, `. `noPreamble` uses its first message at `place: 'start'` and its second at `place: 'end'`.

The lists:

| Rule                       | List                                                                  |
|----------------------------|-----------------------------------------------------------------------|
| `approvedModals`           | may, might, should, could, would, shall, ought                        |
| `noPhrasalVerbs`           | phrases, each with one or more shorter forms                          |
| `noWordyPhrases`           | wordy phrases, such as "in order to"                                  |
| `plainWords`               | formal words, such as "utilize"                                       |
| `noUnnamedAuthority`       | phrases, such as "experts say"                                        |
| `noNeedlessWords`          | slop, restatement, marketing, and filler words                        |
| `oneHedge`                 | hedge words, such as "possibly", "perhaps"                            |
| `noPreamble`               | openers, such as "sure", and closers, such as "in summary"            |

Notes:

- `oneHedge` gives one match per sentence over the limit. `text` is the span from the first extra hedge to the last.
- `noPreamble` checks the first paragraph against the openers, and the last paragraph against the closers. It gives at most two matches, one per place. A one-paragraph text is checked against the openers only.
- `approvedModals` skips a capital "May" that is the month: after another word in the sentence, "on May 5", or at the sentence start before a number, "May 5 is the date".
- `allow` drops the listed entries from the rule, case folded. A project keeps its own terms: `noPhrasalVerbs(text, { allow: ['spin up', 'shut down'] })` passes "spin up" and flags the rest.
- Some entries sit in more than one list. `may`, `might`, and `could` are a modal and a hedge, so `approvedModals` and `oneHedge` both flag them. `prior to` is in the lists of `noPhrasalVerbs`, `noWordyPhrases`, and `plainWords`, so all three flag it. A caller that runs several rules can get several matches on one span.

## Heuristic Rules

These rules read word patterns, not grammar. Each one has a known limit. Treat a match as a hint.

| Function                   | Inputs   | Options                 | Additional Result Keys                               |
|----------------------------|----------|-------------------------|------------------------------------------------------|
| `noIngVerbs`               | sentence |                         | `be: string`, `verb: string`                         |
| `activeVoice`              | sentence |                         | `be: string`, `participle: string`, `agent: boolean` |
| `passiveWithNamedAgent`    | sentence |                         | `be: string`, `participle: string`                   |
| `actionAsVerb`             | sentence |                         | `verb: string`, `noun: string`                       |
| `noStackedAuxiliaries`     | sentence |                         | `auxiliaries: string[]`                              |
| `noPerfectTense`           | sentence |                         | `auxiliary: string`, `participle: string`            |
| `clearPronouns`            | sentence |                         | `pronoun: string`, `verb: string`                    |
| `noAmbiguousAbbreviations` | sentence | `allow?: string[] = []` | `full: string \| null`                               |
| `oneInstruction`           | sentence |                         | `joiner: string`                                     |

Messages:

| Rule                       | Message                                                                 |
|----------------------------|-------------------------------------------------------------------------|
| `noIngVerbs`               | `Use the simple form, not "${text}".`                                   |
| `activeVoice`              | `Use the active voice. Name who does the action, not "${text}".`        |
| `passiveWithNamedAgent`    | `The agent is named, so use the active voice: not "${text} by".`        |
| `actionAsVerb`             | `Use the verb behind "${noun}", not "${text}".`                         |
| `noStackedAuxiliaries`     | `Use one auxiliary, not "${auxiliaries}".`                              |
| `noPerfectTense`           | `Use the simple past, not the perfect "${text}".`                       |
| `clearPronouns`            | `Say what "${pronoun}" refers to: "${pronoun} <noun> ${verb}".`         |
| `noAmbiguousAbbreviations` | `Write the full term: "${full}", not "${text}".`                        |
|                            | `Write the full term, not "${text}".`                                   |
| `oneInstruction`           | `Write one instruction per sentence. Split at "${joiner}".`             |

In `noStackedAuxiliaries`, the auxiliaries are joined by a space. `noAmbiguousAbbreviations` uses its second message when `full` is null.

What each one reads:

| Rule                       | Pattern                                                                          |
|----------------------------|----------------------------------------------------------------------------------|
| `noIngVerbs`               | a be-verb, then an -ing word not in the noun list                                |
| `activeVoice`              | a be-verb, an optional -ly adverb, then a past participle                        |
| `passiveWithNamedAgent`    | a passive, then "by", then a capital word, an article, or a pronoun              |
| `actionAsVerb`             | a weak verb, then a -tion, -ment, -ance, or -ence noun in the next three words   |
| `noStackedAuxiliaries`     | two or more auxiliaries in a row, except `will be`, `can be`, `must be`          |
| `noPerfectTense`           | have, has, or had, then a past participle, then a word that shows a verb         |
| `clearPronouns`            | it, this, these, those, or they at the start, then a verb                        |
| `noAmbiguousAbbreviations` | a capital, then 1 to 4 capitals or digits, not in the allowed list               |
| `oneInstruction`           | "and then", or ", then" in a sentence with no condition word at its start        |

Limits:

- `noIngVerbs`: an -ing verb with no be-verb before it passes.
- `activeVoice` and `passiveWithNamedAgent`: "is closed" the adjective reads as passive.
- `actionAsVerb`: a concrete noun list covers the common false hits.
- `clearPronouns`: a bare pronoun mid-sentence passes.
- `noPerfectTense`: a noun right after the past participle passes, as in "We have received approval".
- `noAmbiguousAbbreviations`: a sentence in capitals is skipped whole, so an abbreviation inside it passes.
- `oneInstruction`: a sentence joined by another word passes.

Notes:

- `activeVoice` flags every passive. `agent` is true when "by" and an agent follow. `passiveWithNamedAgent` flags only that case, for callers who allow the passive with no agent. An agent is a capital word, an article, or a pronoun: "by Ann", "by the team", "by us". A time or a means is not an agent: "by noon", "by hand" pass.
- `actionAsVerb`: the noun can be the first, second, or third word after the verb. "Perform a full validation" is flagged. "Perform a very full validation" passes.
- `noPerfectTense` also reads the short forms `I've`, `we've`, `you've`, `they've`, `haven't`, `hasn't`, `hadn't`. One of `not`, `never`, `already`, `just` can sit between the auxiliary and the participle: "have not fixed".
- `noAmbiguousAbbreviations`: `allow` adds your own abbreviations, exact case.

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

A sentence ends at `.`, `!`, or `?`, then any closing quote or bracket, then whitespace or the end. A blank line ends a sentence too. A period inside `e.g.`, `i.e.`, `etc.`, `vs.`, `Fig.`, `No.` does not end one, unless a capital word follows. A period after a title, `Dr.`, `Mr.`, `Mrs.`, `Ms.`, `Prof.`, `Sr.`, `Jr.`, `St.`, does not end one. A period inside a dotted run, `U.S.A.`, `a.m.`, `Node.js`, does not end one. The last period of the run ends one only when a capital word follows. A number and a period at a line start, `1.`, is a list marker. A period after one capital letter ends the sentence: `Choose option B.` A period between digits is a decimal.

A paragraph is a run of non-blank lines between blank lines. Its `text` is trimmed.

A word is a run of non-whitespace characters, whole: `don't`, `e-mail`, `ASD-STE100`, `1,000`, `$5.00`, `snake_case`, `C++`, and a URL are each one word. Nothing inside a run is cut, and the punctuation on its ends stays: `stop.` is the word. A run with no letter and no digit, such as `-`, `...`, or an emoji, is not a word.

A rule that looks a word up compares its key: the run with punctuation trimmed from both ends, case folded. `Stop.` has the key `stop`. A match points at that trimmed span, so `text` is `stop`, not `stop.`.

`phrases` finds the entries of a word or phrase list. The match is case folded and on whole words. A phrase is its words in order, with only whitespace between them. At one position the longest entry wins, and matches never overlap. `entry` is the list entry as given.
