// 练功房 warmup 的课程内容：每关的讲解、任务、分层提示，以及按失败原因（测试里 fail() 的 code）给出的定向提示。
// 文件名 = 练功房 id = course/dojos/<id>/ 目录名。英文版写在 <id>.en.js 里，按关卡号覆盖。
window.COURSE = {
  id: 'warmup',
  title: 'TypeScript 热身',
  subtitle: '词频统计 · 2 关',
  mode: 'text/typescript',
  fileOrder: ['words.ts'],
  finalNote: '热身完成！可以开始正式的练功房了。',
  levels: [
    {
      n: 1, short: '数词', title: '数每个词出现几次', file: 'words.ts',
      concept: `<p>这一关熟悉练功房怎么用：在编辑器里写代码，点「运行测试」，失败时看测试说了什么、提示怎么讲。</p>
        <p>「词」是连续的字母或数字；大小写不同算同一个词，标点不算词的一部分。</p>`,
      task: ['实现 <code>wordCount(text)</code>：返回每个词（小写）出现的次数。'],
      tests: {Lv1_Basic: '基本计数', Lv1_Case: '不分大小写', Lv1_Punctuation: '去掉标点', Lv1_Empty: '空文本'},
      tiers: ["先把整段文字转成小写，再按「不是字母或数字的字符」切开。", "text.toLowerCase().split(/[^a-z0-9]+/) 会切出一些空字符串，跳过它们。", "const counts: Record<string, number> = {}; for (const w of text.toLowerCase().split(/[^a-z0-9]+/)) if (w) counts[w] = (counts[w] ?? 0) + 1; return counts;"],
      byCode: {
        wrong_count: '有的词次数不对。先在一小段文字上手算一遍，再对照你的代码。',
        case: '"The" 和 "the" 被当成了两个词。先把整段文字转成小写。',
        punctuation: '有的词里带着标点，比如 "world!"。按「不是字母或数字的字符」切开，而不是只按空格切。',
        empty: '空文本或只有空格时，结果里出现了空字符串 ""。切开后跳过空的片段。',
      },
    },
    {
      n: 2, short: '前 k 名', title: '出现最多的前 k 个词', file: 'words.ts',
      concept: `<p>排序要有确定的结果：次数相同的词，按字母顺序排，这样每次运行的输出都一样，测试才能比较。</p>`,
      task: ['实现 <code>topK(counts, k)</code>：返回出现次数最多的 k 个词及其次数，按次数从大到小；次数相同按字母顺序；词不够 k 个就全部返回。'],
      tests: {Lv2_Order: '按次数从大到小', Lv2_Ties: '次数相同按字母顺序', Lv2_K: '只取前 k 个'},
      tiers: ["先把 counts 变成 [word, count] 的数组，再排序，最后只取前 k 个。", "排序的比较函数：次数不同按次数从大到小；次数相同按单词字母顺序。", "return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, k);"],
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
