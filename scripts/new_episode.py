#!/usr/bin/env python3
"""Create one episode's build folder (video kit + lab page) from the template.

    python3 new_episode.py --dest <course-root>/episodes/ep02-rpc --n 2 --title "RPC 与线程" \
        --course-title "分布式系统练功房" [--title-en "RPC and threads" --course-title-en "Distributed Systems Dojo"] [--timeout 10]

The folder holds: script.json + scenes.js (write these), head.html/tail.html (engine, rarely touched),
tts.py (Gemini TTS; or silent_timeline.py for a no-voice preview) → build.py → record.mjs (narrate, stitch, render video.mp4), lab.html (interactive lab page).
Refuses to overwrite an existing folder.
"""
import argparse, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(os.path.dirname(HERE), "template", "episode")


def fill(path, subs):
    s = open(path, encoding="utf-8").read()
    for k, v in subs.items():
        s = s.replace(k, v)
    open(path, "w", encoding="utf-8").write(s)


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--dest", required=True)
    ap.add_argument("--n", type=int, required=True)
    ap.add_argument("--title", required=True)
    ap.add_argument("--course-title", required=True)
    ap.add_argument("--title-en", help="English episode title for the lab page (default: --title)")
    ap.add_argument("--course-title-en", help="English course title (default: --course-title)")
    ap.add_argument("--timeout", default="10", help="seconds before the lab's coordinator reassigns a task")
    a = ap.parse_args(argv)
    if os.path.exists(a.dest):
        sys.exit(f"{a.dest} already exists; not overwriting")
    shutil.copytree(SRC, a.dest)
    subs = {"__EP_TITLE_EN__": a.title_en or a.title, "__COURSE_TITLE_EN__": a.course_title_en or a.course_title,
            "__EP_TITLE__": a.title, "__EP_NN__": f"{a.n:02d}", "__EP_N__": str(a.n),
            "__COURSE_TITLE__": a.course_title, "__TIMEOUT__": str(a.timeout)}
    for f in os.listdir(a.dest):
        if f.endswith((".html", ".js", ".json", ".py", ".mjs")):
            fill(os.path.join(a.dest, f), subs)
    print(f"created {a.dest}")
    print(f"  next: cd {a.dest} && npm install   # playwright-core for record.mjs")
    print(f"  add to course.js EPISODES: {{id: 'ep{a.n:02d}', n: {a.n}, title: '{a.title}', ...}}")
    print(f"  and its English to course.en.js: ep{a.n:02d}: {{title: '{a.title_en or a.title}', ...}}")


if __name__ == "__main__":
    main()
