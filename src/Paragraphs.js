// Paragraphs of plain text: runs of non-blank lines between blank lines.

/**
 * @param {string} text
 * @returns {{ text: string, index: number, length: number }[]}  trimmed text, index and length in the input
 */
export function paragraphs(text) {
	text = String(text ?? '')
	const out = []
	let start = -1, end = -1, offset = 0
	for (const line of text.split(/(?<=\n)/)) {         // keep each line's ending, so offsets stay exact
		const blank = !/\S/.test(line)
		if (!blank) {
			const lead = line.length - line.trimStart().length
			if (start < 0) start = offset + lead
			end = offset + line.trimEnd().length
		} else if (start >= 0) {
			out.push({ text: text.slice(start, end), index: start, length: end - start })
			start = -1
		}
		offset += line.length
	}
	if (start >= 0) out.push({ text: text.slice(start, end), index: start, length: end - start })
	return out
}
