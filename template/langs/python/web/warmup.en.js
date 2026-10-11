// English text for the warmup dojo (warmup.js). Levels are matched by n; fields not written here keep the Chinese.
enOverlay(window.COURSE, {
  title: 'Python warm-up',
  subtitle: 'Word frequencies · 2 levels',
  finalNote: 'Warm-up done! You are ready for the real dojo.',
  levels: {
    1: {
      short: 'Count words', title: 'Count how often each word appears',
      concept: `<p>This level is about learning the dojo: write code in the editor, press Run tests, and when a test fails, read what it says and what the hint suggests.</p>
        <p>A word is a run of letters or digits; different case counts as the same word, and punctuation is not part of a word.</p>`,
      task: ['Implement <code>word_count(text)</code>: return how many times each word (lower-cased) appears.'],
      tests: {test_lv1_basic: 'Basic counting', test_lv1_case: 'Ignores case', test_lv1_punctuation: 'Strips punctuation', test_lv1_empty: 'Empty text'},
      tiers: ["Lower-case the whole text first, then find every run of letters or digits with a regex.", "re.findall(r\"[a-z0-9]+\", text.lower()) gives every word; collections.Counter can count them.", "return dict(Counter(re.findall(r\"[a-z0-9]+\", text.lower())))"],
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
      tests: {test_lv2_order: 'Most frequent first', test_lv2_ties: 'Ties in alphabetical order', test_lv2_k: 'Only the first k'},
      tiers: ["Sort counts.items(), then keep the first k.", "The sort key can be (-count, word): larger counts first, equal counts alphabetical.", "return sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))[:k]"],
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
