// 练功房 warmup 的课程内容：每关的讲解、任务、分层提示，以及按失败原因（测试里 fail() 的 code）给出的定向提示。
// 文件名 = 练功房 id = course/dojos/<id>/ 目录名。英文版写在 <id>.en.js 里，按关卡号覆盖。
window.COURSE = {
  id: 'warmup',
  title: 'Rust 热身',
  subtitle: '词频统计 · 2 关',
  mode: 'text/x-rustsrc',
  fileOrder: ['lib.rs'],
  finalNote: '热身完成！可以开始正式的练功房了。',
  levels: [
    {
      n: 1, short: '数词', title: '数每个词出现几次', file: 'lib.rs',
      concept: `<p>这一关熟悉练功房怎么用：在编辑器里写代码，点「运行测试」，失败时看测试说了什么、提示怎么讲。</p>
        <p>「词」是连续的字母或数字；大小写不同算同一个词，标点不算词的一部分。</p>`,
      task: ['实现 <code>word_count(text)</code>：返回每个词（小写）出现的次数。'],
      tests: {lv1_basic: '基本计数', lv1_case: '不分大小写', lv1_punctuation: '去掉标点', lv1_empty: '空文本'},
      tiers: ["先 to_lowercase()，再按「不是字母或数字的字符」切开。", "text.to_lowercase().split(|c: char| !c.is_ascii_alphanumeric()) 会切出空字符串，跳过它们；用 *counts.entry(w.to_string()).or_insert(0) += 1 计数。", "let mut counts = HashMap::new(); for w in text.to_lowercase().split(|c: char| !c.is_ascii_alphanumeric()) { if !w.is_empty() { *counts.entry(w.to_string()).or_insert(0) += 1; } } counts"],
      byCode: {
        wrong_count: '有的词次数不对。先在一小段文字上手算一遍，再对照你的代码。',
        case: '"The" 和 "the" 被当成了两个词。先把整段文字转成小写。',
        punctuation: '有的词里带着标点，比如 "world!"。按「不是字母或数字的字符」切开，而不是只按空格切。',
        empty: '空文本或只有空格时，结果里出现了空字符串 ""。切开后跳过空的片段。',
      },
    },
    {
      n: 2, short: '前 k 名', title: '出现最多的前 k 个词', file: 'lib.rs',
      concept: `<p>排序要有确定的结果：次数相同的词，按字母顺序排，这样每次运行的输出都一样，测试才能比较。</p>`,
      task: ['实现 <code>top_k(counts, k)</code>：返回出现次数最多的 k 个词及其次数，按次数从大到小；次数相同按字母顺序；词不够 k 个就全部返回。'],
      tests: {lv2_order: '按次数从大到小', lv2_ties: '次数相同按字母顺序', lv2_k: '只取前 k 个'},
      tiers: ["把 counts 变成 Vec<(String, usize)>，排序，再 truncate(k)。", "排序：v.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0)))，次数大的在前，次数相同按字母顺序。", "let mut v: Vec<(String, usize)> = counts.iter().map(|(w, c)| (w.clone(), *c)).collect(); v.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0))); v.truncate(k); v"],
      byCode: {
        wrong_order: '顺序不对：次数大的要排在前面。',
        tie_order: '次数相同的词没有按字母顺序排。比较时，次数相同再比较单词本身。',
        too_many: '返回的个数超过了 k。排好序后只取前 k 个。',
        too_few: 'k 比词的总数大时，要返回全部的词，一个也不能少。',
      },
    },
  ],
  // 所有关卡共用的失败原因说明（运行器自己识别的 code）
  common: {
    build: '代码没能编译或导入，先修好标出来的错误。',
    fail: '测试失败了，看看下面的输出。',
    crash: '测试没能运行，看看下面的输出。',
    timeout: '测试超时：可能有死循环。',
  },
};
