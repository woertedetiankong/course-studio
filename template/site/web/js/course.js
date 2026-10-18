// 课程数据：课程首页（hub.js）和练功房（app.js）都读这里。加一集 = 在 EPISODES 里加一项。
//
// status: ready = 材料齐了；partial = 只有部分材料（比如只有视频）；planned = 还没做，只在课程地图里占位
// part:   拆成几篇的一集（ep11a…ep11d）：n 相同，part 写 'a' 'b'…，显示成“第 11a 集”；map 写 page: 第一篇的 id，共用地图进度
// steps:  按顺序列出这一集有的步骤，可选 video / reading / lab / flow / map / dojo / assignment
//   video       需要 content/<id>/video.mp4 和 chapters.json（dev/sync_content.py 生成）
//   reading     {title, url?, urlLabel?, urlNote?, notes?, notesLabel?, links?: [{label, url, note?}], time?, read: [...], ask: [...]}
//   lab         {questions: 预测题个数, desc, time?, page?} → content/<page 或 id>/lab.html（page：几集共用一页时写那一集的 id）；实验台把答过的题号存进 localStorage 'course.<id>.lab.answered'
//   flow        {questions: 想一想题数, desc, time?} → content/<id>/flow.html；流程图页把答过的题号存进 'course.<id>.flow.answered'
//               （给看不懂代码的学员：用可点击的流程图讲结构，可以代替练功房）
//   map         {questions: 本集地图题数, desc, time?} → atlas.html#<id>（项目地图，整门课一张，见 references/atlas.md）；答对的题号存进 'course.<id>.map.answered'
//   dojo        练功房 id（= course/dojos/<dojo> 目录名），过关记录在 'dojo.<dojo>.passed'；dojoTime、dojoDesc、dojoLinks: [{label, url}]
//   assignment  {title, url, urlLabel?, short?（如 'Lab 1'）, desc?, notes: [...], time?} 真正的课程作业 / Lab
//
// 双语：这里写中文；英文写在 course.en.js 里，按 id 覆盖同名字段，没写英文的字段沿用中文。
// 加一集或改了这里的文字，都要同步改 course.en.js。
window.COURSE_META = {
  title: '__COURSE_TITLE__',
  subtitle: '__COURSE_SUBTITLE__',
  mapNote: '按原课程的课表顺序排列，一集讲清一个核心机制。',
  footer: '论文和作业链接指向原课程官网。这里的视频、实验台和练功房是自学用的辅助材料，题目和测试均为原创。',
  atlas: false,   // true = 课程有项目地图（web/atlas.html + js/atlas.data.js），首页顶部显示入口
  // source: {dir: '<checkout>'},   // 课程精读的源码仓库在本仓库里的目录（固定在某个提交）；外部网站据此把代码索引链到 GitHub。没有源码仓库就不写
};

window.EPISODES = [
  {id: 'ep01', n: 1, title: '__EP01_TITLE__', group: '基础', status: 'ready',
   desc: '一两句话说清这一集要解决的问题，以及最该带走的那个直觉。',
   steps: ['video', 'reading', 'lab', 'dojo', 'assignment'],
   videoTime: '约 6 分钟',
   reading: {title: '论文或教材章节的全名', url: 'https://example.org/paper.pdf', notes: '', time: '2 到 4 小时',
     read: ['第 1、2 节：快速读', '第 3 节：重点读'],
     ask: ['读完应该能回答的问题 1', '读完应该能回答的问题 2']},
   lab: {questions: 6, time: '约 1 小时', desc: '先做预测题：每题先自己选答案，再在模拟器里运行同样的场景验证。然后自己动手制造故障。'},
   dojo: 'warmup', dojoTime: '1 到 2 小时',
   dojoDesc: '__DOJO_DESC__',
   assignment: {title: '做真正的作业', url: 'https://example.org/lab1.html', time: '5 到 15 小时',
     notes: ['和练功房思路相同，需要改的是接口：……']}},
  {id: 'ep02', n: 2, title: '下一集的标题', group: '基础', status: 'planned'},
];
