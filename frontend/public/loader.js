(function () {
  "use strict";

  /* ── CONFIG ────────────────────────────────────────────────────────────── */
  const SUPABASE_URL     = "https://fmwnswiwhgiofagqbkws.supabase.co"; // ← YOUR SUPABASE URL
  const SUPABASE_ANON    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtd25zd2l3aGdpb2ZhZ3Fia3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MzYwMDcsImV4cCI6MjA5NDExMjAwN30.ZlhvVGjfisF8P7tLCzCheHhgKwJjBT3S9E5gALv8ugU";               // ← YOUR ANON KEY
  const CURRENT_DOMAIN   = (document.currentScript && document.currentScript.getAttribute("data-domain"))
                           || window.location.hostname.replace(/^www\./, "");
  /* ─────────────────────────────────────────────────────────────────────── */

  if (!CURRENT_DOMAIN) return;

  /* ── FETCH CLIENT CONFIG FROM SUPABASE ─────────────────────────────────── */
  // Try clients table first, then personal_websites
  fetch(`${SUPABASE_URL}/rest/v1/clients?domain=eq.${encodeURIComponent(CURRENT_DOMAIN)}&select=*&limit=1`, {
    headers: {
      "apikey":        SUPABASE_ANON,
      "Authorization": `Bearer ${SUPABASE_ANON}`,
      "Content-Type":  "application/json"
    }
  })
  .then(r => r.json())
  .then(data => {
    if (data && data.length) {
      const client = data[0];
      if (!client.active) return;        /* Widget is off — do nothing */
      injectWidget(client);
    } else {
      // Try personal_websites table
      return fetch(`${SUPABASE_URL}/rest/v1/personal_websites?domain=eq.${encodeURIComponent(CURRENT_DOMAIN)}&select=*&limit=1`, {
        headers: {
          "apikey":        SUPABASE_ANON,
          "Authorization": `Bearer ${SUPABASE_ANON}`,
          "Content-Type":  "application/json"
        }
      }).then(r => r.json());
    }
  })
  .then(data => {
    if (data && data.length) {
      const client = data[0];
      if (!client.active) return;
      injectWidget(client);
    }
  })
  .catch(() => {}); /* Silent fail — never break the client's site */

  /* ── BUILD & INJECT WIDGET ─────────────────────────────────────────────── */
  function injectWidget(cfg) {
    const AGENCY   = cfg.agency_name    || "SwiftImpact Solutions";
    const CTA_URL  = cfg.cta_url        || "https://swiftimpactsolutions.com/ada";
    const DOMAIN   = cfg.domain         || CURRENT_DOMAIN;
    const COLOR    = cfg.primary_color  || "#007bff";
    const POS      = cfg.widget_position || "bottom-left";
    const PROFILES = cfg.enabled_profiles || {};
    const FEATURES = cfg.enabled_features || {};
    const NS       = "si";

    if (document.getElementById(`${NS}-aw-host`)) return;

    /* ── INLINE SVG CURSORS ─────────────────────────────────────────────── */
    const SVG_BLACK = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><polygon points='5,3 5,33 14,24 19,37 23,35 18,22 28,22' fill='#000' stroke='#fff' stroke-width='2' stroke-linejoin='round'/></svg>`;
    const SVG_WHITE = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><polygon points='5,3 5,33 14,24 19,37 23,35 18,22 28,22' fill='#fff' stroke='#000' stroke-width='2' stroke-linejoin='round'/></svg>`;
    const toCursor  = svg => `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}") 5 3, auto`;

    /* ── POSITION ───────────────────────────────────────────────────────── */
    const isRight  = POS === "bottom-right";
    const posStyle = isRight ? "bottom:24px;right:24px;" : "bottom:24px;left:24px;";
    const panelPos = isRight ? "right:0;" : "left:0;";

    /* ── STATE ──────────────────────────────────────────────────────────── */
    const S = {
      open: false, tab: "profiles",
      epilepsy: false, cognitive: false, adhd: false, blindness: false, visImpaired: false,
      cursor: null, contrast: null, textAlign: null,
      readableFont: false, dyslexia: false,
      highlightTitles: false, highlightLinks: false,
      stopAnimations: false, muteSounds: false,
      hideImages: false, virtualKeyboard: false,
      readingGuide: false, readingMask: false,
      fontSize: 100, lineHeight: 100, letterSpacing: 0,
      textColor: "", titleColor: "", bgColor: "",
    };

    /* ── SHADOW HOST ────────────────────────────────────────────────────── */
    const host = document.createElement("div");
    host.id = `${NS}-aw-host`;
    host.setAttribute("aria-label", "Accessibility Widget");
    host.style.cssText = `position:fixed;${posStyle}z-index:2147483647;`;
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });

    /* ── STYLES ─────────────────────────────────────────────────────────── */
    const STYLE = `
      *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
      :host { font-family:'Segoe UI',system-ui,sans-serif; font-size:15px; }
      #aw-trigger {
        width:56px; height:56px; border-radius:50%;
        background:${COLOR}; border:3px solid #fff;
        box-shadow:0 4px 18px rgba(0,0,0,.3);
        cursor:pointer; display:flex; align-items:center; justify-content:center;
        transition:transform .2s,box-shadow .2s; outline:none;
      }
      #aw-trigger:hover { transform:scale(1.08); }
      #aw-trigger:focus-visible { outline:3px solid #fff; outline-offset:3px; }
      #aw-trigger svg { width:30px; height:30px; fill:#fff; }
      #aw-panel {
        position:absolute; bottom:68px; ${panelPos}
        width:340px; max-height:78vh;
        background:#fff; border-radius:14px;
        box-shadow:0 8px 40px rgba(0,0,0,.22);
        display:flex; flex-direction:column; overflow:hidden;
        transform-origin:${isRight ? "bottom right" : "bottom left"};
        transition:transform .22s cubic-bezier(.4,0,.2,1),opacity .22s;
      }
      #aw-panel.aw-hidden { transform:scale(.88) translateY(10px); opacity:0; pointer-events:none; }
      #aw-cta {
        background:linear-gradient(135deg,#0056cc,${COLOR});
        padding:11px 14px; color:#fff; text-decoration:none;
        display:block; font-size:12px; line-height:1.45; text-align:center;
        transition:filter .2s;
      }
      #aw-cta:hover { filter:brightness(1.12); }
      #aw-cta strong { display:block; font-size:13px; }
      #aw-header {
        display:flex; align-items:center; justify-content:space-between;
        padding:13px 16px 10px; border-bottom:1px solid #e8e8e8;
      }
      #aw-header h2 { font-size:16px; font-weight:700; color:#1a1a1a; }
      #aw-close {
        background:none; border:none; cursor:pointer; padding:4px;
        border-radius:6px; color:#555; line-height:1; transition:background .15s;
      }
      #aw-close:hover { background:#f0f0f0; }
      #aw-close svg { width:18px; height:18px; fill:currentColor; }
      #aw-tabs { display:flex; border-bottom:1px solid #e8e8e8; padding:0 10px; }
      .aw-tab {
        flex:1; padding:9px 4px; font-size:12px; font-weight:600;
        text-align:center; cursor:pointer; border:none; background:none;
        color:#666; border-bottom:3px solid transparent; margin-bottom:-1px;
        transition:color .15s,border-color .15s; letter-spacing:.03em; text-transform:uppercase;
      }
      .aw-tab:hover { color:${COLOR}; }
      .aw-tab.active { color:${COLOR}; border-bottom-color:${COLOR}; }
      #aw-body { overflow-y:auto; flex:1; padding:14px 14px 6px; }
      #aw-body::-webkit-scrollbar { width:5px; }
      #aw-body::-webkit-scrollbar-thumb { background:#ccc; border-radius:4px; }
      .aw-pane { display:none; }
      .aw-pane.active { display:block; }
      .aw-section-label {
        font-size:10px; font-weight:700; letter-spacing:.08em;
        text-transform:uppercase; color:#999; margin:12px 0 8px;
      }
      .aw-section-label:first-child { margin-top:0; }
      .aw-profiles { display:flex; flex-direction:column; gap:7px; }
      .aw-profile-btn {
        display:flex; align-items:flex-start; gap:10px;
        background:#f7f8fa; border:2px solid #e2e2e2;
        border-radius:10px; padding:10px 12px; cursor:pointer;
        text-align:left; transition:border-color .15s,background .15s; width:100%;
      }
      .aw-profile-btn:hover { border-color:${COLOR}; background:#eef5ff; }
      .aw-profile-btn.active { border-color:${COLOR}; background:#ddeeff; }
      .aw-profile-btn .icon { font-size:20px; flex-shrink:0; margin-top:1px; }
      .aw-profile-btn .info strong { display:block; font-size:13px; color:#1a1a1a; margin-bottom:2px; }
      .aw-profile-btn .info span { font-size:11px; color:#666; line-height:1.4; }
      .aw-grid { display:grid; grid-template-columns:1fr 1fr; gap:7px; }
      .aw-btn {
        display:flex; flex-direction:column; align-items:center; justify-content:center;
        gap:5px; padding:10px 6px; background:#f7f8fa;
        border:2px solid #e2e2e2; border-radius:10px; cursor:pointer;
        font-size:11px; font-weight:600; color:#444; text-align:center;
        transition:border-color .15s,background .15s,color .15s; line-height:1.3;
      }
      .aw-btn .bicon { font-size:20px; }
      .aw-btn:hover { border-color:${COLOR}; background:#eef5ff; color:${COLOR}; }
      .aw-btn.active { border-color:${COLOR}; background:#ddeeff; color:${COLOR}; }
      .aw-slider-row { margin-bottom:10px; }
      .aw-slider-row label {
        display:flex; justify-content:space-between; align-items:center;
        font-size:12px; font-weight:600; color:#444; margin-bottom:5px;
      }
      .aw-slider-row label span { color:${COLOR}; font-weight:700; font-size:13px; }
      .aw-slider-row input[type=range] { width:100%; accent-color:${COLOR}; height:5px; cursor:pointer; }
      .aw-slider-row .aw-slider-btns { display:flex; gap:6px; margin-top:5px; }
      .aw-slider-row .aw-slider-btns button {
        flex:1; padding:4px; font-size:12px; font-weight:700;
        border:2px solid #e2e2e2; border-radius:6px; background:#f7f8fa;
        cursor:pointer; transition:border-color .15s,background .15s;
      }
      .aw-slider-row .aw-slider-btns button:hover { border-color:${COLOR}; background:#eef5ff; }
      .aw-color-row {
        display:flex; align-items:center; justify-content:space-between;
        margin-bottom:9px; font-size:12px; font-weight:600; color:#444;
      }
      .aw-color-row input[type=color] {
        width:44px; height:28px; border:2px solid #e2e2e2;
        border-radius:6px; padding:1px; cursor:pointer; background:none;
      }
      .aw-color-row button {
        font-size:10px; padding:3px 7px; border:1px solid #ccc;
        border-radius:5px; background:#f7f8fa; cursor:pointer; color:#666;
      }
      .aw-color-row button:hover { border-color:${COLOR}; color:${COLOR}; }
      .aw-align-row { display:flex; gap:7px; }
      .aw-align-btn {
        flex:1; padding:8px; background:#f7f8fa; border:2px solid #e2e2e2;
        border-radius:8px; cursor:pointer; font-size:18px; text-align:center;
        transition:border-color .15s,background .15s;
      }
      .aw-align-btn:hover { border-color:${COLOR}; background:#eef5ff; }
      .aw-align-btn.active { border-color:${COLOR}; background:#ddeeff; }
      #aw-vkb {
        position:fixed; bottom:0; left:0; right:0;
        background:#2a2a2a; padding:10px; z-index:2147483646;
        display:none; flex-direction:column; gap:6px;
        box-shadow:0 -4px 20px rgba(0,0,0,.4);
      }
      #aw-vkb.visible { display:flex; }
      .aw-kb-row { display:flex; gap:5px; justify-content:center; flex-wrap:wrap; }
      .aw-key {
        min-width:34px; padding:8px 10px; background:#444; color:#fff;
        border:none; border-radius:6px; cursor:pointer; font-size:13px; font-weight:600;
      }
      .aw-key:hover { background:${COLOR}; }
      .aw-key.wide { min-width:70px; }
      .aw-key.wider { min-width:120px; }
      #aw-vkb-close {
        position:absolute; top:8px; right:12px;
        background:#555; color:#fff; border:none; border-radius:5px;
        padding:4px 10px; cursor:pointer; font-size:12px;
      }
      #aw-rguide {
        position:fixed; left:0; right:0; height:3px;
        background:rgba(0,123,255,.5); pointer-events:none; display:none; z-index:2147483645;
      }
      #aw-rmask-top, #aw-rmask-bot {
        position:fixed; left:0; right:0; background:rgba(0,0,0,.65);
        pointer-events:none; display:none; z-index:2147483644;
      }
      #aw-footer {
        border-top:1px solid #e8e8e8; padding:10px 14px;
        display:flex; align-items:center; justify-content:space-between; gap:8px; flex-shrink:0;
      }
      #aw-reset {
        flex:1; padding:8px 10px; background:#fff3f3; border:2px solid #f66;
        border-radius:8px; color:#c00; font-size:12px; font-weight:700; cursor:pointer;
      }
      #aw-reset:hover { background:#ffe0e0; }
      #aw-powered { font-size:10px; color:#aaa; text-align:right; line-height:1.4; flex-shrink:0; }
      #aw-powered a { color:${COLOR}; text-decoration:none; font-weight:600; }
      #aw-powered a:hover { text-decoration:underline; }
    `;

    const CLOSE_IC = `<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>`;
    const ACCESS_IC = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="4" r="2"/><path d="M19 9H5l2 9h10l2-9zM12 18v3m-3-6l-1 6m7-6l1 6" stroke="white" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>`;

    const tmpl = document.createElement("template");
    tmpl.innerHTML = `
<style>${STYLE}</style>
<div id="aw-rguide"></div>
<div id="aw-rmask-top"></div>
<div id="aw-rmask-bot"></div>
<div id="aw-vkb" role="toolbar" aria-label="Virtual Keyboard">
  <button id="aw-vkb-close">✕ Close Keyboard</button>
  <div class="aw-kb-row">
    ${"`~1!2@3#4$5%6^7&8*9(0)-_=+".split("").map(k=>`<button class="aw-key" data-k="${k}">${k}</button>`).join("")}
    <button class="aw-key wide" data-k="Backspace">⌫</button>
  </div>
  <div class="aw-kb-row">
    <button class="aw-key wide" data-k="Tab">Tab</button>
    ${"qwertyuiop[]\\".split("").map(k=>`<button class="aw-key" data-k="${k}">${k.toUpperCase()}</button>`).join("")}
  </div>
  <div class="aw-kb-row">
    <button class="aw-key wide" data-k="CapsLock">Caps</button>
    ${"asdfghjkl;'".split("").map(k=>`<button class="aw-key" data-k="${k}">${k.toUpperCase()}</button>`).join("")}
    <button class="aw-key wide" data-k="Enter">Enter</button>
  </div>
  <div class="aw-kb-row">
    <button class="aw-key wider" data-k="Shift">Shift</button>
    ${"zxcvbnm,./".split("").map(k=>`<button class="aw-key" data-k="${k}">${k.toUpperCase()}</button>`).join("")}
    <button class="aw-key wider" data-k="Shift">Shift</button>
  </div>
  <div class="aw-kb-row">
    <button class="aw-key wide" data-k="Control">Ctrl</button>
    <button class="aw-key wide" data-k="Alt">Alt</button>
    <button class="aw-key" style="min-width:180px" data-k=" ">Space</button>
    <button class="aw-key wide" data-k="ArrowLeft">◀</button>
    <button class="aw-key wide" data-k="ArrowRight">▶</button>
  </div>
</div>
<button id="aw-trigger" aria-label="Open Accessibility Menu" aria-expanded="false" aria-haspopup="dialog">
  ${ACCESS_IC}
</button>
<div id="aw-panel" class="aw-hidden" role="dialog" aria-modal="true" aria-label="Accessibility Menu">
  <a id="aw-cta" href="${CTA_URL}" target="_blank" rel="noopener noreferrer">
    <strong>♿ Accessibility Services by ${AGENCY}</strong>
    Get a free ADA audit for ${DOMAIN}
  </a>
  <div id="aw-header">
    <h2>Accessibility Menu</h2>
    <button id="aw-close" aria-label="Close">${CLOSE_IC}</button>
  </div>
  <div id="aw-tabs" role="tablist">
    <button class="aw-tab active" data-tab="profiles" role="tab" aria-selected="true">Profiles</button>
    <button class="aw-tab" data-tab="content" role="tab" aria-selected="false">Content</button>
    <button class="aw-tab" data-tab="visual" role="tab" aria-selected="false">Visual</button>
  </div>
  <div id="aw-body">
    <div class="aw-pane active" data-pane="profiles">
      <p class="aw-section-label">Disability Profiles</p>
      <div class="aw-profiles">
        <button class="aw-profile-btn${PROFILES.epilepsy?' active':''}" data-profile="epilepsy"><span class="icon">⚡</span><span class="info"><strong>Epilepsy Safe</strong><span>Stops flashing animations & flickering content.</span></span></button>
        <button class="aw-profile-btn${PROFILES.cognitive?' active':''}" data-profile="cognitive"><span class="icon">🧩</span><span class="info"><strong>Cognitive Disability</strong><span>Simplifies layout and boosts readability.</span></span></button>
        <button class="aw-profile-btn${PROFILES.adhd?' active':''}" data-profile="adhd"><span class="icon">🎯</span><span class="info"><strong>ADHD Friendly</strong><span>Highlights focus areas, reduces distractions.</span></span></button>
        <button class="aw-profile-btn${PROFILES.blindness?' active':''}" data-profile="blindness"><span class="icon">🦯</span><span class="info"><strong>Blindness Mode</strong><span>Optimizes for screen readers.</span></span></button>
        <button class="aw-profile-btn${PROFILES.visImpaired?' active':''}" data-profile="visImpaired"><span class="icon">👁️</span><span class="info"><strong>Visually Impaired</strong><span>Large text, high contrast, magnified cursor.</span></span></button>
      </div>
    </div>
    <div class="aw-pane" data-pane="content">
      <p class="aw-section-label">Orientation</p>
      <div class="aw-grid">
        <button class="aw-btn" data-toggle="cursor" data-val="black"><span class="bicon">🖱️</span>Big Black Cursor</button>
        <button class="aw-btn" data-toggle="cursor" data-val="white"><span class="bicon">🖱️</span>Big White Cursor</button>
        <button class="aw-btn${FEATURES.readingGuide?' active':''}" data-toggle="readingGuide"><span class="bicon">📏</span>Reading Guide</button>
        <button class="aw-btn${FEATURES.readingMask?' active':''}" data-toggle="readingMask"><span class="bicon">🎭</span>Reading Mask</button>
      </div>
      <p class="aw-section-label">Content Tools</p>
      <div class="aw-grid">
        <button class="aw-btn${FEATURES.readableFont?' active':''}" data-toggle="readableFont"><span class="bicon">🔤</span>Readable Font</button>
        <button class="aw-btn${FEATURES.dyslexia?' active':''}" data-toggle="dyslexia"><span class="bicon">📖</span>Dyslexia Friendly</button>
        <button class="aw-btn${FEATURES.highlightTitles?' active':''}" data-toggle="highlightTitles"><span class="bicon">🔆</span>Highlight Titles</button>
        <button class="aw-btn${FEATURES.highlightLinks?' active':''}" data-toggle="highlightLinks"><span class="bicon">🔗</span>Highlight Links</button>
        <button class="aw-btn${FEATURES.stopAnimations?' active':''}" data-toggle="stopAnimations"><span class="bicon">⏸️</span>Stop Animations</button>
        <button class="aw-btn${FEATURES.muteSounds?' active':''}" data-toggle="muteSounds"><span class="bicon">🔇</span>Mute Sounds</button>
        <button class="aw-btn${FEATURES.hideImages?' active':''}" data-toggle="hideImages"><span class="bicon">🚫</span>Hide Images</button>
        <button class="aw-btn${FEATURES.virtualKeyboard?' active':''}" data-toggle="virtualKeyboard"><span class="bicon">⌨️</span>Virtual Keyboard</button>
      </div>
      <p class="aw-section-label">Text Alignment</p>
      <div class="aw-align-row">
        <button class="aw-align-btn" data-align="left" aria-label="Align Left">&#8676;</button>
        <button class="aw-align-btn" data-align="center" aria-label="Align Center">&#8644;</button>
        <button class="aw-align-btn" data-align="right" aria-label="Align Right">&#8677;</button>
      </div>
      <p class="aw-section-label" style="margin-top:14px;">Size &amp; Spacing</p>
      <div class="aw-slider-row">
        <label>Font Size <span id="val-fontSize">100%</span></label>
        <input type="range" id="sl-fontSize" min="75" max="200" step="5" value="100" aria-label="Font size">
        <div class="aw-slider-btns"><button data-sl="fontSize" data-d="-5">− Decrease</button><button data-sl="fontSize" data-d="5">+ Increase</button></div>
      </div>
      <div class="aw-slider-row">
        <label>Line Height <span id="val-lineHeight">100%</span></label>
        <input type="range" id="sl-lineHeight" min="100" max="250" step="10" value="100" aria-label="Line height">
        <div class="aw-slider-btns"><button data-sl="lineHeight" data-d="-10">− Decrease</button><button data-sl="lineHeight" data-d="10">+ Increase</button></div>
      </div>
      <div class="aw-slider-row">
        <label>Letter Spacing <span id="val-letterSpacing">0px</span></label>
        <input type="range" id="sl-letterSpacing" min="0" max="10" step="1" value="0" aria-label="Letter spacing">
        <div class="aw-slider-btns"><button data-sl="letterSpacing" data-d="-1">− Decrease</button><button data-sl="letterSpacing" data-d="1">+ Increase</button></div>
      </div>
    </div>
    <div class="aw-pane" data-pane="visual">
      <p class="aw-section-label">Contrast Modes (mutually exclusive)</p>
      <div class="aw-grid">
        <button class="aw-btn" data-toggle="contrast" data-val="dark"><span class="bicon">🌑</span>Dark Contrast</button>
        <button class="aw-btn" data-toggle="contrast" data-val="mono"><span class="bicon">◑</span>Monochrome</button>
        <button class="aw-btn" data-toggle="contrast" data-val="highSat"><span class="bicon">🎨</span>High Saturation</button>
        <button class="aw-btn" data-toggle="contrast" data-val="lowSat"><span class="bicon">🩶</span>Low Saturation</button>
      </div>
      <p class="aw-section-label">Color Adjustments</p>
      <div class="aw-color-row"><span>Text Color</span><input type="color" id="cp-text" value="#000000" aria-label="Text color"><button data-cp-reset="text">Reset</button></div>
      <div class="aw-color-row"><span>Title Color</span><input type="color" id="cp-title" value="#000000" aria-label="Title color"><button data-cp-reset="title">Reset</button></div>
      <div class="aw-color-row"><span>Background</span><input type="color" id="cp-bg" value="#ffffff" aria-label="Background color"><button data-cp-reset="bg">Reset</button></div>
    </div>
  </div>
  <div id="aw-footer">
    <button id="aw-reset">↺ Reset All Settings</button>
    <div id="aw-powered">Powered by<br><a href="${CTA_URL}" target="_blank" rel="noopener">${AGENCY}</a></div>
  </div>
</div>`;

    shadow.appendChild(tmpl.content.cloneNode(true));

    const $  = sel => shadow.querySelector(sel);
    const $$ = sel => shadow.querySelectorAll(sel);
    const panel    = $("#aw-panel");
    const trigger  = $("#aw-trigger");
    const closeBtn = $("#aw-close");
    const rguide   = $("#aw-rguide");
    const rmaskTop = $("#aw-rmask-top");
    const rmaskBot = $("#aw-rmask-bot");
    const vkb      = $("#aw-vkb");

    const pageStyle = document.createElement("style");
    pageStyle.id = `${NS}-aw-page-style`;
    document.head.appendChild(pageStyle);

    const PROFILE_EFFECTS = {
      epilepsy:   () => { applyToggle("stopAnimations", true); },
      cognitive:  () => { applyToggle("readableFont", true); S.fontSize = Math.max(S.fontSize, 110); applySliders(); },
      adhd:       () => { applyToggle("readingGuide", true); applyToggle("highlightLinks", true); },
      blindness:  () => { applyToggle("hideImages", true); applyToggle("highlightTitles", true); applyToggle("highlightLinks", true); },
      visImpaired:() => { S.fontSize = Math.max(S.fontSize, 125); applySliders(); applyContrast("dark"); S.cursor = "black"; applyCursor(); },
    };

    function renderPageCSS() {
      const rules = [];
      if (S.readableFont)    rules.push(`body,body *{font-family:'Georgia',serif!important;}`);
      if (S.dyslexia)        rules.push(`@import url('https://fonts.googleapis.com/css2?family=Lexend&display=swap');body,body *{font-family:'Lexend',sans-serif!important;letter-spacing:.06em!important;word-spacing:.18em!important;}`);
      if (S.highlightTitles) rules.push(`h1,h2,h3,h4,h5,h6{background:rgba(0,123,255,.15)!important;border-left:4px solid ${COLOR}!important;padding-left:6px!important;}`);
      if (S.highlightLinks)  rules.push(`a{background:rgba(255,200,0,.25)!important;outline:2px solid #cc8800!important;}`);
      if (S.stopAnimations)  rules.push(`*,*::before,*::after{animation:none!important;transition:none!important;}`);
      if (S.hideImages)      rules.push(`img,picture,figure,video,canvas{visibility:hidden!important;}`);
      if (S.contrast==="dark")    rules.push(`html{filter:invert(1) hue-rotate(180deg)!important;}img,video,canvas{filter:invert(1) hue-rotate(180deg)!important;}`);
      if (S.contrast==="mono")    rules.push(`html{filter:grayscale(1)!important;}`);
      if (S.contrast==="highSat") rules.push(`html{filter:saturate(3)!important;}`);
      if (S.contrast==="lowSat")  rules.push(`html{filter:saturate(.3)!important;}`);
      if (S.textAlign)  rules.push(`body,body *{text-align:${S.textAlign}!important;}`);
      if (S.textColor)  rules.push(`body,p,li,td,span{color:${S.textColor}!important;}`);
      if (S.titleColor) rules.push(`h1,h2,h3,h4,h5,h6{color:${S.titleColor}!important;}`);
      if (S.bgColor)    rules.push(`body{background-color:${S.bgColor}!important;}`);
      pageStyle.textContent = rules.join("\n");
    }

    function applySliders() {
      const fs=S.fontSize, lh=S.lineHeight, ls=S.letterSpacing;
      let h="";
      if(fs!==100) h+=`font-size:${fs}%!important;`;
      if(lh!==100) h+=`line-height:${lh/100}!important;`;
      if(ls!==0)   h+=`letter-spacing:${ls}px!important;`;
      document.documentElement.style.cssText=h;
      const fsEl=$("#val-fontSize"),lhEl=$("#val-lineHeight"),lsEl=$("#val-letterSpacing");
      if(fsEl) fsEl.textContent=fs+"%";
      if(lhEl) lhEl.textContent=lh+"%";
      if(lsEl) lsEl.textContent=ls+"px";
      const slFs=$("#sl-fontSize"),slLh=$("#sl-lineHeight"),slLs=$("#sl-letterSpacing");
      if(slFs) slFs.value=fs;
      if(slLh) slLh.value=lh;
      if(slLs) slLs.value=ls;
    }

    function applyCursor() {
      if(S.cursor==="black") document.body.style.cursor=toCursor(SVG_BLACK);
      else if(S.cursor==="white") document.body.style.cursor=toCursor(SVG_WHITE);
      else document.body.style.cursor="";
      $$(".aw-btn[data-toggle='cursor']").forEach(b=>b.classList.toggle("active",b.dataset.val===S.cursor));
    }

    function applyContrast(val) {
      S.contrast=(S.contrast===val)?null:val;
      $$(".aw-btn[data-toggle='contrast']").forEach(b=>b.classList.toggle("active",b.dataset.val===S.contrast));
      renderPageCSS();
    }

    function applyToggle(key,forceOn) {
      if(forceOn!==undefined) S[key]=forceOn;
      else S[key]=!S[key];
      const btn=$(`[data-toggle='${key}']`);
      if(btn) btn.classList.toggle("active",S[key]);
      if(key==="readingGuide") rguide.style.display=S.readingGuide?"block":"none";
      if(key==="readingMask")  { rmaskTop.style.display=S.readingMask?"block":"none"; rmaskBot.style.display=S.readingMask?"block":"none"; }
      if(key==="muteSounds")   document.querySelectorAll("audio,video").forEach(m=>m.muted=S.muteSounds);
      if(key==="virtualKeyboard") vkb.classList.toggle("visible",S.virtualKeyboard);
      renderPageCSS();
    }

    document.addEventListener("mousemove",e=>{
      if(S.readingGuide){rguide.style.top=(e.clientY-1)+"px";rguide.style.display="block";}
      if(S.readingMask){const h=60;rmaskTop.style.top="0";rmaskTop.style.height=Math.max(0,e.clientY-h)+"px";rmaskBot.style.top=(e.clientY+h)+"px";rmaskBot.style.bottom="0";rmaskBot.style.height="auto";}
    });

    function openPanel()  { S.open=true;  panel.classList.remove("aw-hidden"); trigger.setAttribute("aria-expanded","true");  closeBtn.focus(); }
    function closePanel() { S.open=false; panel.classList.add("aw-hidden");    trigger.setAttribute("aria-expanded","false"); trigger.focus(); }

    trigger.addEventListener("click",()=>S.open?closePanel():openPanel());
    closeBtn.addEventListener("click",closePanel);
    document.addEventListener("click",e=>{ if(S.open&&!host.contains(e.target)) closePanel(); });
    document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&S.open) closePanel(); });

    $$(".aw-tab").forEach(tab=>{
      tab.addEventListener("click",()=>{
        S.tab=tab.dataset.tab;
        $$(".aw-tab").forEach(t=>{t.classList.remove("active");t.setAttribute("aria-selected","false");});
        tab.classList.add("active");tab.setAttribute("aria-selected","true");
        $$(".aw-pane").forEach(p=>p.classList.remove("active"));
        $(`[data-pane="${S.tab}"]`).classList.add("active");
      });
    });

    $$(".aw-profile-btn").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const key=btn.dataset.profile;
        S[key]=!S[key];
        btn.classList.toggle("active",S[key]);
        if(S[key]&&PROFILE_EFFECTS[key]) PROFILE_EFFECTS[key]();
        renderPageCSS();
      });
    });

    shadow.addEventListener("click",e=>{
      const btn=e.target.closest("[data-toggle]");
      if(!btn) return;
      const toggle=btn.dataset.toggle,val=btn.dataset.val;
      if(toggle==="cursor"){S.cursor=(S.cursor===val)?null:val;applyCursor();return;}
      if(toggle==="contrast"){applyContrast(val);return;}
      applyToggle(toggle);
    });

    $$(".aw-align-btn").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const a=btn.dataset.align;
        S.textAlign=(S.textAlign===a)?null:a;
        $$(".aw-align-btn").forEach(b=>b.classList.toggle("active",b.dataset.align===S.textAlign));
        renderPageCSS();
      });
    });

    [["fontSize"],["lineHeight"],["letterSpacing"]].forEach(([key])=>{
      const sl=$(`#sl-${key}`);
      if(!sl) return;
      sl.addEventListener("input",()=>{S[key]=parseFloat(sl.value);applySliders();});
    });

    shadow.addEventListener("click",e=>{
      const btn=e.target.closest("[data-sl]");
      if(!btn) return;
      const key=btn.dataset.sl,d=parseFloat(btn.dataset.d);
      const sl=$(`#sl-${key}`);
      S[key]=Math.min(parseFloat(sl.max),Math.max(parseFloat(sl.min),S[key]+d));
      applySliders();
    });

    [["cp-text","textColor"],["cp-title","titleColor"],["cp-bg","bgColor"]].forEach(([id,key])=>{
      const inp=$(`#${id}`);
      if(!inp) return;
      inp.addEventListener("input",()=>{S[key]=inp.value;renderPageCSS();});
    });

    shadow.addEventListener("click",e=>{
      const btn=e.target.closest("[data-cp-reset]");
      if(!btn) return;
      const map={text:"textColor",title:"titleColor",bg:"bgColor"};
      const idMap={text:"cp-text",title:"cp-title",bg:"cp-bg"};
      const key=btn.getAttribute("data-cp-reset");
      S[map[key]]="";
      const inp=$(`#${idMap[key]}`);
      if(inp) inp.value=(key==="bg")?"#ffffff":"#000000";
      renderPageCSS();
    });

    vkb.addEventListener("click",e=>{
      const key=e.target.closest("[data-k]");
      if(!key) return;
      const k=key.dataset.k;
      const focused=document.activeElement;
      if(focused&&(focused.tagName==="INPUT"||focused.tagName==="TEXTAREA")){
        const start=focused.selectionStart,end=focused.selectionEnd;
        if(k==="Backspace"){focused.value=focused.value.slice(0,Math.max(0,start-1))+focused.value.slice(end);focused.selectionStart=focused.selectionEnd=Math.max(0,start-1);}
        else if(k==="Enter"){focused.value=focused.value.slice(0,start)+"\n"+focused.value.slice(end);focused.selectionStart=focused.selectionEnd=start+1;}
        else if(k==="Tab"){focused.value=focused.value.slice(0,start)+"\t"+focused.value.slice(end);focused.selectionStart=focused.selectionEnd=start+1;}
        else if(k.length===1||k===" "){focused.value=focused.value.slice(0,start)+k+focused.value.slice(end);focused.selectionStart=focused.selectionEnd=start+1;}
      }
    });

    $("#aw-vkb-close").addEventListener("click",()=>{
      S.virtualKeyboard=false;
      vkb.classList.remove("visible");
      const b=$("[data-toggle='virtualKeyboard']");
      if(b) b.classList.remove("active");
    });

    $("#aw-reset").addEventListener("click",()=>{
      Object.assign(S,{
        epilepsy:false,cognitive:false,adhd:false,blindness:false,visImpaired:false,
        cursor:null,contrast:null,textAlign:null,
        readableFont:false,dyslexia:false,highlightTitles:false,highlightLinks:false,
        stopAnimations:false,muteSounds:false,hideImages:false,virtualKeyboard:false,
        readingGuide:false,readingMask:false,
        fontSize:100,lineHeight:100,letterSpacing:0,
        textColor:"",titleColor:"",bgColor:"",
      });
      pageStyle.textContent="";
      document.documentElement.style.cssText="";
      document.body.style.cursor="";
      document.querySelectorAll("audio,video").forEach(m=>m.muted=false);
      rguide.style.display="none";
      rmaskTop.style.display="none";
      rmaskBot.style.display="none";
      vkb.classList.remove("visible");
      $$(".aw-profile-btn,.aw-btn,.aw-align-btn").forEach(b=>b.classList.remove("active"));
      applySliders();
      const cpT=$("#cp-text"),cpH=$("#cp-title"),cpB=$("#cp-bg");
      if(cpT) cpT.value="#000000";
      if(cpH) cpH.value="#000000";
      if(cpB) cpB.value="#ffffff";
    });

    /* Apply any default features that were pre-enabled in Supabase config */
    Object.keys(FEATURES).forEach(key=>{ if(FEATURES[key]) applyToggle(key,true); });
    Object.keys(PROFILES).forEach(key=>{ if(PROFILES[key]&&PROFILE_EFFECTS[key]) PROFILE_EFFECTS[key](); });
    renderPageCSS();
  }

})();
