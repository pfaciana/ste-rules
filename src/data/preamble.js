// Openers and closers that add nothing to an answer. From the rule text; no reference repo checks it.

/** a first paragraph that starts with one of these is preamble */
export const openers = ['sure', 'certainly', 'of course', 'absolutely', 'great question', 'good question', 'happy to help', "i'd be happy", 'i would be happy', "here's", 'here is', 'let me', "let's dive", 'as an ai', 'thanks for', 'thank you for']

/** a last paragraph that starts with one of these is a closing remark */
export const closers = ['in summary', 'to summarize', 'in conclusion', 'to conclude', 'overall', 'let me know', 'feel free', 'hope this helps', 'i hope', 'if you have any', 'happy to', "don't hesitate", 'do not hesitate', "that's it", 'in short', 'to sum up']
