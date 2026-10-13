# Voice call (打电话)

The video is input; the call is output. After an episode, the learner phones an AI study buddy and explains the episode out loud. When they hang up, a report says what they explained well and what they got wrong or left out, and each gap links to the moment in the video that covers it.

Status: prototype, first built in robot-course on 2026-10-13 (`~/Documents/ChatGPT/robot-course/voice/`: `make_card.py`, `server.mjs`, `index.html`). It has run end to end, but no real learner has used it yet. Start a new course's call from that folder. It moves into `template/` once its prompt has settled with real calls.

## The idea
- **The buddy doesn't teach, the learner does.** The AI has watched the episode, didn't quite get it, and wants it explained. It speaks a sentence or two at a time, asks one question at a time, and follows up with why, what if, which line and what number.
- **Wrong answers get a contradiction, not a correction.** The buddy brings up a real number or scene from the episode that doesn't fit what the learner said ("but the real run in the video showed…"), so the learner finds the mistake. After two misses it gives a hint that names the scene.
- **The buddy says only what the episode says.** Every number, function name and line number comes from the talk card. Tell it that the card is its private reference, not the learner's words. Without that line, it said "you said X" about things the learner never said.
- **The report closes the loop.** A text model compares the transcript with the card and lists the points explained well (quoting the learner), the gaps (wrong, vague or not covered), each gap's scene and start time, and where the next call could pick up. Tell it that speech-recognition typos are not mistakes, and that a point never raised counts as not covered, not wrong.

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
- **Ring until the voice arrives.** Play a ringback, and open the mic and start the clock only when the first audio chunk arrives. If the opening comes back silent, close that session and redial with a new token. The learner just hears it ring a little longer.
- **Test that audio arrived, not just the transcript.** The silent bug looked fine on the page: the buddy's words showed up as text. Count the audio parts per turn, and check `responseTokensDetails` in `usageMetadata`.
- **Turn-taking:** explaining code means pausing to think. Make end-of-speech detection less eager than the default (`endOfSpeechSensitivity: END_SENSITIVITY_LOW`, a longer `silenceDurationMs`).
- **Transcription:** pin English calls to `languageCodes: ['en-US']`, since auto-detect heard "Sure" as Chinese. Leave Chinese calls on auto, because learners say code names in English mid-sentence. Code names come out mangled either way (rx_buff came back as 专门号), which is one more reason the report prompt must ignore recognition errors.
- **Time:** a connection lasts about 10 minutes, and an audio-only session 15 minutes without compression. One episode per call fits; the prototype sends a wrap-up cue 2 minutes before the end. Longer calls need session resumption and context-window compression.
- **Prepaid billing:** if the project's credits run out, every call fails with `402`: Live, the report and TTS together.

## Cost
`promptTokenCount` grows every turn, because the card and all earlier audio (the buddy's included) are billed again each time. Per-minute prices therefore underestimate a call, and the later minutes cost more. Add up `usageMetadata` at the model's list prices, show the running total on the page, and set per-user minutes from real full-length calls. In robot-course the test calls, 45–75 s each, came to $0.007–0.027.

## Testing without a person
Run headless Chrome with `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream --use-file-for-fake-audio-capture=<wav>`. Make the learner's voice with macOS `say` (`Eddy (中文（中国大陆）)`, `Daniel`), padded with silence. Plant a deliberate mistake and check that the buddy questions it and the report marks it wrong. The fake mic keeps playing while the buddy talks, so turn-taking and barge-in still need a real call.
