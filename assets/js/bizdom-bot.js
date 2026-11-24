/* Bizdom Assistant — floating AI guide for TheBizdom.
   Talks to /api/chat (Cloudflare Pages Function + Workers AI).
   Knowledge: the site's own article archive. No dependencies. */
(function () {
  "use strict";

  var TEAL = "#163936", COBALT = "#0a56fc", PAPER = "#f8fbfb", INK = "#1c2b2a";
  var API = "/api/chat";

  /* ---------- inject styles ---------- */
  var css = [
    "#bd-bot{position:fixed;right:22px;bottom:22px;z-index:9999;font-family:'Titillium Web',-apple-system,'Segoe UI',sans-serif;}",
    "#bd-bot *{box-sizing:border-box;margin:0;padding:0;}",
    "#bd-fab{width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;background:" + TEAL + ";color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(10,40,38,.35);transition:transform .18s ease,background .18s ease;}",
    "#bd-fab:hover{background:" + COBALT + ";transform:translateY(-2px);}",
    "#bd-fab svg{width:26px;height:26px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}",
    "#bd-fab .bd-x{display:none;}",
    "#bd-bot.open #bd-fab .bd-chat{display:none;}",
    "#bd-bot.open #bd-fab .bd-x{display:block;}",
    "#bd-panel{position:absolute;right:0;bottom:70px;width:360px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 130px);background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(10,40,38,.28);display:none;flex-direction:column;overflow:hidden;border:1px solid rgba(22,57,54,.12);}",
    "#bd-bot.open #bd-panel{display:flex;animation:bdIn .22s ease;}",
    "@keyframes bdIn{from{opacity:0;transform:translateY(12px) scale(.98);}to{opacity:1;transform:none;}}",
    "#bd-head{background:" + TEAL + ";color:#fff;padding:14px 16px;}",
    "#bd-head strong{display:block;font-size:15px;letter-spacing:.3px;}",
    "#bd-head span{display:block;font-size:11.5px;opacity:.75;margin-top:2px;}",
    "#bd-msgs{flex:1;overflow-y:auto;padding:14px;background:" + PAPER + ";}",
    "#bd-msgs::-webkit-scrollbar{width:6px;}#bd-msgs::-webkit-scrollbar-thumb{background:rgba(22,57,54,.25);border-radius:3px;}",
    ".bd-msg{max-width:88%;padding:9px 13px;border-radius:14px;margin-bottom:10px;font-size:13.5px;line-height:1.55;white-space:pre-wrap;word-wrap:break-word;}",
    ".bd-msg.user{background:" + COBALT + ";color:#fff;margin-left:auto;border-bottom-right-radius:4px;}",
    ".bd-msg.bot{background:#fff;color:" + INK + ";border:1px solid rgba(22,57,54,.12);border-bottom-left-radius:4px;}",
    ".bd-msg.bot a{color:" + COBALT + ";}",
    ".bd-src{display:block;margin-top:8px;font-size:11.5px;}",
    ".bd-src a{color:" + COBALT + ";text-decoration:none;font-weight:700;}",
    "#bd-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px;background:" + PAPER + ";}",
    ".bd-chip{border:1px solid rgba(22,57,54,.25);background:#fff;color:" + TEAL + ";font-size:12px;padding:5px 11px;border-radius:999px;cursor:pointer;transition:all .15s;font-family:inherit;}",
    ".bd-chip:hover{background:" + TEAL + ";color:#fff;}",
    "#bd-form{display:flex;gap:8px;padding:12px;border-top:1px solid rgba(22,57,54,.12);background:#fff;}",
    "#bd-input{flex:1;border:1px solid rgba(22,57,54,.25);border-radius:10px;padding:9px 12px;font-size:13.5px;font-family:inherit;outline:none;color:" + INK + ";}",
    "#bd-input:focus{border-color:" + COBALT + ";}",
    "#bd-send{width:40px;height:40px;border:none;border-radius:10px;background:" + COBALT + ";color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none;}",
    "#bd-send:hover{background:" + TEAL + ";}",
    "#bd-send svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}",
    "#bd-send:disabled{opacity:.5;cursor:default;}",
    ".bd-typing span{display:inline-block;width:6px;height:6px;border-radius:50%;background:rgba(22,57,54,.45);margin-right:3px;animation:bdB 1.1s infinite;}",
    ".bd-typing span:nth-child(2){animation-delay:.18s;}.bd-typing span:nth-child(3){animation-delay:.36s;}",
    "@keyframes bdB{0%,60%,100%{transform:none;opacity:.4;}30%{transform:translateY(-4px);opacity:1;}}",
    "@media(max-width:480px){#bd-panel{position:fixed;right:8px;left:8px;bottom:86px;width:auto;height:60vh;}}",
  ].join("\n");

  var style = document.createElement("style");
  style.id = "bd-bot-css";
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- build DOM ---------- */
  var root = document.createElement("div");
  root.id = "bd-bot";
  root.innerHTML =
    '<button id="bd-fab" aria-label="Ask Bizdom Assistant" title="Ask the archive">' +
    '<svg class="bd-chat" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>' +
    '<svg class="bd-x" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
    "</button>" +
    '<div id="bd-panel" role="dialog" aria-label="Bizdom Assistant">' +
    '<div id="bd-head"><strong>Bizdom Assistant</strong><span>Ask the Indian business history archive</span></div>' +
    '<div id="bd-msgs"></div>' +
    '<div id="bd-chips">' +
    '<button class="bd-chip">How did Fevicol become iconic?</button>' +
    '<button class="bd-chip">Story of the Bombay Stock Exchange</button>' +
    '<button class="bd-chip">How did Essar begin?</button>' +
    "</div>" +
    '<form id="bd-form"><input id="bd-input" type="text" maxlength="1000" placeholder="Ask about Indian business history…" autocomplete="off"><button id="bd-send" type="submit" aria-label="Send"><svg viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></button></form>' +
    "</div>";
  document.body.appendChild(root);

  var msgs = root.querySelector("#bd-msgs");
  var input = root.querySelector("#bd-input");
  var sendBtn = root.querySelector("#bd-send");
  var history = [];
  var greeted = false;

  /* ---------- helpers ---------- */
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function render(text) {
    var html = esc(text);
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/(https?:\/\/[^\s<>"')]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    return html;
  }
  function scroll() { msgs.scrollTop = msgs.scrollHeight; }

  function addMsg(role, html, sources) {
    var div = document.createElement("div");
    div.className = "bd-msg " + role;
    div.innerHTML = html;
    if (sources && sources.length) {
      var s = document.createElement("span");
      s.className = "bd-src";
      s.innerHTML = sources.map(function (x) {
        return '<a href="' + x.url + '" target="_blank" rel="noopener">→ ' + esc(x.title) + "</a>";
      }).join("<br>");
      div.appendChild(s);
    }
    msgs.appendChild(div);
    scroll();
    return div;
  }

  /* ---------- chat ---------- */
  async function ask(text) {
    text = String(text || "").trim();
    if (!text) return;
    addMsg("user", esc(text));
    history.push({ role: "user", content: text });
    input.value = "";
    sendBtn.disabled = true;

    var typing = document.createElement("div");
    typing.className = "bd-msg bot bd-typing";
    typing.innerHTML = "<span></span><span></span><span></span>";
    msgs.appendChild(typing);
    scroll();

    try {
      var res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: history.slice(-6) }),
      });
      var data = await res.json();
      typing.remove();
      if (data && data.reply) {
        addMsg("bot", render(data.reply), data.sources);
        history.push({ role: "assistant", content: data.reply });
      } else {
        addMsg("bot", "Hmm, I couldn't reach the archive just now. Please try again.");
      }
    } catch (e) {
      typing.remove();
      addMsg("bot", "Network hiccup — please try again in a moment.");
    }
    sendBtn.disabled = false;
    input.focus();
  }

  /* ---------- wiring ---------- */
  root.querySelector("#bd-fab").addEventListener("click", function () {
    root.classList.toggle("open");
    if (root.classList.contains("open")) {
      if (!greeted) {
        greeted = true;
        addMsg(
          "bot",
          "Hello! I'm the Bizdom Assistant — trained on every story in TheBizdom archive. Ask me about Indian brands, business houses, markets or trade history."
        );
      }
      input.focus();
    }
  });
  root.querySelector("#bd-form").addEventListener("submit", function (e) {
    e.preventDefault();
    ask(input.value);
  });
  Array.prototype.forEach.call(root.querySelectorAll(".bd-chip"), function (chip) {
    chip.addEventListener("click", function () { ask(chip.textContent); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && root.classList.contains("open")) root.classList.remove("open");
  });
})();
