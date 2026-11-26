
(function () {
  var meta = document.querySelector('meta[name="bulb-relay-office"]');
  var api = meta ? meta.content : "", code = location.hash.slice(1), real = window.fetch.bind(window);
  var last = {}, got = {}, at = 0, over = false, EVERY = 5000;
  function live() { var e = document.getElementById("live"); if (!e) return;
    if (over) { e.textContent = "This link has ended."; e.className = "ended"; return; }
    if (!at) { e.textContent = "Waiting for bulb..."; e.className = "muted"; return; }
    e.textContent = "Live, updated " + Math.max(0, Math.round((Date.now() - at) / 1000)) + " s ago"; e.className = "live"; }
  function ended() { over = true; live();
    ["demo-tabs", "tab-office", "tab-mailbox"].forEach(function (id) { var e = document.getElementById(id);
      if (e) e.hidden = true; });
    return new Promise(function () {}); }
  function visible() { if (!document.hidden) return Promise.resolve();
    return new Promise(function (ok) { document.addEventListener("visibilitychange", function f() {
      if (!document.hidden) { document.removeEventListener("visibilitychange", f); ok(); } }); }); }
  function ask(part) { return real(api + "?c=" + encodeURIComponent(code) + "&part=" + part, {cache: "no-store"}); }
  function read(part) {
    if (over || !api || !/^[A-Za-z0-9_-]{22}$/.test(code)) return ended();
    return visible().then(function () { return ask("hash"); }).then(function (r) {
      if (r.status === 404) return ended();
      if (!r.ok) throw new Error("relay");
      return r.json().then(function (h) {
        if (!h[part]) throw new Error("not yet");
        if (got[part] !== undefined && h[part] === last[part]) return got[part];
        return ask(part).then(function (r2) {
          if (r2.status === 404) return ended();
          if (!r2.ok) throw new Error("relay");
          return r2.text().then(function (t) { last[part] = h[part]; got[part] = t; return t; }); }); }); })
      .then(function (t) { at = Date.now(); live(); return new Response(t, {headers: {"Content-Type": "application/json"}}); });
  }
  function again(part) { return read(part).catch(function () {
    return new Promise(function (ok) { setTimeout(ok, EVERY); }).then(function () { return again(part); }); }); }
  window.fetch = function (url, opts) {
    if (url === "relay:page") return read("page");
    if (url === "relay:mail") return again("mail");
    return real(url, opts); };
  document.addEventListener("DOMContentLoaded", function () { live(); setInterval(live, 1000); });
})();
