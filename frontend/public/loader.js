(function () {
  "use strict";
  
  console.log('[ADA] Loader starting...');

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
      pro_max: 25,
      growth_max: 100
    };
    
    if (pageCount <= settings.basic_max) return 'basic';
    if (pageCount <= settings.pro_max) return 'pro';
    if (pageCount <= settings.growth_max) return 'growth';
    return 'enterprise';
  }

  /* ── FETCH CLIENT CONFIG FROM SUPABASE ─────────────────────────────────── */
  async function loadWidget() {
    const domainFilter = `domain=eq.${encodeURIComponent(CURRENT_DOMAIN)},domain=eq.${encodeURIComponent(ROOT_DOMAIN)}`;
    
    try {
      // Fetch client config
      const clientRes = await fetch(`${SUPABASE_URL}/rest/v1/clients?or=(${domainFilter})&select=*&limit=1`, {
        headers: {
          "apikey": SUPABASE_ANON,
          "Authorization": `Bearer ${SUPABASE_ANON}`,
          "Content-Type": "application/json"
        }
      });
      
      let clientData = await clientRes.json();
      
      // If not found in clients, try personal_websites
      if (!clientData || clientData.length === 0) {
        const personalRes = await fetch(`${SUPABASE_URL}/rest/v1/personal_websites?or=(${domainFilter})&select=*&limit=1`, {
          headers: {
            "apikey": SUPABASE_ANON,
            "Authorization": `Bearer ${SUPABASE_ANON}`,
            "Content-Type": "application/json"
          }
        });
        clientData = await personalRes.json();
      }
      
      if (!clientData || clientData.length === 0) {
        console.log('[ADA] No client found for domain:', CURRENT_DOMAIN);
        return;
      }
      
      const client = clientData[0];
      console.log('[ADA] Client found:', client.name, 'Active:', client.active);
      
      if (!client.active) {
        console.log('[ADA] Client inactive, not loading widget');
        return;
      }
      
      // Fetch plan settings from admin
      const settingsRes = await fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.plan_thresholds&select=value&limit=1`, {
        headers: {
          "apikey": SUPABASE_ANON,
          "Authorization": `Bearer ${SUPABASE_ANON}`,
          "Content-Type": "application/json"
        }
      });
      
      const settingsData = await settingsRes.json();
      const planSettings = settingsData?.[0]?.value ? JSON.parse(settingsData[0].value) : null;
      
      // Count pages and determine dynamic plan
      const pageCount = await countPages();
      const detectedPlan = determinePlan(pageCount, planSettings);
      
      console.log('[ADA] Pages detected:', pageCount, 'Plan:', detectedPlan);
      
      // Use detected plan or client's assigned plan (whichever is higher)
      const finalPlan = getHigherPlan(client.plan_tier, detectedPlan);
      
      // Update client record with detected plan
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

    // Plan-based feature limits
    const PLAN_LIMITS = {
      'basic': { profiles: 3, features: 'basic' },
      'starter': { profiles: 5, features: 'standard' },
      'pro': { profiles: 8, features: 'advanced' },
      'growth': { profiles: 10, features: 'full' },
      'enterprise': { profiles: 999, features: 'unlimited' }
    };
    
    const limits = PLAN_LIMITS[planTier] || PLAN_LIMITS['basic'];
    console.log('[ADA] Plan limits:', limits);

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
      #aw-plan-badge {
        font-size:10px; padding:2px 8px; border-radius:10px;
        background:${COLOR}20; color:${COLOR}; font-weight:600; text-transform:uppercase;
      }
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
      .aw-btn.aw-locked { opacity:0.5; cursor:not-allowed; position:relative; }
      .aw-btn.aw-locked::after {
        content:'🔒'; position:absolute; top:2px; right:2px; font-size:10px;
      }
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
      .aw-upgrade-banner {
        background:linear-gradient(135deg,${COLOR}20,${COLOR}10);
        border:1px solid ${COLOR}40;
        border-radius:8px;
        padding:10px;
        margin-bottom:12px;
        font-size:11px;
        color:#444;
      }
      .aw-upgrade-banner strong { color:${COLOR}; }
    `;

    const CLOSE_IC = `<svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>`;
    const ACCESS_IC = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="4" r="2.5" fill="white"/><path d="M19 13v-2h-5.5l-.8-2.5c-.3-.8-1-1.3-1.8-1.3H9c-.8 0-1.5.5-1.8 1.2L5.5 13H3v2h3.5l1.7-5.2c.1-.3.4-.5.7-.5h1.5l.8 2.5c.3.8 1 1.3 1.8 1.3H19v5h-3v2h3c1.1 0 2-.9 2-2v-5c0-1.1-.9-2-2-2z" fill="white"/><path d="M7 17.5c0 2.5 2 4.5 4.5 4.5s4.5-2 4.5-4.5-2-4.5-4.5-4.5S7 15 7 17.5zm7 0c0 1.4-1.1 2.5-2.5 2.5S9 18.9 9 17.5s1.1-2.5 2.5-2.5 2.5 1.1 2.5 2.5z" fill="white"/></svg>`;

    // Build profiles based on plan limits
    const allProfiles = [
      { id: 'epilepsy', icon: '⚡', name: 'Epilepsy Safe', desc: 'Stops animations & flashing', locked: false },
      { id: 'cognitive', icon: '🧠', name: 'Cognitive', desc: 'Simplified interface', locked: false },
      { id: 'adhd', icon: '🎯', name: 'ADHD Friendly', desc: 'Focus mode', locked: false },
      { id: 'blindness', icon: '👁️', name: 'Blindness', desc: 'Screen reader optimized', locked: limits.profiles < 4 },
      { id: 'visImpaired', icon: '👓', name: 'Visually Impaired', desc: 'Enhanced contrast', locked: limits.profiles < 5 },
    ];
    
    const visibleProfiles = allProfiles.slice(0, limits.profiles);

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
      <span id="aw-plan-badge">${planTier}</span>
    </div>
    <button id="aw-close" aria-label="Close">${CLOSE_IC}</button>
  </div>
  <div id="aw-tabs">
    <button class="aw-tab active" data-tab="profiles">Profiles</button>
    <button class="aw-tab" data-tab="content">Content</button>
    <button class="aw-tab" data-tab="display">Display</button>
  </div>
  <div id="aw-body">
    ${limits.features !== 'unlimited' ? `
    <div class="aw-upgrade-banner">
      <strong>${planTier} Plan</strong> — ${pageCount} pages detected. 
      ${limits.features === 'basic' ? 'Upgrade for more features!' : 'Upgrade for unlimited access!'}
    </div>
    ` : ''}
    <div class="aw-pane active" id="pane-profiles">
      <div class="aw-section-label">Accessibility Profiles</div>
      <div class="aw-profiles">
        ${visibleProfiles.map(p => `
          <button class="aw-profile-btn${p.locked ? ' aw-locked' : ''}" data-profile="${p.id}"${p.locked ? ' disabled' : ''}>
            <span class="icon">${p.icon}</span>
            <div class="info">
              <strong>${p.name}</strong>
              <span>${p.desc}${p.locked ? ' (Upgrade to unlock)' : ''}</span>
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
        <button class="aw-btn${limits.features === 'basic' ? ' aw-locked' : ''}" data-feat="stopAnimations"${limits.features === 'basic' ? ' disabled' : ''}><span class="bicon">⏹️</span>Stop Animations${limits.features === 'basic' ? '<br><small>(Upgrade)</small>' : ''}</button>
        <button class="aw-btn${limits.features === 'basic' ? ' aw-locked' : ''}" data-feat="muteSounds"${limits.features === 'basic' ? ' disabled' : ''}><span class="bicon">🔇</span>Mute Sounds${limits.features === 'basic' ? '<br><small>(Upgrade)</small>' : ''}</button>
        <button class="aw-btn${limits.features === 'basic' ? ' aw-locked' : ''}" data-feat="hideImages"${limits.features === 'basic' ? ' disabled' : ''}><span class="bicon">🖼️</span>Hide Images${limits.features === 'basic' ? '<br><small>(Upgrade)</small>' : ''}</button>
        <button class="aw-btn${limits.features !== 'unlimited' ? ' aw-locked' : ''}" data-feat="virtualKeyboard"${limits.features !== 'unlimited' ? ' disabled' : ''}><span class="bicon">⌨️</span>Virtual Keyboard${limits.features !== 'unlimited' ? '<br><small>(Enterprise)</small>' : ''}</button>
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
        <div class