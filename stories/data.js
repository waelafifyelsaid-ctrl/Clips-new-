// Sample stories. Every image is an inline SVG, so the demo works offline.
// To use real media, set `src` to any image/video URL and `type` to "image" or "video".
(function () {
  function svg(markup, w, h) {
    return "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + " " + h + '">' + markup + "</svg>");
  }

  function avatar(initials, c1, c2) {
    return svg(
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs>' +
      '<rect width="100" height="100" fill="url(#g)"/>' +
      '<text x="50" y="62" font-family="system-ui,sans-serif" font-size="38" font-weight="700" fill="#fff" text-anchor="middle">' + initials + "</text>",
      100, 100);
  }

  function slide(c1, c2, emoji, title) {
    return svg(
      '<defs><linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="' + c1 + '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs>' +
      '<rect width="540" height="960" fill="url(#g)"/>' +
      '<circle cx="430" cy="180" r="140" fill="#fff" opacity=".08"/>' +
      '<circle cx="90" cy="780" r="200" fill="#000" opacity=".08"/>' +
      '<text x="270" y="470" font-size="180" text-anchor="middle">' + emoji + "</text>" +
      '<text x="270" y="600" font-family="system-ui,sans-serif" font-size="44" font-weight="800" fill="#fff" text-anchor="middle">' + title + "</text>",
      540, 960);
  }

  var H = 3600 * 1000;
  var now = Date.now();

  window.STORIES = [
    {
      id: "maya", name: "maya", avatar: avatar("M", "#ff6a88", "#ff99ac"),
      items: [
        { id: "maya-1", type: "image", src: slide("#ff9a8b", "#ff6a88", "🌅", "Golden hour"), caption: "Best sunset this week", time: now - 2 * H },
        { id: "maya-2", type: "image", src: slide("#fbc2eb", "#a6c1ee", "🍦", "Ice cream run"), time: now - 1.5 * H },
        { id: "maya-3", type: "image", src: slide("#a18cd1", "#fbc2eb", "🎶", "Live set tonight"), caption: "Who's coming?", time: now - 0.5 * H, duration: 7000 }
      ]
    },
    {
      id: "leo", name: "leo.trails", avatar: avatar("L", "#11998e", "#38ef7d"),
      items: [
        { id: "leo-1", type: "image", src: slide("#134e5e", "#71b280", "⛰️", "Summit day"), caption: "2,400 m up", time: now - 6 * H },
        { id: "leo-2", type: "image", src: slide("#56ab2f", "#a8e063", "🏕️", "Camp set"), time: now - 5 * H }
      ]
    },
    {
      id: "nora", name: "nora_cooks", avatar: avatar("N", "#f7971e", "#ffd200"),
      items: [
        { id: "nora-1", type: "image", src: slide("#f12711", "#f5af19", "🍜", "Ramen night"), caption: "Recipe in bio", time: now - 9 * H },
        { id: "nora-2", type: "image", src: slide("#ee9ca7", "#ffdde1", "🍰", "Dessert too"), time: now - 8 * H },
        { id: "nora-3", type: "image", src: slide("#ffb75e", "#ed8f03", "👩‍🍳", "Thanks for 10k!"), time: now - 7 * H }
      ]
    },
    {
      id: "kai", name: "kai.dev", avatar: avatar("K", "#4568dc", "#b06ab3"),
      items: [
        { id: "kai-1", type: "image", src: slide("#232526", "#414345", "💻", "Shipping day"), caption: "v2.0 is live", time: now - 12 * H },
        { id: "kai-2", type: "image", src: slide("#4568dc", "#b06ab3", "🚀", "It works!"), time: now - 11 * H }
      ]
    },
    {
      id: "sol", name: "sol.studio", avatar: avatar("S", "#00c6ff", "#0072ff"),
      items: [
        { id: "sol-1", type: "image", src: slide("#00c6ff", "#0072ff", "🎨", "New print drop"), time: now - 20 * H }
      ]
    }
  ];
})();
