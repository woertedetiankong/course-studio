// 热身：词频统计
// Warm-up: word frequencies
use std::collections::HashMap;

// 第 1 关：返回每个词（小写）出现的次数。词 = 连续的字母或数字。
// Level 1: return how many times each word (lower-cased) appears. A word is a run of letters or digits.
pub fn word_count(text: &str) -> HashMap<String, usize> {
    // TODO: 第 1 关 / level 1
    let _ = text;
    HashMap::new()
}

// 第 2 关：出现最多的前 k 个词，按次数从大到小；次数相同按字母顺序。
// Level 2: the k most frequent words, most frequent first; equal counts in alphabetical order.
pub fn top_k(counts: &HashMap<String, usize>, k: usize) -> Vec<(String, usize)> {
    // TODO: 第 2 关 / level 2
    let _ = (counts, k);
    Vec::new()
}
