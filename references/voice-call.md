# Voice call (打电话)

The video is input; the call is output. After an episode, the learner phones an AI study buddy and explains the episode out loud. When they hang up, a report says what they explained well and what they got wrong or left out, and each gap links to the moment in the video that covers it.

Status: prototype, first built in robot-course on 2026-10-13 (`~/Documents/ChatGPT/robot-course/voice/`: `make_card.py`, `lib.mjs` (card, prompt, token, report), `server.mjs`, `index.html`, `eval/run.mjs`). It has run end to end, but no real learner has used it yet. Start a new course's call from that folder. It moves into `template/` once its prompt has settled with real calls.

## The idea
- **The buddy doesn't teach, the learner does.** The AI has watched the episode, didn't quite get it, and wants it explained. It speaks a sentence or two at a time, asks one question at a time, and follows up with why, what if, which line and what number.
- **Open with one small question.** "Walk me through it from the start" is too big; learners freeze. Ask something answerable in a sentence about the start of the part, and go deeper from there.
- **Wrong answers get a contradiction, not a correction.** The buddy brings up a real number or scene from the episode that doesn't fit what the learner said ("but the real run in the video showed…"), so the learner finds the mistake. After two misses it gives a hint that names the scene.
- **Check every claim before agreeing.** When one sentence held two mistakes, the buddy questioned one and said "right" to the other. Tell it to check each claim before saying "right", to acknowledge only the correct part, and to ask about each mistake in turn. Repeat the rule after the card.
- **A way down when the learner is stuck.** When the learner can't answer, hasn't watched or won't explain, the buddy steps down instead of pushing or lecturing: a smaller question, then two options, then a statement to judge (it can be deliberately wrong), then the scene to rewatch. To "just tell me", it says half and lets the learner finish. A second dodge switches it to statements the learner only has to judge.
- **Let the learner pick the part.** Many learners call before finishing the video. The prompt alone couldn't keep the buddy within what they'd watched, even with more thinking. A from–to scene selector on the page did, and the shorter card made each call cheaper.
- **The buddy says only what the episode says.** Every number, function name and line number comes from the talk card. Tell it that the card is its private reference, not the learner's words. Without that line, it said "you said X" about things the learner never said.
- **The report closes the loop.** A text model compares the transcript with the card for the chosen part. It lists the points explained well (quoting the learner), the gaps (wrong, vague or not covered) with each gap's scene and start time, and one question to think about before the next call. Tell it that speech-recognition typos are not mistakes, and that a point never raised counts as not covered, not wrong. When the learner said almost nothing, skip the report call and just point to the scene to watch.

## Talk card
Generate it from the episode, never write it by hand. Use the scene titles and narration from `script.json`, the start times from `timeline.json`, and the questions with their real-run answers from `practice.json`. In a course about a codebase, everything the buddy can say then traces back to the same runs as the video. The card goes into the system prompt in the call's language.

Keep it compact, because the whole context is billed again on every turn (see Cost).

## Shape
```
browser ── POST /api/token ──▶ server: checks the user and minutes left; mints a single-use token
        ◀── token ───────────┘   with model, voice, prompt, VAD and transcription locked in
browser ══ WebSocket ══▶ Gemini Live (audio both ways; the server isn't in the audio path)
browser ── POST /api/report (transcript) ──▶ server → text model → report (+ scene times)
```
- The key stays on the server. Mint the token with REST `POST v1beta/auth_tokens`, passing `uses: 1`, a `newSessionExpireTime` about 60 s out, and the full setup under **`bidiGenerateContentSetup`**. The SDK calls this `liveConnectConstraints`, and REST rejects that name. The browser connects to `…GenerativeService.BidiGenerateContentConstrained?access_token=…` and sends only `{setup: {model}}`. A prompt the page sends is ignored, and a used token is refused.
- In production the server is a Worker (or any function host), with the minutes and saved calls in its database. The shape doesn't change.
- Saved calls hold the learners' own words, so keep them out of git.

## Audio
- Mic: an AudioWorklet resamples the device rate to 16 kHz mono PCM16 and sends about 40 ms per message (`realtimeInput.audio`, `audio/pcm;rate=16000`). Ask for `echoCancellation`, `noiseSuppression` and `autoGainControl`.
- Speaker: the model sends 24 kHz PCM16. Schedule the chunks back to back. On `serverContent.interrupted`, stop everything queued; that is what lets the learner cut in.
- Echo: through laptop speakers the buddy can hear itself. Browser echo cancellation usually copes, but suggest headphones on the page.

## Pitfalls (measured on gemini-3.8-live, 2026-10-13)
- **A low thinking budget gives replies with no audio.** With the full talk card (about 5.7k tokens), the model often answered the opening in text only (`outputTranscription`, zero audio parts), and that whole session then stayed silent, spoken turns included. Over 12 openings each: budget 0 gave 8 silent, 128 gave 7, and both 512 (0.86 s median to first audio) and the default (1.37 s) gave 0. The short test prompt never showed it.
- **More thinking makes it rarer but not gone.** With a longer prompt it came back at a lower rate on every budget (512 gave 1 silent in 11, the default 3 in 12, 1024 none in 12 but 0.3 s slower per reply). The redial below is what makes it safe; it only ever hit the opening.
- **Ring until the voice arrives.** Play a ringback, and open the mic and start the clock only when the first audio chunk arrives. If the opening comes back silent, close that session and redial with a new token. The learner just hears it ring a little longer.
- **Test that audio arrived, not just the transcript.** The silent bug looked fine on the page: the buddy's words showed up as text. Count the audio parts per turn, and check `responseTokensDetails` in `usageMetadata`.
- **Turn-taking:** explaining code means pausing to think. Make end-of-speech detection less eager than the default (`endOfSpeechSensitivity: END_SENSITIVITY_LOW`, a longer `silenceDurationMs`).
- **Transcription:** pin English calls to `languageCodes: ['en-US']`, since auto-detect heard "Sure" as Chinese. Leave Chinese calls on auto, because learners say code names in English mid-sentence. Code names come out mangled either way (rx_buff came back as 专门号), which is one more reason the report prompt must ignore recognition errors.
- **Time:** a connection lasts about 10 minutes, and an audio-only session 15 minutes without compression. One episode per call fits; the prototype sends a wrap-up cue 2 minutes before the end. Longer calls need session resumption and context-window compression.
- **Prepaid billing:** if the project's credits run out, every call fails with `402`: Live, the report and TTS together.

## Cost
`promptTokenCount` grows every turn, because the card and all earlier audio (the buddy's included) are billed again each time. Per-minute prices therefore underestimate a call, and the later minutes cost more. Add up `usageMetadata` at the model's list prices, show the running total on the page, and set per-user minutes from real full-length calls. In robot-course the test calls, 45–75 s each, came to $0.007–0.027.

## Tuning the prompt with simulated learners
Prompt changes are easy to argue about and hard to judge by ear, so measure them. Simulated learners call the real Live buddy, minted exactly like the page's, and talk to it in text: one who knows the part, one with planted misconceptions, one who barely watched, and one who won't explain. Then check every call:
- **Mechanical checks:** words that give the setup away ("material"), numbers that aren't in the card or the learner's own words, turn length, and turns with no audio.
- **Judge checks**, by a text model that sees the card: claiming the learner said something they didn't, lecturing, and whether this persona was handled. Write each persona's goal to match the ladder in the prompt; a judge that only accepted options or spot-the-mistake failed the buddy for asking a smaller question, which is what it was told to do.
Rejudge older runs with the current judge before comparing versions. Two calls per persona is noise, so when a result matters, run three or more for the persona in question. Have the learner simulator return structured output; as plain text it once wrote out its reasoning, and the buddy answered that. robot-course's `voice/eval/run.mjs` does all this for about $0.08 per eight-turn call. Its first tuning took the buddy from v1 to v4: lecturing turns dropped from 7 to 0, refusers handled went from 0/2 to 2/2, and misconceptions questioned without agreeing went from 1/2 to 2/3. Text-mode calls don't test speech recognition or turn-taking, which are where the one real "you said DMA" came from.

## Testing without a person
Run headless Chrome with `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream --use-file-for-fake-audio-capture=<wav>`. Make the learner's voice with macOS `say` (`Eddy (中文（中国大陆）)`, `Daniel`), padded with silence. Plant a deliberate mistake and check that the buddy questions it and the report marks it wrong. The fake mic keeps playing while the buddy talks, so turn-taking and barge-in still need a real call.
