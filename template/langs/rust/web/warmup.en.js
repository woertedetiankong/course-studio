// English text for the warmup dojo (warmup.js). Levels are matched by n; fields not written here keep the Chinese.
enOverlay(window.COURSE, {
  title: 'Rust warm-up',
  subtitle: 'Word frequencies · 2 levels',
  finalNote: 'Warm-up done! You are ready for the real dojo.',
  levels: {
    1: {
      short: 'Count words', title: 'Count how often each word appears',
      concept: `<p>This level is about learning the dojo: write code in the editor, press Run tests, and when a test fails, read what it says and what the hint suggests.</p>
        <p>A word is a run of letters or digits; different case counts as the same word, and punctuation is not part of a word.</p>`,
      task: ['Implement <code>word_count(text)</code>: return how many times each word (lower-cased) appears.'],
      tests: {lv1_basic: 'Basic counting', lv1_case: 'Ignores case', lv1_punctuation: 'Strips punctuation', lv1_empty: 'Empty text'},
      tiers: ["Call to_lowercase(), then split on anything that is not a letter or digit.", "text.to_lowercase().split(|c: char| !c.is_ascii_alphanumeric()) leaves empty strings; skip them. Count with *counts.entry(w.to_string()).or_insert(0) += 1.", "let mut counts = HashMap::new(); for w in text.to_lowercase().split(|c: char| !c.is_ascii_alphanumeric()) { if !w.is_empty() { *counts.entry(w.to_string()).or_insert(0) += 1; } } counts"],
      byCode: {
        wrong_count: 'Some counts are off. Work out a short sentence by hand and compare with your code.',
        case: '"The" and "the" were counted as two words. Lower-case the whole text first.',
        punctuation: 'Some words still carry punctuation, like "world!". Split on anything that is not a letter or digit, not just on spaces.',
        empty: 'For empty or blank text the result contains the empty string "". Skip empty pieces after splitting.',
      },
    },
    2: {
      short: 'Top k', title: 'The k most frequent words',
      concept: `<p>Sorting needs a definite result: words with the same count go in alphabetical order, so every run gives the same output and the tests can compare it.</p>`,
      task: ['Implement <code>top_k(counts, k)</code>: return the k most frequent words with their counts, most frequent first; equal counts in alphabetical order; if there are fewer than k words, return them all.'],
      tests: {lv2_order: 'Most frequent first', lv2_ties: 'Ties in alphabetical order', lv2_k: 'Only the first k'},
      tiers: ["Turn counts into a Vec<(String, usize)>, sort it, then truncate(k).", "Sort with v.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0))): larger counts first, equal counts alphabetical.", "let mut v: Vec<(String, usize)> = counts.iter().map(|(w, c)| (w.clone(), *c)).collect(); v.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0))); v.truncate(k); v"],
      byCode: {
        wrong_order: 'Wrong order: larger counts go first.',
        tie_order: 'Words with the same count are not in alphabetical order. When counts are equal, compare the words.',
        too_many: 'More than k results. Keep only the first k after sorting.',
        too_few: 'When k is larger than the number of words, return every word; none may be missing.',
      },
    },
  },
  common: {
    build: 'Your code did not compile or import; fix the marked errors first.',
    fail: 'A test failed; read the output below.',
    crash: 'The tests could not run; read the output below.',
    timeout: 'The test timed out: maybe an endless loop.',
  },
});
