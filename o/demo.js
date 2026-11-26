
(function () {
  var cfg = document.getElementById("demo-live"); if (!cfg) return;
  var part = cfg.dataset.part, every = Number(cfg.dataset.every) * 1000, stepLink = cfg.dataset.step || "",
      dataPath = cfg.dataset.data, mailPath = cfg.dataset.mailbox || "", mailRows = null, lastReplies = [];
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text; return e; }
  function clear(id) { var e = document.getElementById(id); if (e) { while (e.firstChild) e.removeChild(e.firstChild); }
    return e; }
  function link(at, kind, text) { if (!stepLink) return el("span", "", text); var a = el("a", "", text);
    a.href = stepLink.replace("AT", encodeURIComponent(at)).replace("KIND", encodeURIComponent(kind)); return a; }
  function when(s) { return (s || "").replace("T", " ").slice(0, 16); }
  function counts(c) { var e = document.getElementById("counts"); if (!e || !c) return;
    var mail = c.emails_total ? c.emails_read + " of " + c.emails_total + " emails read" : c.emails_read + " emails read";
    e.textContent = c.open + " open \u00b7 " + c.closed + " closed \u00b7 " + c.found + " found so far \u00b7 " + mail; }
  function texts(rows) { var box = clear("texts"); if (!box) return;
    if (!rows.length) { box.appendChild(el("p", "muted", "No texts yet.")); return; }
    rows.forEach(function (t) { var b = el("div", "bubble " + (t.dir === "in" ? "in" : "out"), t.text);
      b.title = when(t.at); box.appendChild(b); }); box.scrollTop = box.scrollHeight; }
  function steps(rows) { var box = clear("steps"); if (!box) return;
    if (!rows.length) { box.appendChild(el("p", "muted", "Nothing read yet.")); return; }
    var ol = el("ol"); rows.slice().reverse().forEach(function (s) { var li = el("li");
      li.appendChild(el("span", "muted", s.when + " ")); li.appendChild(link(s.at, s.kind, s.words)); ol.appendChild(li); });
    box.appendChild(ol); }
  function tracked(rows) { var box = clear("tracked-rows"); if (!box) return;
    if (!rows.length) { box.appendChild(el("p", "muted", "Nothing tracked yet.")); return; }
    var t = el("table"), h = el("tr");
    ["kind", "what", "open or closed", "why", "last changed", "from"].forEach(function (x) { h.appendChild(el("th", "", x)); });
    t.appendChild(h);
    rows.forEach(function (r) { var tr = el("tr", r.state);
      [r.kind, r.what].forEach(function (x) { tr.appendChild(el("td", "", x)); });
      var st = el("td"); st.appendChild(el("b", "", r.state)); tr.appendChild(st);
      tr.appendChild(el("td", "", r.why)); tr.appendChild(el("td", "", when(r.changed)));
      var from = el("td"); (r.sources || []).forEach(function (s, i) { if (!s.at) return;
        if (i) from.appendChild(document.createTextNode(", ")); from.appendChild(link(s.at, "read", s.what)); });
      tr.appendChild(from); t.appendChild(tr); });
    box.appendChild(t); }
  function mail(m, cls) { var d = el("details", "mail " + (cls || "")), s = el("summary");
    s.appendChild(el("span", "when", when(m.at))); s.appendChild(el("b", "", " " + (m.from || m.to || "") + " "));
    s.appendChild(el("span", "", m.subject)); d.appendChild(s);
    if (m.to && cls === "mine") d.appendChild(el("p", "muted", "To: " + m.to));
    d.appendChild(el("pre", "", m.body || "(the words are in the demo Gmail's thread)"));
    (m.attachments || []).forEach(function (a) { d.appendChild(el("p", "attach", "Attached: " + a)); });
    return d; }
  function mailbox() { var box = clear("mailbox"); if (!box) return;
    if (lastReplies.length) { box.appendChild(el("h3", "", "Your replies"));
      lastReplies.slice().reverse().forEach(function (r) { box.appendChild(mail(r, "mine")); }); }
    if (mailRows === null) { box.appendChild(el("p", "muted", "Opening the mailbox\u2026")); return; }
    box.appendChild(el("h3", "", mailRows.length + " emails"));
    mailRows.forEach(function (m) { box.appendChild(mail(m)); }); }
  function suggestions(rows) { var box = clear("suggestions"); if (!box) return;
    box.appendChild(el("h3", "", "bulb's suggestions"));
    var open = rows.filter(function (r) { return r.state === "open"; });
    if (!open.length) { box.appendChild(el("p", "muted", "None yet.")); return; }
    var ul = el("ul"); open.forEach(function (r) { var li = el("li"); li.appendChild(el("b", "", r.what));
      li.appendChild(el("span", "muted", " " + r.why)); ul.appendChild(li); }); box.appendChild(ul); }
  function draw(d) { if (d.error) return; counts(d.counts); suggestions(d.suggestions || []);
    if (part === "demo") { texts(d.texts || []); steps(d.steps || []);
      var r = d.replies || []; if (JSON.stringify(r) !== JSON.stringify(lastReplies)) { lastReplies = r; mailbox(); } }
    tracked(d.tracked || []); }
  function poll() { fetch(dataPath, {cache: "no-store"})
    .then(function (r) { return r.json(); }).then(draw).catch(function () {})
    .then(function () { setTimeout(poll, every); }); }
  function tabs() { var bar = document.getElementById("demo-tabs"); if (!bar) return;
    bar.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return;
      document.querySelectorAll("#demo-tabs button").forEach(function (x) { x.classList.toggle("on", x === b); });
      document.querySelectorAll(".demo-tab").forEach(function (x) { x.hidden = x.id !== b.dataset.tab; });
      if (b.dataset.tab === "tab-mailbox" && mailRows === null && mailPath) {
        mailbox(); fetch(mailPath, {cache: "no-store"}).then(function (r) { return r.json(); })
          .then(function (rows) { mailRows = rows || []; mailbox(); }).catch(function () { mailRows = []; mailbox(); }); } }); }
  tabs(); poll();
})();
