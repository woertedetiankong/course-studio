#!/usr/bin/env python3
"""Create one episode's build folder (video kit + lab page) from the template.

    python3 new_episode.py --dest <course-root>/episodes/ep02-rpc --n 2 --title "RPC 与线程" \
        --course-title "分布式系统从零读懂" [--title-en "RPC and threads" --course-title-en "Distributed Systems, Read Closely"] [--timeout 10] \
        [--video-only]

--video-only (video-first courses: video + 课件, no lab or flowchart) leaves out lab.html, lab_data.py and flow.html.

The folder holds: script.json + scenes.js (write these), head.html/tail.html (engine, rarely touched),
tts.py (Gemini TTS; or silent_timeline.py for a no-voice preview) → build.py → record.mjs (narrate, stitch, render video.mp4)
→ slides.mjs (课件: screenshots + narration → slides.html/.pdf), lab.html (interactive lab page).
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
    ap.add_argument("--part", default="", help="part letter of a split episode (a, b, …): the id becomes epNNa, as in course.js")
    ap.add_argument("--video-only", action="store_true", help="video-first course: no lab.html, lab_data.py or flow.html")
    a = ap.parse_args(argv)
    if os.path.exists(a.dest):
        sys.exit(f"{a.dest} already exists; not overwriting")
    skip = {"lab.html", "lab_data.py", "flow.html"} if a.video_only else set()
    shutil.copytree(SRC, a.dest, ignore=lambda d, names: [n for n in names if n in skip or n == "__pycache__"])
    subs = {"__EP_TITLE_EN__": a.title_en or a.title, "__COURSE_TITLE_EN__": a.course_title_en or a.course_title,
            "__EP_TITLE__": a.title, "__EP_ID__": f"ep{a.n:02d}{a.part}", "__EP_NN__": f"{a.n:02d}{a.part}", "__EP_N__": str(a.n),
            "__COURSE_TITLE__": a.course_title, "__TIMEOUT__": str(a.timeout)}
    for f in os.listdir(a.dest):
        if f.endswith((".html", ".js", ".json", ".py", ".mjs")):
            fill(os.path.join(a.dest, f), subs)
    print(f"created {a.dest}")
    print(f"  next: cd {a.dest} && npm install   # playwright-core for record.mjs")
    print("  video: fact-check script.json against the source, node frames.mjs to check frames, then node record.mjs")
    print("  slides (课件): after record.mjs, node slides.mjs → slides.html + slides.pdf; set slides: true in course.js")
    if not a.video_only: print("  lab: pick the engine first (references/lab-page.md): JS simulator in lab.html, or replay real runs via lab_data.py")
    eid = f"ep{a.n:02d}{a.part}"
    print(f"  add to course.js EPISODES: {{id: '{eid}', n: {a.n}, {f"part: '{a.part}', " if a.part else ""}title: '{a.title}', ...}}")
    print(f"  and its English to course.en.js: {eid}: {{title: '{a.title_en or a.title}', ...}}")


if __name__ == "__main__":
    main()
