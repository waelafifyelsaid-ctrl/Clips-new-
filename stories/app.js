(function () {
  "use strict";

  var DEFAULT_MS = 5000;
  var SEEN_KEY = "clips.stories.seen";
  var HOLD_MS = 200; // presses longer than this count as "hold to pause", not a tap

  var stories = window.STORIES || [];
  var $ = function (id) { return document.getElementById(id); };
  var tray = $("tray"), viewer = $("viewer"), stage = $("stage"), progress = $("progress"),
      media = $("media"), caption = $("caption"), metaAvatar = $("meta-avatar"),
      metaName = $("meta-name"), metaTime = $("meta-time"), pauseBtn = $("pause-btn"),
      muteBtn = $("mute-btn");

  // ---------- Seen state (per-browser convenience only) ----------
  var seen = {};
  try { seen = JSON.parse(localStorage.getItem(SEEN_KEY)) || {}; } catch (e) { seen = {}; }
  function markSeen(item) {
    seen[item.id] = true;
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (e) { /* storage unavailable */ }
  }
  function userSeen(user) { return user.items.every(function (it) { return seen[it.id]; }); }
  function firstUnseen(user) {
    for (var i = 0; i < user.items.length; i++) if (!seen[user.items[i].id]) return i;
    return 0;
  }

  // ---------- Tray ----------
  function orderedStories() {
    // Yours first, then unseen, then seen, keeping the original order within each group.
    return stories.slice().sort(function (a, b) {
      if (a.mine !== b.mine) return a.mine ? -1 : 1;
      return userSeen(a) - userSeen(b);
    });
  }

  function renderTray() {
    tray.innerHTML = "";
    orderedStories().forEach(function (user) {
      if (!user.items.length) return;
      var b = document.createElement("button");
      b.className = "bubble" + (userSeen(user) ? " seen" : "");
      b.innerHTML = '<div class="ring"><img alt=""></div><span></span>';
      b.querySelector("img").src = user.avatar;
      b.querySelector("span").textContent = user.mine ? "Your story" : user.name;
      b.setAttribute("aria-label", (user.mine ? "Your story" : user.name + "'s story") + (userSeen(user) ? ", seen" : ""));
      b.addEventListener("click", function () { open(stories.indexOf(user), firstUnseen(user), b); });
      tray.appendChild(b);
    });
  }

  // ---------- Viewer state ----------
  var u = 0, i = 0;          // current user index, item index
  var elapsed = 0, duration = DEFAULT_MS, lastTick = 0, raf = 0;
  var paused = false, muted = true, returnFocus = null, video = null;
  var session = [];          // tray order, frozen while the viewer is open

  function relTime(t) {
    if (!t) return "";
    var m = Math.max(1, Math.round((Date.now() - t) / 60000));
    if (m < 60) return m + "m";
    return Math.round(m / 60) + "h";
  }

  function open(userIndex, itemIndex, opener) {
    returnFocus = opener || null;
    session = orderedStories().filter(function (s) { return s.items.length; });
    viewer.hidden = false;
    setPaused(false);
    document.body.style.overflow = "hidden";
    show(userIndex, itemIndex, true);
    $("close-btn").focus();
  }

  function close() {
    stop();
    teardownMedia();
    viewer.hidden = true;
    document.body.style.overflow = "";
    renderTray();
    if (returnFocus && document.body.contains(returnFocus)) returnFocus.focus();
  }

  function teardownMedia() {
    if (video) { video.pause(); video.removeAttribute("src"); video.load(); video = null; }
    media.innerHTML = "";
  }

  function show(userIndex, itemIndex, newUser) {
    stop();
    teardownMedia();
    u = userIndex; i = itemIndex;
    var user = stories[u], item = user.items[i];

    if (newUser) {
      stage.classList.remove("slide-in"); void stage.offsetWidth; stage.classList.add("slide-in");
    }

    metaAvatar.src = user.avatar;
    metaName.textContent = user.mine ? "Your story" : user.name;
    metaTime.textContent = relTime(item.time);
    caption.textContent = item.caption || "";

    progress.innerHTML = "";
    user.items.forEach(function (_, k) {
      var bar = document.createElement("div");
      bar.className = "bar" + (k < i ? " done" : "");
      bar.innerHTML = "<i></i>";
      progress.appendChild(bar);
    });

    elapsed = 0;
    duration = item.duration || DEFAULT_MS;
    markSeen(item);

    if (item.type === "video") {
      muteBtn.hidden = false;
      video = document.createElement("video");
      video.src = item.src;
      video.playsInline = true;
      video.muted = muted;
      video.preload = "auto";
      video.addEventListener("loadedmetadata", function () {
        if (isFinite(video.duration) && video.duration > 0) duration = video.duration * 1000;
      });
      video.addEventListener("ended", next);
      media.appendChild(video);
      var p = video.play();
      if (p && p.catch) p.catch(function () { /* autoplay blocked; timer still advances */ });
    } else {
      muteBtn.hidden = true;
      var img = new Image();
      img.alt = item.caption || (user.name + " story");
      img.src = item.src;
      media.appendChild(img);
    }
    media.classList.toggle("contain", !!item.contain);
    updateMuteBtn();
    if (!paused) start();
  }

  function currentBarFill() { return progress.children[i] && progress.children[i].firstChild; }

  function tick(t) {
    if (!lastTick) lastTick = t;
    // Video drives its own clock so the bar matches playback (including buffering stalls).
    if (video && !video.paused && isFinite(video.duration) && video.duration > 0) {
      elapsed = video.currentTime * 1000;
    } else if (!video || video.paused) {
      elapsed += t - lastTick;
    }
    lastTick = t;
    var fill = currentBarFill();
    if (fill) fill.style.width = Math.min(100, (elapsed / duration) * 100) + "%";
    // Images (and videos that couldn't autoplay) advance on the timer; playing videos advance on "ended".
    if (elapsed >= duration && (!video || (video.paused && !video.ended))) { next(); return; }
    raf = requestAnimationFrame(tick);
  }

  function start() { lastTick = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  function setPaused(p) {
    paused = p;
    pauseBtn.textContent = p ? "▶" : "❚❚";
    pauseBtn.setAttribute("aria-label", p ? "Play" : "Pause");
    if (p) { stop(); if (video) video.pause(); }
    else { if (video) { var r = video.play(); if (r && r.catch) r.catch(function () {}); } start(); }
  }

  function updateMuteBtn() {
    muteBtn.textContent = muted ? "🔇" : "🔊";
    muteBtn.setAttribute("aria-label", muted ? "Unmute" : "Mute");
  }

  function next() {
    var user = stories[u];
    if (i < user.items.length - 1) return show(u, i + 1, false);
    var nu = nextUserIndex(u, 1);
    if (nu === -1) return close();
    show(nu, firstUnseen(stories[nu]), true);
  }

  function prev() {
    if (i > 0) return show(u, i - 1, false);
    var pu = nextUserIndex(u, -1);
    if (pu === -1) return show(u, 0, false);
    show(pu, stories[pu].items.length - 1, true);
  }

  // Move through users in the order the tray showed when the viewer opened.
  // (Re-sorting live would push a just-finished user to the end and skip everyone else.)
  function nextUserIndex(from, dir) {
    var pos = session.indexOf(stories[from]) + dir;
    return pos >= 0 && pos < session.length ? stories.indexOf(session[pos]) : -1;
  }

  // ---------- Input ----------
  function bindTap(el, action) {
    var downAt = 0, wasPaused = false;
    el.addEventListener("pointerdown", function () {
      downAt = Date.now(); wasPaused = paused;
      if (!paused) setPaused(true);
    });
    el.addEventListener("pointerup", function () {
      var held = Date.now() - downAt > HOLD_MS;
      if (!wasPaused) setPaused(false);
      if (!held) action();
      downAt = 0;
    });
    el.addEventListener("pointerleave", function () { if (downAt && !wasPaused) setPaused(false); downAt = 0; });
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); action(); }
    });
    el.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  }
  bindTap($("tap-prev"), prev);
  bindTap($("tap-next"), next);

  // Swipe between users / down to close.
  var sx = 0, sy = 0;
  stage.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener("touchend", function (e) {
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dy) > 80 && dy > Math.abs(dx)) return close();
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      var target = nextUserIndex(u, dx < 0 ? 1 : -1);
      if (target === -1) { if (dx < 0) close(); return; }
      show(target, firstUnseen(stories[target]), true);
    }
  });

  $("close-btn").addEventListener("click", close);
  pauseBtn.addEventListener("click", function () { setPaused(!paused); });
  muteBtn.addEventListener("click", function () {
    muted = !muted;
    if (video) video.muted = muted;
    updateMuteBtn();
  });

  document.addEventListener("keydown", function (e) {
    if (viewer.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") next();
    else if (e.key === "ArrowLeft") prev();
    else if (e.key === " " && e.target === document.body) { e.preventDefault(); setPaused(!paused); }
  });

  document.addEventListener("visibilitychange", function () {
    if (viewer.hidden) return;
    if (document.hidden) { stop(); if (video) video.pause(); }
    else if (!paused) setPaused(false);
  });

  // ---------- Add your own story ----------
  $("file-input").addEventListener("change", function (e) {
    var files = Array.prototype.slice.call(e.target.files || []);
    if (!files.length) return;
    var mine = stories.filter(function (s) { return s.mine; })[0];
    if (!mine) {
      mine = { id: "me", name: "you", mine: true, avatar: makeMeAvatar(), items: [] };
      stories.unshift(mine);
    }
    files.forEach(function (f, k) {
      var isVideo = f.type.indexOf("video/") === 0;
      if (!isVideo && f.type.indexOf("image/") !== 0) return;
      mine.items.push({
        id: "me-" + Date.now() + "-" + k,
        type: isVideo ? "video" : "image",
        src: URL.createObjectURL(f),
        time: Date.now(),
        contain: true
      });
    });
    e.target.value = "";
    renderTray();
  });

  function makeMeAvatar() {
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#2a2a35"/>' +
      '<circle cx="50" cy="40" r="18" fill="#9a9aa6"/><rect x="20" y="64" width="60" height="40" rx="20" fill="#9a9aa6"/></svg>');
  }

  renderTray();
})();
