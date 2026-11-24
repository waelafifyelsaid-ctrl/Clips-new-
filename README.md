# Clips-new-
Clips 

## Stories

A stories viewer for Clips, in `stories/`. It is plain HTML, CSS and JS with no build step. Open `stories/index.html` in a browser to try it.

- A row of circles across the top. A gradient ring means unwatched; a grey ring means watched. Watched stories move to the end of the row.
- The viewer is full screen, with one progress bar per clip. Images show for 5 seconds (an item can set its own `duration`). Videos play for their own length.
- Tap the right side to go forward and the left side to go back. Hold to pause. Swipe left or right to switch person, and swipe down to close.
- On a keyboard, `←` and `→` move between clips, `Space` pauses and `Esc` closes.
- The ＋ button adds your own photos and videos as "Your story". These only last for the current page session.
- The browser remembers which stories you've watched (in `localStorage`).

The sample content is in `stories/data.js`. To use real media, give an item's `src` an image or video URL and set its `type` to `"image"` or `"video"`.
