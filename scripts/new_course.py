#!/usr/bin/env python3
"""Scaffold a whole course in the video → reading → lab → dojo → assignment format.

    python3 new_course.py --root ~/courses/os --lang go --title "操作系统练功房" --subtitle "MIT 6.1810 自学路线" \
        --title-en "OS Dojo" --subtitle-en "A self-study path through MIT 6.1810" \
        --ep1 "Unix 系统调用" --ep1-en "Unix system calls" [--port 7878]

--lang picks the dojo language: go, typescript, python or rust (template/langs/<lang>/). It sets up a
warm-up dojo in that language; a course can add dojos in other languages later (see references/dojo.md).
--lang none makes a course without dojos: episode 1 gets video → reading → lab → flow (flowchart page),
and the home page hides the runner status. Dojos can still be added later.
The site is bilingual (中 / EN switch): the *-en options fill the English text; they default to the Chinese.

Creates:
  <root>/.env.example          per-course overrides (key normally in ~/.config/course-studio/.env)
  <root>/.gitignore
  <root>/site/                 the course site + dojo runner (Node; this is the repo you publish)
  <root>/episodes/ep01-<slug>/ the first episode's build folder (video kit + lab page)
Then: cd <root>/site && npm start     (opens the course home)
"""
import argparse, json, os, re, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
TPL = os.path.join(os.path.dirname(HERE), "template")
LANGS = sorted(d for d in os.listdir(os.path.join(TPL, "langs")) if os.path.isdir(os.path.join(TPL, "langs", d)))
sys.path.insert(0, HERE)
import new_episode


def slugify(s):
    s = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return s or "intro"


def add_language(site, lang, with_warmup):
    """Copy a language pack into the site: shared test helpers, and optionally its warm-up dojo."""
    pack = os.path.join(TPL, "langs", lang)
    shutil.copytree(os.path.join(pack, "shared"), os.path.join(site, "course", "shared", lang), dirs_exist_ok=True)
    if not with_warmup:
        return
    shutil.copytree(os.path.join(pack, "warmup"), os.path.join(site, "course", "dojos", "warmup"))
    for f in ("warmup.js", "warmup.en.js"):
        shutil.copy(os.path.join(pack, "web", f), os.path.join(site, "web", "js", "dojos", f))
    muts = os.path.join(site, "dev", "mutations.ts")
    s = open(muts, encoding="utf-8").read()
    open(muts, "w", encoding="utf-8").write(s.replace("\t// __MUTATIONS__\n", open(os.path.join(pack, "mutations.snippet"), encoding="utf-8").read()))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", required=True)
    ap.add_argument("--lang", required=True, choices=LANGS + ["none"], help="dojo language: " + ", ".join(LANGS) + ", or none (flowchart pages instead of dojos)")
    ap.add_argument("--title", required=True, help="course name shown in the header, e.g. 分布式系统练功房")
    ap.add_argument("--subtitle", default="", help="e.g. MIT 6.5840 自学路线")
    ap.add_argument("--title-en", help="English course name, e.g. Distributed Systems Dojo")
    ap.add_argument("--subtitle-en", help="e.g. A self-study path through MIT 6.5840")
    ap.add_argument("--ep1", required=True, help="title of episode 1")
    ap.add_argument("--ep1-en", help="English title of episode 1")
    ap.add_argument("--slug", help="folder slug for episode 1 (default: from --ep1)")
    ap.add_argument("--port", default="7878")
    ap.add_argument("--audience", default="beginner", choices=["beginner", "practitioner"], help="who the videos are pitched at (COURSE_META.audience); see references/video.md")
    a = ap.parse_args()
    root = os.path.abspath(os.path.expanduser(a.root))
    site = os.path.join(root, "site")
    if os.path.exists(site):
        sys.exit(f"{site} already exists; not overwriting")
    os.makedirs(root, exist_ok=True)
    shutil.copytree(os.path.join(TPL, "site"), site)
    os.makedirs(os.path.join(site, "web", "js", "dojos"), exist_ok=True)
    if a.lang == "none":
        pack = {"name": "no", "dojoDesc_en": "", "dojoDesc_zh": "", "install_en": "", "install_zh": "", "workspace_en": "", "workspace_zh": ""}
    else:
        add_language(site, a.lang, with_warmup=True)
        pack = json.load(open(os.path.join(TPL, "langs", a.lang, "pack.json"), encoding="utf-8"))
    subs = {"__COURSE_TITLE_EN__": a.title_en or a.title, "__COURSE_SUBTITLE_EN__": a.subtitle_en or a.subtitle,
            "__EP01_TITLE_EN__": a.ep1_en or a.ep1,
            "__COURSE_TITLE__": a.title, "__COURSE_SUBTITLE__": a.subtitle,
            "__PORT__": a.port, "__EP01_TITLE__": a.ep1, "__AUDIENCE__": a.audience,
            "__DOJO_DESC_EN__": pack["dojoDesc_en"], "__DOJO_DESC__": pack["dojoDesc_zh"],
            "__INSTALL_EN__": pack["install_en"], "__INSTALL__": pack["install_zh"],
            "__WORKSPACE_EN__": pack["workspace_en"], "__WORKSPACE__": pack["workspace_zh"]}
    for d, _, files in os.walk(site):
        for f in files:
            if f.endswith((".ts", ".html", ".js", ".css", ".py", ".json", ".md")):
                new_episode.fill(os.path.join(d, f), subs)
    if not os.path.exists(os.path.join(root, ".env.example")):
        open(os.path.join(root, ".env.example"), "w").write("# GEMINI_API_KEY is read from ~/.config/course-studio/.env; set it here only to override for this course\n# GEMINI_API_KEY=\n# GEMINI_VOICE=Sulafat\n")
    if not os.path.exists(os.path.join(root, ".gitignore")):
        open(os.path.join(root, ".gitignore"), "w").write(".env\n.DS_Store\nnode_modules/\nepisodes/*/audio/\nepisodes/*/*.wav\nepisodes/*/*.mp3\nepisodes/*/video.mp4\nsite/content/*/video.mp4\nepisodes/*/frames/\n# 课件 is kept once, in site/content/ (sync_content.py copies it there)\nepisodes/*/slides/\nepisodes/*/slides.html\nepisodes/*/slides.pdf\nepisodes/*/slides.json\n__pycache__/\n")
    if a.lang == "none":  # episode 1 uses the flowchart page in place of the dojo and assignment
        cj = os.path.join(site, "web", "js", "course.js")
        s = open(cj, encoding="utf-8").read()
        s = s.replace("steps: ['video', 'reading', 'lab', 'dojo', 'assignment'],", "steps: ['video', 'reading', 'lab', 'flow'],")
        s = re.sub(r"   dojo: 'warmup'.*?notes: \['和练功房思路相同，需要改的是接口：……'\]\}\},", "   flow: {questions: 3, time: '约 20 分钟', desc: '点流程图里的方框，看每一块用大白话讲是干什么的、在源码哪个文件；再做几道想一想。'}},", s, flags=re.S)
        open(cj, "w", encoding="utf-8").write(s)
        ce = os.path.join(site, "web", "js", "course.en.js")
        s = open(ce, encoding="utf-8").read()
        s = re.sub(r"    dojoTime: '1 to 2 hours',.*?notes: \['Same ideas as the dojo; what changes is the interface: …'\]\}\},", "    flow: {time: 'about 20 min', desc: 'Click the boxes in the flowchart to see what each part does in plain words and where it lives in the source, then answer a few questions.'}},", s, flags=re.S)
        open(ce, "w", encoding="utf-8").write(s)
    slug = a.slug or slugify(a.ep1)
    dest = os.path.join(root, "episodes", f"ep01-{slug}")
    if os.path.exists(dest):
        print(f"{dest} already exists; keeping it")
    else:
      new_episode.main(["--dest", os.path.join(root, "episodes", f"ep01-{slug}"), "--n", "1", "--title", a.ep1, "--course-title", a.title,
                      "--title-en", a.ep1_en or a.ep1, "--course-title-en", a.title_en or a.title])
    if a.lang == "none":
        print(f"\ncourse ready at {root} (no dojos; flowchart pages)\n  cd {site} && npm start")
        return
    print(f"\ncourse ready at {root} ({pack['name']} dojo)\n  cd {site} && npm start\n  cd {site} && npm run check   # verify the warm-up dojo")


if __name__ == "__main__":
    main()
