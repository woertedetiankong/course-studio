# __COURSE_TITLE__

中文 | [English](README.en.md)

__COURSE_SUBTITLE__。每一集按步骤走：看视频 → 读材料 → 玩实验台 → 做真正的作业（有的集还有流程图或项目地图）。讲解和题目均为原创。

## 开始

1. 安装 Node.js 22.19 或更新的版本：<https://nodejs.org/>。
2. 在这个目录下运行：

   ```bash
   npm start
   ```

3. 打开终端里打印出来的链接（会自动打开浏览器），进入**课程首页**。视频可以按章节跳着看，进度自动记录在浏览器里。网页有中文和英文两种模式，点右上角的「中 / EN」切换，默认跟随浏览器语言。

视频文件较大，没有放进 git 仓库，会发布在 Releases 页面：下载后放到 `content/epNN/video.mp4`。

`npm start` 只在本机（127.0.0.1）提供这些网页，不会运行任何代码。

## 目录

| 路径 | 内容 |
|---|---|
| `server.ts` | 本地网站：提供课程首页、实验台和视频（`npm start`） |
| `web/js/course.js`、`course.en.js` | 课程数据：每一集的步骤和链接（中文、英文） |
| `web/index.html`、`web/js/hub.js` | 课程首页 |
| `content/epNN/` | 各集的视频、章节、课件和实验台（`python3 dev/sync_content.py` 生成） |

## 学术诚信

这个项目帮助你理解原理，不提供原课程作业的答案。如果你正在修这门课，请遵守课程的合作政策，独立完成作业。

## 许可证

MIT
