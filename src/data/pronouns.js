// Pronouns that need a clear referent.
// Source: asd-ste100-checker ste100/rules/semantic.py, Apache-2.0, 5 entries. The verbs that mark a bare use are ours.

export const pronouns = ['it', 'this', 'these', 'those', 'they']

/** a pronoun directly before one of these is bare: "This means", "It is" */
export const bareVerbs = ['fail', 'work', 'break', 'mean', 'happen', 'need', 'seem', 'look', 'take', 'keep', 'do', 'make', 'show', 'give', 'let', 'allow', 'help', 'is', 'was', 'are', 'were', 'means', 'meant', 'will', 'can', 'must', 'has', 'have', 'had', 'does', 'did', 'makes', 'made', 'shows', 'showed', 'gives', 'gave', 'lets', 'allows', 'helps', 'works', 'worked', 'fails', 'failed', 'breaks', 'broke', 'happens', 'happened', 'needs', 'seems', 'looks', 'takes', 'keeps']
