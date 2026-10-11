// 热身：词频统计
// Warm-up: word frequencies

// 第 1 关：返回每个词（小写）出现的次数。词 = 连续的字母或数字。
// Level 1: return how many times each word (lower-cased) appears. A word is a run of letters or digits.
export function wordCount(text: string): Record<string, number> {
	const counts: Record<string, number> = {};
	for (const w of text.toLowerCase().split(/[^a-z0-9]+/)) if (w) counts[w] = (counts[w] ?? 0) + 1;
	return counts;
}

// 第 2 关：出现最多的前 k 个词，按次数从大到小；次数相同按字母顺序。
// Level 2: the k most frequent words, most frequent first; equal counts in alphabetical order.
export function topK(counts: Record<string, number>, k: number): [string, number][] {
	return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, k);
}
