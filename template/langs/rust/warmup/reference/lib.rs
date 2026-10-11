// 热身：词频统计
// Warm-up: word frequencies
use std::collections::HashMap;

// 第 1 关：返回每个词（小写）出现的次数。词 = 连续的字母或数字。
// Level 1: return how many times each word (lower-cased) appears. A word is a run of letters or digits.
pub fn word_count(text: &str) -> HashMap<String, usize> {
    let mut counts = HashMap::new();
    for w in text.to_lowercase().split(|c: char| !c.is_ascii_alphanumeric()) {
        if !w.is_empty() {
            *counts.entry(w.to_string()).or_insert(0) += 1;
        }
    }
    counts
}

// 第 2 关：出现最多的前 k 个词，按次数从大到小；次数相同按字母顺序。
// Level 2: the k most frequent words, most frequent first; equal counts in alphabetical order.
pub fn top_k(counts: &HashMap<String, usize>, k: usize) -> Vec<(String, usize)> {
    let mut v: Vec<(String, usize)> = counts.iter().map(|(w, c)| (w.clone(), *c)).collect();
    v.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0)));
    v.truncate(k);
    v
}
