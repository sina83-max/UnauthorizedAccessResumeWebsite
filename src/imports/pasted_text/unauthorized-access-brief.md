Design Brief — "Unauthorized Access" Resume Website
Concept Summary

A personal portfolio/resume site framed as if a visitor has just "broken into" the owner's personal files — a playful, self-aware riff on surveillance/hacking aesthetics (inspired by ad mockups that dramatize "here's everything the internet has on you"), flipped from creepy into a fun, consensual reveal of a professional profile. The joke: nothing is actually stolen — the visitor was invited the whole time.

Tone: confident, cheeky, a little theatrical. NOT meant to feel genuinely threatening, invasive, or unsettling. The visitor should be in on the joke within 2-3 seconds of landing.

1. Structure & Flow
Breach intro sequence (skippable, ~2-4 seconds)
Folder-open transition
Main file explorer view ("About [Name]" window)
File interactions: preview panel, download, or nested folder
Persistent tone element: a small self-aware label/badge throughout
2. Breach Intro Sequence
Full-screen, near-black background, terminal/monospace font.
Fast-scrolling fake connection log, e.g.:
Establishing connection...
Bypassing firewall...
Access granted.
A fake "permission request" dialog flashes and self-resolves — deliberately escalates then deflates the joke:
Requesting access to: Location [DENIED — just kidding]
Contacts [N/A]
Career History [GRANTED]
Use real, harmless, publicly-readable browser data to sell the illusion — timezone, browser name, approximate city from IP, local time. Presented like a "target profile" readout:
Subject located: Tehran, IR
Browser: Chrome
Local time: 21:40
This is the single most effective trick because it's real data any site can already read — just presented like a hack.
Typing/cursor blink effect. Subtle CRT scanline or glitch shader on the background during this sequence only.
Ends with a wink line that defuses any real unease, e.g.:
RELAX. You clicked "view resume," not the other way around.
Skip intro link/button visible immediately, for repeat visitors or recruiters in a hurry.
Hard no-gos: no fake webcam/mic access indicators (e.g. the little green camera dot), no real browser permission prompts (camera, mic, precise GPS) — everything here is decorative and never triggers an actual OS/browser permission dialog.
3. Transition
Terminal view dissolves/wipes into a clean desktop-style file explorer window opening — should feel like a literal "folder opening" moment, not a hard cut.
4. Main File Explorer Window
Styled like a minimal macOS/Windows file explorer:
Rounded corners, subtle drop shadow, title bar with window controls
Icon + filename rows, list or grid toggle
Search bar at the top
Entry point file: README.md — opens first or is pinned at top; one short paragraph of tone-setting bio text, terminal-ish font.
Core files (map resume sections to file metaphor):
resume.pdf — real, literal download-on-click (matches user expectation exactly; recruiters can just grab the PDF)
projects/ — folder containing sample/portfolio work
experience.md or work_history.md
skills.json — styled to visually resemble real JSON syntax
about_me.txt / bio.md
contact.vcf — downloadable contact card
Personality/joke files (this is what makes it memorable, not just clean):
recently_deleted/ or trash/ — self-deprecating content: a rejected side project, a bug shipped to prod, a job that didn't work out
Optional extras: currently_learning.txt, side_quests/
Fake file "properties" panel — on hover or click, before/alongside opening, show a mock OS properties popup with a joke stat, e.g.:
Created: 2021
Size: 3 internships
Last modified: yesterday (still learning)
Functional search/filter bar — typing filters or highlights files by content (e.g. typing "python" highlights every file mentioning it). Doubles as a subtle demonstration of technical skill since it's a real feature, not just decoration.
5. File Interaction States
Click/tap a file → opens a preview panel (in-window modal or slide-over), NOT a full page navigation — preserves the "still inside the folder" feeling.
resume.pdf is the exception: real download, not a preview modal.
Folder items (projects/, recently_deleted/) expand into a nested file list using the same explorer UI, not a different layout.
Closing a preview returns to the folder view exactly as left (state preserved).
6. Visual Style
Dark theme, near-black base.
Monospace/terminal font for intro sequence and fake system UI (properties popups, connection log); clean sans-serif for actual resume content once inside a file.
Single sharp accent color used sparingly (terminal green, electric blue, or amber) against black/white/gray — not overused elsewhere.
Icons: simple, flat, file-type-specific (PDF icon, folder icon, doc icon, JSON brackets icon).
Scanline/glitch texture confined to the intro sequence — should not persist or distract once the folder is open and the visitor is reading actual content.
7. Tone & Self-Awareness
The "hacker" framing must read as a joke the visitor is in on almost immediately — never sustained long enough to feel like genuine deception.
A small persistent badge or label somewhere in the UI keeps this explicit throughout, e.g. "unauthorized-ish access, fully consensual."
Humor should lean self-deprecating (the trash folder, the joke properties stats) rather than boastful — keeps it charming rather than smug.
8. Responsiveness & Accessibility
Fully responsive: desktop shows the full file-explorer window; mobile simplifies to a stacked list view (not a shrunk desktop window) while keeping the same file/folder metaphor and icons.
Proper semantic structure and labels for screen readers — file icons should not be the only way to identify file type/content.
Full keyboard navigation (tab through files, enter to open, escape to close preview).
Intro sequence must be skippable and should not autoplay sound.
9. Deliverables Requested
Landing/breach intro screen (desktop)
Folder-open transition concept (key frames or description)
Main file explorer view — desktop
Main file explorer view — mobile (stacked list variant)
File preview/detail state (e.g. opening skills.json or a project file)
Fake "properties" popup component
recently_deleted/ folder view (joke content state)
10. Technical Context (for design feasibility)
Intended to be built as a static site (HTML/CSS/JS or lightweight React), hosted on GitHub Pages/Vercel — no backend server required.
All "hacking" effects are client-side illusions using real but harmless browser-exposed data (timezone, browser, approximate location via IP) — no actual external data access, no real permission requests.