#!/usr/bin/env python3
"""Scaffold a whole course in the video → reading → lab → assignment format.

    python3 new_course.py --root ~/courses/os --title "操作系统从零读懂" --subtitle "MIT 6.1810 自学路线" \
        --title-en "Operating Systems, Read Closely" --subtitle-en "A self-study path through MIT 6.1810" \
        --ep1 "Unix 系统调用" --ep1-en "Unix system calls" [--port 7878]

Episode 1 starts as video → reading → lab → assignment; change its steps in course.js (flowchart page,
project atlas, or video + 课件 only in a video-first course).
The site is bilingual (中 / EN switch): the *-en options fill the English text; they default to the Chinese.

Creates:
  <root>/.env.example          per-course overrides (key normally in ~/.config/course-studio/.env)
  <root>/.gitignore
  <root>/site/                 the course site (Node static server; this is the repo you publish)
  <root>/episodes/ep01-<slug>/ the first episode's build folder (video kit + lab page)
Then: cd <root>/site && npm start     (opens the course home)
"""
import argparse, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
TPL = os.path.join(os.path.dirname(HERE), "template")
sys.path.insert(0, HERE)
import new_episode


def slugify(s):
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s or "intro"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", required=True)
    ap.add_argument("--title", required=True, help="course name shown in the header, e.g. 分布式系统从零读懂")
    ap.add_argument("--subtitle", default="", help="e.g. MIT 6.5840 自学路线")
    ap.add_argument("--title-en", help="English course name, e.g. Distributed Systems, Read Closely")
    ap.add_argument("--subtitle-en", help="e.g. A self-study path through MIT 6.5840")
    ap.add_argument("--ep1", required=True, help="title of episode 1")
    ap.add_argument("--ep1-en", help="English title of episode 1")
    ap.add_argument("--slug", help="folder slug for episode 1 (default: from --ep1)")
    ap.add_argument("--port", default="7878")
    a = ap.parse_args()
    root = os.path.abspath(os.path.expanduser(a.root))
    site = os.path.join(root, "site")
    if os.path.exists(site):
        sys.exit(f"{site} already exists; not overwriting")
    os.makedirs(root, exist_ok=True)
    shutil.copytree(os.path.join(TPL, "site"), site)
    subs = {"__COURSE_TITLE_EN__": a.title_en or a.title, "__COURSE_SUBTITLE_EN__": a.subtitle_en or a.subtitle,
            "__EP01_TITLE_EN__": a.ep1_en or a.ep1,
            "__COURSE_TITLE__": a.title, "__COURSE_SUBTITLE__": a.subtitle,
            "__PORT__": a.port, "__EP01_TITLE__": a.ep1}
    for d, _, files in os.walk(site):
        for f in files:
            if f.endswith((".ts", ".html", ".js", ".css", ".py", ".json", ".md")):
                new_episode.fill(os.path.join(d, f), subs)
    if not os.path.exists(os.path.join(root, ".env.example")):
        open(os.path.join(root, ".env.example"), "w").write("# GEMINI_API_KEY is read from ~/.config/course-studio/.env; set it here only to override for this course\n# GEMINI_API_KEY=\n# GEMINI_VOICE=Sulafat\n")
    if not os.path.exists(os.path.join(root, ".gitignore")):
        open(os.path.join(root, ".gitignore"), "w").write(".env\n.DS_Store\nnode_modules/\nepisodes/*/audio/\nepisodes/*/*.wav\nepisodes/*/*.mp3\nepisodes/*/video.mp4\nsite/content/*/video.mp4\nepisodes/*/frames/\n# 课件 is kept once, in site/content/ (sync_content.py copies it there)\nepisodes/*/slides/\nepisodes/*/slides.html\nepisodes/*/slides.pdf\nepisodes/*/slides.json\n__pycache__/\n")
    slug = a.slug or slugify(a.ep1)
    dest = os.path.join(root, "episodes", f"ep01-{slug}")
    if os.path.exists(dest):
        print(f"{dest} already exists; keeping it")
    else:
      new_episode.main(["--dest", os.path.join(root, "episodes", f"ep01-{slug}"), "--n", "1", "--title", a.ep1, "--course-title", a.title,
                      "--title-en", a.ep1_en or a.ep1, "--course-title-en", a.title_en or a.title])
    print(f"\ncourse ready at {root}\n  cd {site} && npm start")


if __name__ == "__main__":
    main()
