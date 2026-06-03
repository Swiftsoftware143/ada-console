(function () {
  "use strict";
  
  console.log('[ADA] Loader v2.1 starting...');

  /* ── CONFIG ────────────────────────────────────────────────────────────── */
  const SUPABASE_URL     = "https://fmwnswiwhgiofagqbkws.supabase.co";
  const SUPABASE_ANON    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtd25zd2l3aGdpb2ZhZ3Fia3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MzYwMDcsImV4cCI6MjA5NDExMjAwN30.ZlhvVGjfisF8P7tLCzCheHhgKwJjBT3S9E5gALv8ugU";
  const CURRENT_DOMAIN   = (document.currentScript && document.currentScript.getAttribute("data-domain"))
                           || window.location.hostname.replace(/^www\./, "");
  
  // Extract root domain for subdomain matching
  const ROOT_DOMAIN = CURRENT_DOMAIN.split('.').slice(-2).join('.');
  
  console.log('[ADA] Domain detected:', CURRENT_DOMAIN);
  console.log('[ADA] Root domain:', ROOT_DOMAIN);
  /* ─────────────────────────────────────────────────────────────────────── */

  if (!CURRENT_DOMAIN) {
    console.log('[ADA] No domain detected, exiting');
    return;
  }

  // Count pages on the current site
  async function countPages() {
    try {
      // Method 1: Count unique links on the current page
      const links = Array.from(document.querySelectorAll('a[href]'));
      const internalLinks = links.filter(link => {
        try {
          const url = new URL(link.href);
          return url.hostname === window.location.hostname;
        } catch {
          return false;
        }
      });
      
      // Get unique paths
      const uniquePaths = new Set(internalLinks.map(link => {
        try {
          return new URL(link.href).pathname;
        } catch {
          return link.pathname;
        }
      }));
      
      // Estimate total pages (internal links + current page)
      const estimatedPages = uniquePaths.size + 1;
      
      console.log('[ADA] Estimated pages:', estimatedPages);
      return estimatedPages;
    } catch (e) {
      console.log('[ADA] Could not count pages:', e);
      return 1; // Default to 1 page
    }
  }

  // Determine plan based on page count and admin settings
  function determinePlan(pageCount, planSettings) {
    const settings = planSettings || {
      basic_max: 5,
      starter_max: 25,
      pro_max: 100,
      growth_max: 500
    };
    
    if (pageCount <= settings.basic_max) return 'basic';
    if (pageCount <= settings.starter_max) return 'starter';
    if (pageCount <= settings.pro_max) return 'pro';
    if (pageCount <= settings.growth_max) return 'growth';
    return 'enterprise';
  }

  /* ── FETCH CLIENT CONFIG FROM SUPABASE ─────────────────────────────────── */
  async function loadWidget() {
    // Build domain filter - try exact domain match first, then root domain
    const domainFilter = `domain=eq.${encodeURIComponent(CURRENT_DOMAIN)}`;
    const rootDomainFilter = `domain=eq.${encodeURIComponent(ROOT_DOMAIN)}`;
    
    try {
      console.log('[ADA] Fetching client for domain:', CURRENT_DOMAIN);
      
      // Fetch client config - try exact domain first
      let clientRes = await fetch(`${SUPABASE_URL}/rest/v1/clients?${domainFilter}&select=*&limit=1`, {
        headers: {
          "apikey": SUPABASE_ANON,
          "Authorization": `Bearer ${SUPABASE_ANON}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!clientRes.ok) {
        console.log('[ADA] Client query failed, status:', clientRes.status);
      }
      
      let clientData = await clientRes.json();
      
      // Check if response is an error
      if (clientData && (clientData.error || clientData.message || clientData.code)) {
        console.error('[ADA] Supabase error:', clientData);
        clientData = []; // Reset to empty array on error
      }
      
      console.log('[ADA] Client data:', clientData);
      
      // If not found, try root domain
      if (!clientData || clientData.length === 0) {
        console.log('[ADA] Trying root domain:', ROOT_DOMAIN);
        clientRes = await fetch(`${SUPABASE_URL}/rest/v1/clients?${rootDomainFilter}&select=*&limit=1`, {
          headers: {
            "apikey": SUPABASE_ANON,
            "Authorization": `Bearer ${SUPABASE_ANON}`,
            "Content-Type": "application/json"
          }
        });
        clientData = await clientRes.json();
      }
      
      // If not found in clients, try personal_websites
      if (!clientData || clientData.length === 0) {
        console.log('[ADA] Trying personal_websites table...');
        let personalRes = await fetch(`${SUPABASE_URL}/rest/v1/personal_websites?${domainFilter}&select=*&limit=1`, {
          headers: {
            "apikey": SUPABASE_ANON,
            "Authorization": `Bearer ${SUPABASE_ANON}`,
            "Content-Type": "application/json"
          }
        });
        
        if (!personalRes.ok) {
          console.log('[ADA] Personal websites query failed, status:', personalRes.status);
        }
        
        clientData = await personalRes.json();
        
        // Check if response is an error
        if (clientData && (clientData.error || clientData.message || clientData.code)) {
          console.error('[ADA] Supabase error (personal):', clientData);
          clientData = [];
        }
        
        // Try root domain for personal_websites too
        if (!clientData || clientData.length === 0) {
          personalRes = await fetch(`${SUPABASE_URL}/rest/v1/personal_websites?${rootDomainFilter}&select=*&limit=1`, {
            headers: {
              "apikey": SUPABASE_ANON,
              "Authorization": `Bearer ${SUPABASE_ANON}`,
              "Content-Type": "application/json"
            }
          });
          clientData = await personalRes.json();
        }
      }
      
      if (!clientData || clientData.length === 0) {
        console.log('[ADA] No client found for domain:', CURRENT_DOMAIN);
        return;
      }
      
      // Handle case where response might be an error object
      if (clientData.error || clientData.message) {
        console.error('[ADA] API error:', clientData);
        return;
      }
      
      const client = clientData[0];
      if (!client) {
        console.error('[ADA] Client data is empty');
        return;
      }
      
      console.log('[ADA] Client found:', client.name || 'Unknown', 'Active:', client.active);
      
      if (!client.active) {
        console.log('[ADA] Client inactive, not loading widget');
        return;
      }
      
      // Fetch plan settings from admin
      let planSettings = null;
      try {
        const settingsRes = await fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.plan_config&select=value&limit=1`, {
          headers: {
            "apikey": SUPABASE_ANON,
            "Authorization": `Bearer ${SUPABASE_ANON}`,
            "Content-Type": "application/json"
          }
        });
        
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          planSettings = settingsData?.[0]?.value ? JSON.parse(settingsData[0].value) : null;
        }
      } catch (e) {
        console.log('[ADA] Could not load plan settings, using defaults');
      }
      
      // Count pages and determine dynamic plan
      const pageCount = await countPages();
      const detectedPlan = determinePlan(pageCount, planSettings);
      
      console.log('[ADA] Pages detected:', pageCount, 'Plan:', detectedPlan);
      
      // Use detected plan or client's assigned plan (whichever is higher)
      const finalPlan = getHigherPlan(client.plan_tier, detectedPlan);
      
      // Update client record with detected plan (only if personal_websites table)
      if (client.table === 'personal_websites') {
        try {
          await fetch(`${SUPABASE_URL}/rest/v1/personal_websites?id=eq.${client.id}`, {
            method: 'PATCH',
            headers: {
              "apikey": SUPABASE_ANON,
              "Authorization": `Bearer ${SUPABASE_ANON}`,
              "Content-Type": "application/json",
              "Prefer": "return=minimal"
            },
            body: JSON.stringify({
              detected_plan: detectedPlan,
              page_count: pageCount,
              detected_at: new Date().toISOString()
            })
          });
        } catch (e) {
          console.log('[ADA] Could not update client record');
        }
      }
      
      // Inject widget with final plan
      injectWidget(client, finalPlan, pageCount);
      
    } catch (err) {
      console.error('[ADA] Error loading widget:', err);
    }
  }
  
  // Plan hierarchy for comparison
  const PLAN_HIERARCHY = {
    'basic': 1,
    'starter': 2,
    'pro': 3,
    'growth': 4,
    'enterprise': 5
  };
  
  function getHigherPlan(plan1, plan2) {
    const p1 = PLAN_HIERARCHY[plan1] || 1;
    const p2 = PLAN_HIERARCHY[plan2] || 1;
    return p1 >= p2 ? plan1 : plan2;
  }

  /* ── BUILD & INJECT WIDGET ─────────────────────────────────────────────── */
  function injectWidget(cfg, planTier, pageCount) {
    console.log('[ADA] Injecting widget for:', cfg.name, 'Plan:', planTier, 'Pages:', pageCount);
    
    const AGENCY   = cfg.agency_name    || "SwiftImpact Solutions";
    const CTA_URL  = cfg.cta_url        || "https://swiftimpactsolutions.com/ada";
    const DOMAIN   = cfg.domain         || CURRENT_DOMAIN;
    const COLOR    = cfg.primary_color  || "#007bff";
    const POS      = cfg.widget_position || "bottom-left";
    const PROFILES = cfg.enabled_profiles || {};
    const FEATURES = cfg.enabled_features || {};
    const NS       = "si";

    // All plans get full features - pricing is based on page count only
    console.log('[ADA] Plan tier:', planTier, 'Pages:', pageCount);

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
    const ACCESS_IC = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="4" r="2.5" fill="white"/><path d="M19 13v-2h-5.5l-.8-2.5c-.3-.8-1-1.3-1.8-1.3H9c-.8 0-1.5.5-1.8 1.2L5.5 13H3v2h3.5l1.7-5.2c.1-.3.4-.5.7-.5h1.5l.8 2.5c.3.8 1 1.3 1.8 1.3H19v5h-3v2h3c1.1 0 2-.9 2-2v-5c0-1.1-.9-2-2-2z" fill="white"/><path d="M7 17.5c0 2.5 2 4.5 4.5 4.5s4.5-2 4.5-4.5-2-4.5-4.5-4.5S7 15 7 17.5zm7 0c0 1.4-1.1 2.5-2.5 2.5S9 18.9 9 17.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5z" fill="white"/></svg>`;

    // All profiles available for all plans - pricing based on page count only
    const visibleProfiles = [
      { id: 'epilepsy', icon: '⚡', name: 'Epilepsy Safe', desc: 'Stops animations & flashing' },
      { id: 'cognitive', icon: '🧠', name: 'Cognitive', desc: 'Simplified interface' },
      { id: 'adhd', icon: '🎯', name: 'ADHD Friendly', desc: 'Focus mode' },
      { id: 'blindness', icon: '👁️', name: 'Blindness', desc: 'Screen reader optimized' },
      { id: 'visImpaired', icon: '👓', name: 'Visually Impaired', desc: 'Enhanced contrast' },
    ];

    const tmpl = document.createElement("template");
    tmpl.innerHTML = `
<style>${STYLE}</style>
<div id="aw-rguide"></div>
<div id="aw-rmask-top"></div>
<div id="aw-rmask-bot"></div>
<div id="aw-vkb" role="toolbar" aria-label="Virtual Keyboard">
  <button id="aw-vkb-close">✕ Close Keyboard</button>
  <div class="aw-kb-row">
    ${"\`~1!2@3#4\$5%6^7&8*9(0)-_=+".split("").map(k=>`<button class="aw-key" data-k="${k}">${k}</button>`).join("")}
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
<div id="aw-panel" class="aw-hidden" role="dialog" aria-label="Accessibility Options">
  <a id="aw-cta" href="${CTA_URL}" target="_blank" rel="noopener">
    <strong>${AGENCY}</strong>
    <span>Get ADA Compliant Today →</span>
  </a>
  <div id="aw-header">
    <div>
      <h2>Accessibility</h2>
    </div>
    <button id="aw-close" aria-label="Close">${CLOSE_IC}</button>
  </div>
  <div id="aw-tabs">
    <button class="aw-tab active" data-tab="profiles">Profiles</button>
    <button class="aw-tab" data-tab="content">Content</button>
    <button class="aw-tab" data-tab="display">Display</button>
  </div>
  <div id="aw-body">
    <div class="aw-pane active" id="pane-profiles">
      <div class="aw-section-label">Accessibility Profiles</div>
      <div class="aw-profiles">
        ${visibleProfiles.map(p => `
          <button class="aw-profile-btn" data-profile="${p.id}">
            <span class="icon">${p.icon}</span>
            <div class="info">
              <strong>${p.name}</strong>
              <span>${p.desc}</span>
            </div>
          </button>
        `).join('')}
      </div>
    </div>
    <div class="aw-pane" id="pane-content">
      <div class="aw-section-label">Content Adjustments</div>
      <div class="aw-grid">
        <button class="aw-btn" data-feat="readableFont"><span class="bicon">🔤</span>Readable Font</button>
        <button class="aw-btn" data-feat="dyslexia"><span class="bicon">🔠</span>Dyslexia Friendly</button>
        <button class="aw-btn" data-feat="highlightTitles"><span class="bicon">📌</span>Highlight Titles</button>
        <button class="aw-btn" data-feat="highlightLinks"><span class="bicon">🔗</span>Highlight Links</button>
        <button class="aw-btn" data-feat="stopAnimations"><span class="bicon">⏹️</span>Stop Animations</button>
        <button class="aw-btn" data-feat="muteSounds"><span class="bicon">🔇</span>Mute Sounds</button>
        <button class="aw-btn" data-feat="hideImages"><span class="bicon">🖼️</span>Hide Images</button>
        <button class="aw-btn" data-feat="virtualKeyboard"><span class="bicon">⌨️</span>Virtual Keyboard</button>
      </div>
      <div class="aw-section-label">Text Alignment</div>
      <div class="aw-align-row">
        <button class="aw-align-btn" data-align="left">⬅️</button>
        <button class="aw-align-btn" data-align="center">⬆️</button>
        <button class="aw-align-btn" data-align="right">➡️</button>
      </div>
    </div>
    <div class="aw-pane" id="pane-display">
      <div class="aw-section-label">Display & Colors</div>
      <div class="aw-slider-row">
        <label>Font Size <span id="val-fs">100%</span></label>
        <input type="range" id="rng-fs" min="75" max="150" value="100">
        <div class="aw-slider-btns">
          <button data-reset="fontSize">Reset</button>
        </div>
      </div>
      <div class="aw-slider-row">
        <label>Line Height <span id="val-lh">100%</span></label>
        <input type="range" id="rng-lh" min="100" max="200" value="100">
        <div class="aw-slider-btns">
          <button data-reset="lineHeight">Reset</button>
        </div>
      </div>
      <div class="aw-slider-row">
        <label>Letter Spacing <span id="val-ls">0px</span></label>
        <input type="range" id="rng-ls" min="0" max="10" value="0">
        <div class="aw-slider-btns">
          <button data-reset="letterSpacing">Reset</button>
        </div>
      </div>
      <div class="aw-section-label">Colors</div>
      <div class="aw-color-row">
        <span>Text Color</span>
        <div>
          <input type="color" id="col-text" value="#000000">
          <button data-reset="textColor">Reset</button>
        </div>
      </div>
      <div class="aw-color-row">
        <span>Title Color</span>
        <div>
          <input type="color" id="col-title" value="#000000">
          <button data-reset="titleColor">Reset</button>
        </div>
      </div>
      <div class="aw-color-row">
        <span>Background</span>
        <div>
          <input type="color" id="col-bg" value="#ffffff">
          <button data-reset="bgColor">Reset</button>
        </div>
      </div>
      <div class="aw-section-label">Contrast Modes</div>
      <div class="aw-grid" style="grid-template-columns:1fr 1fr 1fr">
        <button class="aw-btn" data-contrast="dark"><span class="bicon">🌙</span>Dark</button>
        <button class="aw-btn" data-contrast="light"><span class="bicon">☀️</span>Light</button>
        <button class="aw-btn" data-contrast="high"><span class="bicon">🔲</span>High Contrast</button>
      </div>
    </div>
    <div id="aw-footer">
      <button id="aw-reset">Reset All</button>
      <div id="aw-powered">Powered by<br><a href="${CTA_URL}" target="_blank">${AGENCY}</a></div>
    </div>
  </div>
</div>
`;

    shadow.appendChild(tmpl.content.cloneNode(true));

    /* ── INTERACTION HANDLERS ─────────────────────────────────────────────── */
    const trigger = shadow.getElementById("aw-trigger");
    const panel   = shadow.getElementById("aw-panel");
    const close   = shadow.getElementById("aw-close");
    const tabs    = shadow.querySelectorAll(".aw-tab");
    const panes   = shadow.querySelectorAll(".aw-pane");
    const reset   = shadow.getElementById("aw-reset");

    // Toggle panel
    trigger.addEventListener("click", () => {
      S.open = !S.open;
      trigger.setAttribute("aria-expanded", S.open);
      panel.classList.toggle("aw-hidden", !S.open);
    });

    // Close panel
    close.addEventListener("click", () => {
      S.open = false;
      trigger.setAttribute("aria-expanded", "false");
      panel.classList.add("aw-hidden");
    });

    // Tab switching
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const t = tab.dataset.tab;
        S.tab = t;
        tabs.forEach(x => x.classList.toggle("active", x === tab));
        panes.forEach(p => p.classList.toggle("active", p.id === `pane-${t}`));
      });
    });

    // Profile buttons
    shadow.querySelectorAll("[data-profile]").forEach(btn => {
      btn.addEventListener("click", () => {
        const p = btn.dataset.profile;
        S[p] = !S[p];
        btn.classList.toggle("active", S[p]);
        applyProfile(p, S[p]);
      });
    });

    // Feature buttons
    shadow.querySelectorAll("[data-feat]").forEach(btn => {
      btn.addEventListener("click", () => {
        const f = btn.dataset.feat;
        S[f] = !S[f];
        btn.classList.toggle("active", S[f]);
        applyFeature(f, S[f]);
      });
    });

    // Alignment buttons
    shadow.querySelectorAll("[data-align]").forEach(btn => {
      btn.addEventListener("click", () => {
        const a = btn.dataset.align;
        S.textAlign = S.textAlign === a ? null : a;
        shadow.querySelectorAll("[data-align]").forEach(b => b.classList.toggle("active", b.dataset.align === S.textAlign));
        applyTextAlign(S.textAlign);
      });
    });

    // Contrast buttons
    shadow.querySelectorAll("[data-contrast]").forEach(btn => {
      btn.addEventListener("click", () => {
        const c = btn.dataset.contrast;
        S.contrast = S.contrast === c ? null : c;
        shadow.querySelectorAll("[data-contrast]").forEach(b => b.classList.toggle("active", b.dataset.contrast === S.contrast));
        applyContrast(S.contrast);
      });
    });

    // Sliders
    const fsSlider = shadow.getElementById("rng-fs");
    const lhSlider = shadow.getElementById("rng-lh");
    const lsSlider = shadow.getElementById("rng-ls");

    fsSlider.addEventListener("input", (e) => {
      S.fontSize = parseInt(e.target.value);
      shadow.getElementById("val-fs").textContent = S.fontSize + "%";
      applyFontSize(S.fontSize);
    });

    lhSlider.addEventListener("input", (e) => {
      S.lineHeight = parseInt(e.target.value);
      shadow.getElementById("val-lh").textContent = S.lineHeight + "%";
      applyLineHeight(S.lineHeight);
    });

    lsSlider.addEventListener("input", (e) => {
      S.letterSpacing = parseInt(e.target.value);
      shadow.getElementById("val-ls").textContent = S.letterSpacing + "px";
      applyLetterSpacing(S.letterSpacing);
    });

    // Color pickers
    shadow.getElementById("col-text").addEventListener("input", (e) => {
      S.textColor = e.target.value;
      applyTextColor(S.textColor);
    });

    shadow.getElementById("col-title").addEventListener("input", (e) => {
      S.titleColor = e.target.value;
      applyTitleColor(S.titleColor);
    });

    shadow.getElementById("col-bg").addEventListener("input", (e) => {
      S.bgColor = e.target.value;
      applyBgColor(S.bgColor);
    });

    // Reset buttons
    shadow.querySelectorAll("[data-reset]").forEach(btn => {
      btn.addEventListener("click", () => {
        const r = btn.dataset.reset;
        switch(r) {
          case "fontSize": S.fontSize = 100; fsSlider.value = 100; shadow.getElementById("val-fs").textContent = "100%"; applyFontSize(100); break;
          case "lineHeight": S.lineHeight = 100; lhSlider.value = 100; shadow.getElementById("val-lh").textContent = "100%"; applyLineHeight(100); break;
          case "letterSpacing": S.letterSpacing = 0; lsSlider.value = 0; shadow.getElementById("val-ls").textContent = "0px"; applyLetterSpacing(0); break;
          case "textColor": S.textColor = ""; shadow.getElementById("col-text").value = "#000000"; applyTextColor(""); break;
          case "titleColor": S.titleColor = ""; shadow.getElementById("col-title").value = "#000000"; applyTitleColor(""); break;
          case "bgColor": S.bgColor = ""; shadow.getElementById("col-bg").value = "#ffffff"; applyBgColor(""); break;
        }
      });
    });

    // Reset all
    reset.addEventListener("click", () => {
      Object.keys(S).forEach(k => {
        if (typeof S[k] === "boolean") S[k] = false;
        if (typeof S[k] === "number") S[k] = k === "fontSize" ? 100 : k === "lineHeight" ? 100 : 0;
        if (typeof S[k] === "string" && k !== "tab") S[k] = "";
      });
      // Reset UI
      shadow.querySelectorAll(".aw-profile-btn, .aw-btn, .aw-align-btn").forEach(b => b.classList.remove("active"));
      fsSlider.value = 100; shadow.getElementById("val-fs").textContent = "100%";
      lhSlider.value = 100; shadow.getElementById("val-lh").textContent = "100%";
      lsSlider.value = 0; shadow.getElementById("val-ls").textContent = "0px";
      shadow.getElementById("col-text").value = "#000000";
      shadow.getElementById("col-title").value = "#000000";
      shadow.getElementById("col-bg").value = "#ffffff";
      // Reset page
      resetAll();
    });

    console.log('[ADA] Widget initialized');
  }

  /* ── APPLY FUNCTIONS ──────────────────────────────────────────────────── */
  function applyProfile(profile, enabled) {
    const doc = document.documentElement;
    switch(profile) {
      case 'epilepsy':
        doc.style.setProperty('--aw-epilepsy', enabled ? 'none' : '');
        document.querySelectorAll('*, *::before, *::after').forEach(el => {
          el.style.animation = enabled ? 'none !important' : '';
          el.style.transition = enabled ? 'none !important' : '';
        });
        break;
      case 'cognitive':
        doc.classList.toggle('aw-cognitive', enabled);
        break;
      case 'adhd':
        doc.classList.toggle('aw-adhd', enabled);
        break;
      case 'blindness':
        doc.classList.toggle('aw-blindness', enabled);
        break;
      case 'visImpaired':
        doc.classList.toggle('aw-vis-impaired', enabled);
        break;
    }
  }

  function applyFeature(feature, enabled) {
    const doc = document.documentElement;
    switch(feature) {
      case 'readableFont':
        doc.classList.toggle('aw-readable-font', enabled);
        break;
      case 'dyslexia':
        doc.classList.toggle('aw-dyslexia', enabled);
        break;
      case 'highlightTitles':
        doc.classList.toggle('aw-highlight-titles', enabled);
        break;
      case 'highlightLinks':
        doc.classList.toggle('aw-highlight-links', enabled);
        break;
      case 'stopAnimations':
        document.querySelectorAll('*, *::before, *::after').forEach(el => {
          el.style.animationPlayState = enabled ? 'paused' : '';
        });
        break;
      case 'muteSounds':
        document.querySelectorAll('audio, video').forEach(el => {
          el.muted = enabled;
        });
        break;
      case 'hideImages':
        doc.classList.toggle('aw-hide-images', enabled);
        break;
      case 'virtualKeyboard':
        const vkb = shadow.getElementById('aw-vkb');
        if (enabled) {
          vkb.classList.add('visible');
          // Focus on first input
          const firstInput = document.querySelector('input, textarea');
          if (firstInput) firstInput.focus();
        } else {
          vkb.classList.remove('visible');
        }
        break;
    }
  }

  function applyTextAlign(align) {
    document.body.style.textAlign = align || '';
  }

  function applyContrast(contrast) {
    const doc = document.documentElement;
    doc.classList.remove('aw-contrast-dark', 'aw-contrast-light', 'aw-contrast-high');
    if (contrast) doc.classList.add(`aw-contrast-${contrast}`);
  }

  function applyFontSize(size) {
    document.documentElement.style.fontSize = size + '%';
  }

  function applyLineHeight(height) {
    document.body.style.lineHeight = height + '%';
  }

  function applyLetterSpacing(spacing) {
    document.body.style.letterSpacing = spacing + 'px';
  }

  function applyTextColor(color) {
    document.body.style.color = color || '';
  }

  function applyTitleColor(color) {
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
      el.style.color = color || '';
    });
  }

  function applyBgColor(color) {
    document.body.style.backgroundColor = color || '';
  }

  function resetAll() {
    const doc = document.documentElement;
    doc.className = doc.className.replace(/aw-[^\s]*/g, '').trim();
    document.body.style.cssText = '';
    document.documentElement.style.cssText = '';
    document.querySelectorAll('*, *::before, *::after').forEach(el => {
      el.style.animation = '';
      el.style.transition = '';
      el.style.animationPlayState = '';
    });
    document.querySelectorAll('audio, video').forEach(el => {
      el.muted = false;
    });
  }

  /* ── INJECT GLOBAL STYLES ─────────────────────────────────────────────── */
  function injectGlobalStyles() {
    if (document.getElementById('aw-global-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'aw-global-styles';
    style.textContent = `
      /* Highlight Titles */
      .aw-highlight-titles h1,
      .aw-highlight-titles h2,
      .aw-highlight-titles h3,
      .aw-highlight-titles h4,
      .aw-highlight-titles h5,
      .aw-highlight-titles h6 {
        background-color: #ffeb3b !important;
        color: #000 !important;
        padding: 4px 8px !important;
        border-radius: 4px !important;
      }
      
      /* Highlight Links */
      .aw-highlight-links a {
        background-color: #ffeb3b !important;
        color: #000 !important;
        padding: 2px 4px !important;
        border-radius: 2px !important;
        text-decoration: underline !important;
        font-weight: bold !important;
      }
      
      /* Hide Images */
      .aw-hide-images img,
      .aw-hide-images picture,
      .aw-hide-images figure,
      .aw-hide-images [style*="background-image"] {
        display: none !important;
        visibility: hidden !important;
      }
      
      /* Readable Font */
      .aw-readable-font,
      .aw-readable-font * {
        font-family: 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif !important;
        line-height: 1.6 !important;
      }
      
      /* Dyslexia Friendly */
      .aw-dyslexia,
      .aw-dyslexia * {
        font-family: 'Comic Sans MS', 'Chalkboard SE', sans-serif !important;
        letter-spacing: 0.05em !important;
        word-spacing: 0.1em !important;
        line-height: 1.8 !important;
      }
      
      /* Epilepsy Safe - Stop Animations */
      .aw-epilepsy *,
      .aw-epilepsy *::before,
      .aw-epilepsy *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
      
      /* Cognitive - Simplified Interface */
      .aw-cognitive * {
        border-radius: 0 !important;
        box-shadow: none !important;
        text-shadow: none !important;
      }
      
      /* ADHD - Focus Mode */
      .aw-adhd *:not(:focus):not(:hover) {
        opacity: 0.7 !important;
      }
      .aw-adhd *:focus,
      .aw-adhd *:hover {
        opacity: 1 !important;
        outline: 3px solid #007bff !important;
      }
      
      /* Blindness - Screen Reader Optimized */
      .aw-blindness {
        background: #000 !important;
        color: #fff !important;
      }
      
      /* Visually Impaired - High Contrast */
      .aw-vis-impaired {
        filter: contrast(150%) !important;
      }
      
      /* Contrast Modes */
      .aw-contrast-dark {
        filter: invert(1) hue-rotate(180deg) !important;
        background: #000 !important;
      }
      .aw-contrast-light {
        filter: contrast(120%) brightness(110%) !important;
        background: #fff !important;
      }
      .aw-contrast-high {
        filter: contrast(200%) !important;
      }
      
      /* Cursor Styles */
      .aw-cursor-black {
        cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpolygon points='5,3 5,33 14,24 19,37 23,35 18,22 28,22' fill='%23000' stroke='%23fff' stroke-width='2'/%3E%3C/svg%3E") 5 3, auto !important;
      }
      .aw-cursor-white {
        cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpolygon points='5,3 5,33 14,24 19,37 23,35 18,22 28,22' fill='%23fff' stroke='%23000' stroke-width='2'/%3E%3C/svg%3E") 5 3, auto !important;
      }
    `;
    document.head.appendChild(style);
  }

  /* ── START ────────────────────────────────────────────────────────────── */
  injectGlobalStyles();
  loadWidget();
})();
