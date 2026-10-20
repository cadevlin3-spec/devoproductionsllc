/* Devo Productions wedding planning form: shared by the CRM and the couple's private page.
   PlanForm.mount(el, {get, set, mode:'crm'|'couple', topOffset, onSubmit, submitted})
   get(key) -> string, set(key, value) -> void (host does the saving). */
(function (w) {
  'use strict';
  var GENRES = ['Top 40', 'Country', 'Classic rock', 'Rock', 'Hip hop', 'R&B', 'Pop', '80s', '90s', '2000s', 'Oldies', 'Latin', 'Dance / EDM', 'Disco / funk'];
  var INTRO = [['intro_parents', 'Parents / family'], ['intro_ring', 'Ring bearer / flower girl'], ['intro_party', 'Wedding party'], ['intro_honor', 'Best man / maid of honor'], ['intro_bg', 'Bride and groom']];
  var TRAD = [['bouquet', 'Bouquet toss'], ['garter', 'Garter toss'], ['dollar', 'Dollar dance'], ['cultural', 'Cultural tradition(s)'], ['games', 'Games / activities'], ['other', 'Anything else']];

  // f: k key, l label, t type, h hint, o options, w wide
  var S = [
    { id: 'overview', t: 'Event overview', s: 'The basics for the day.', f: [
      { k: 'venue1', l: 'Ceremony venue', t: 'text', h: 'Name and town' },
      { k: 'venue2', l: 'Reception venue', t: 'text', h: 'Only if different' },
      { k: 'guests', l: 'Guest count', t: 'num', h: 'Rough number is fine' },
      { k: 'setup_time', l: 'DJ set-up time', t: 'time', h: 'When I can get in' },
      { k: 'couple_phone', l: 'Best phone number for you two', t: 'tel' },
      { k: 'dayof', l: 'Day-of contact', t: 'contact', h: 'Someone I can reach that day' },
      { k: 'officiant', l: 'Officiant', t: 'contact' },
      { k: 'photovideo', l: 'Photographer / videographer', t: 'contact' }
    ] },
    { id: 'ceremony', t: 'Ceremony', s: 'Music and microphones for the ceremony.', f: [
      { k: 'cer_time', l: 'Ceremony start time', t: 'time' },
      { k: 'prelude', l: 'Prelude music', t: 'text', h: 'Songs, a playlist link, or "your pick"' },
      { k: 'pro', l: 'Processional song', t: 'song', h: 'Wedding party walks in' },
      { k: 'ent', l: 'Bride entrance song', t: 'song' },
      { k: 'readings', l: 'Special music or readings', t: 'area', w: 1, h: 'Live musicians, soloists, readers' },
      { k: 'rec', l: 'Recessional song', t: 'song' },
      { k: 'weather', l: 'Weather backup plan', t: 'text', h: 'If outdoors' },
      { k: 'cer_mics', l: 'Microphones and audio needs', t: 'area', w: 1, h: 'Mic count, who speaks, live music' }
    ] },
    { id: 'cocktail', t: 'Cocktail hour and entrance', s: 'Background music and how everyone gets introduced.', f: [
      { k: 'cocktail_time', l: 'Cocktail hour starts', t: 'time' },
      { k: 'cocktail_len', l: 'How long', t: 'choice', o: ['30 min', '45 min', '60 min', '90 min'] },
      { k: 'cocktail_loc', l: 'Cocktail location', t: 'text' },
      { k: 'cocktail_list', l: 'Cocktail hour music', t: 'songs', w: 1, h: 'Songs you want, or leave it to me' },
      { k: 'intro_time', l: 'Grand entrance time', t: 'time' },
      { k: 'welcome_by', l: 'Welcome / remarks by', t: 'text' },
      { k: 'cocktail_ann', l: 'Announcements during cocktail hour', t: 'area', w: 1 },
      { t: 'head', l: 'Introductions' },
      { k: 'intro_parents', l: 'Parents / family', t: 'party' },
      { k: 'intro_ring', l: 'Ring bearer / flower girl', t: 'party' },
      { k: 'wp_list', l: 'Wedding party names', t: 'people', w: 1, h: 'Add everyone being introduced' },
      { k: 'intro_party', l: 'Wedding party entrance song', t: 'party' },
      { k: 'intro_honor', l: 'Best man / maid of honor', t: 'party' },
      { k: 'intro_bg', l: 'Bride and groom', t: 'party' }
    ] },
    { id: 'dinner', t: 'Dinner and toasts', s: 'Meal timing, speakers and announcements.', f: [
      { k: 'dinner_time', l: 'Dinner time', t: 'time' },
      { k: 'dinner_style', l: 'Food service', t: 'choice', o: ['Buffet', 'Plated', 'Family style', 'Stations', 'Food truck'] },
      { k: 'dinner_list', l: 'Dinner background music', t: 'songs', w: 1 },
      { k: 'blessing', l: 'Blessing by', t: 'text' },
      { k: 'toast_bm', l: 'Best man toast', t: 'text', h: 'Name' },
      { k: 'toast_moh', l: 'Maid / matron of honor toast', t: 'text', h: 'Name' },
      { k: 'toast_more', l: 'Additional speakers', t: 'text', h: 'Name and relationship' },
      { k: 'thanks', l: 'Couple’s thank-you', t: 'text', h: 'Before or after dinner' },
      { k: 'dismissal', l: 'Table dismissal order', t: 'area', w: 1, h: 'Who goes up first, by table or family' },
      { k: 'allergies', l: 'Allergy or dietary notes', t: 'area', w: 1 },
      { k: 'dinner_ann', l: 'Other announcements', t: 'area', w: 1, h: 'Bar, beverage station, guest book' }
    ] },
    { id: 'dances', t: 'Dances and cake', s: 'The special dances and cake cutting.', f: [
      { k: 'dance_bg', l: 'Bride and groom first dance', t: 'song' },
      { k: 'dance_p1', l: 'Parent dance', t: 'party', h: 'Who is dancing' },
      { k: 'dance_p2', l: 'Second parent dance', t: 'party', h: 'Who is dancing' },
      { k: 'dance_x', l: 'Another dance', t: 'party', h: 'Anniversary, solo, etc.' },
      { k: 'cake_time', l: 'Cake cutting time', t: 'time' },
      { k: 'cake', l: 'Cake song', t: 'song' },
      { k: 'dessert', l: 'Dessert options', t: 'text', w: 1 }
    ] },
    { id: 'traditions', t: 'Traditions', s: 'Tap yes or no. Add a note if you like.', f: [{ t: 'trads' }] },
    { id: 'dancing', t: 'Open dancing', s: 'Help me read the room before it starts.', f: [
      { k: 'genres', l: 'What sounds like your crowd?', t: 'chips', o: GENRES, w: 1, h: 'Pick as many as you like' },
      { k: 'clean', l: 'Clean versions only?', t: 'choice', o: ['Clean only', 'Either is fine'] },
      { k: 'group_ok', l: 'Group dances (Cupid Shuffle, etc.)', t: 'choice', o: ['Yes please', 'A couple', 'No thanks'] },
      { k: 'vibe', l: 'Vibe and energy', t: 'area', w: 1, h: 'In your own words' },
      { k: 'must_list', l: 'Must-play songs', t: 'songs', w: 1, h: 'Paste a whole list at once if you have one' },
      { k: 'dont_list', l: 'Do NOT play', t: 'songs', w: 1, h: 'Songs you never want to hear' },
      { k: 'playlist_link', l: 'Playlist link', t: 'link', w: 1, h: 'Apple Music, Spotify, YouTube' },
      { k: 'last', l: 'Last song of the night', t: 'song' }
    ] },
    { id: 'sendoff', t: 'Send-off and notes', s: 'How the night ends, and anything I missed.', f: [
      { k: 'so_time', l: 'Send-off time', t: 'time' },
      { k: 'so_style', l: 'Send-off style', t: 'chips', o: ['Sparklers', 'Bubbles', 'Exit line', 'Streamers', 'Glow sticks', 'Just walk out'], w: 1 },
      { k: 'so_loc', l: 'Send-off location', t: 'text' },
      { k: 'so', l: 'Send-off song', t: 'song' },
      { k: 'notes', l: 'Anything else I should know', t: 'area', w: 1 }
    ] }
  ];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function parseList(v) { try { var a = JSON.parse(v || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function keysOf(f) {
    var k = f.k;
    if (f.t === 'contact') return [k + '_n', k + '_p'];
    if (f.t === 'song') return [k + '_t', k + '_a'];
    if (f.t === 'party') return [k + '_n', k + '_t', k + '_a'];
    return [k];
  }
  function fieldsOf(sec, i) {
    if (sec.f.length === 1 && sec.f[0].t === 'trads') return TRAD.map(function (t) { return { k: t[0], l: t[1], t: 'trad' }; });
    return sec.f.filter(function (f) { return f.t !== 'head'; });
  }
  function filled(f, get) {
    if (f.t === 'trad') return !!(get('t_' + f.k + '_on') || String(get('t_' + f.k + '_d') || '').trim());
    if (f.t === 'songs' || f.t === 'people') return parseList(get(f.k)).length > 0;
    return keysOf(f).some(function (k) { return String(get(k) || '').trim() !== ''; });
  }
  function offList(get) { return String(get('sec_off') || '').split(',').filter(Boolean); }
  function counts(get) {
    var offs = offList(get);
    return S.map(function (s, i) {
      if (offs.indexOf(s.id) > -1) return { n: 0, t: 0, off: true };
      var fs = fieldsOf(s, i), n = 0;
      fs.forEach(function (f) { if (filled(f, get)) n++; });
      return { n: n, t: fs.length };
    });
  }
  function pct(get) {
    var c = counts(get), n = 0, t = 0;
    c.forEach(function (x) { n += x.n; t += x.t; });
    return t ? Math.round(n / t * 100) : 0;
  }
  function pctOf(plan) { return pct(function (k) { return plan[k]; }); }

  var CSS = '.pf{--pf-top:0px;color:var(--tx,#f5f5f7)}' +
    '.pf-tabs{position:sticky;top:var(--pf-top);z-index:5;display:flex;gap:8px;overflow-x:auto;padding:12px 0;margin:0 0 18px;background:linear-gradient(var(--bg,#000) 78%,transparent);scrollbar-width:none;scroll-snap-type:x proximity}' +
    '.pf-tabs::-webkit-scrollbar{display:none}' +
    '.pf-tab{flex:none;display:flex;align-items:center;gap:9px;padding:10px 15px;border:1px solid var(--line,#ffffff14);border-radius:999px;background:var(--p1,#0b0b0c);color:var(--mu,#a1a1a6);font-weight:600;font-size:13.5px;white-space:nowrap;scroll-snap-align:center;transition:all .18s}' +
    '.pf-tab b{font-family:Archivo,Inter,sans-serif;font-weight:800;font-size:12px;opacity:.6}' +
    '.pf-tab em{font-style:normal;font-size:11.5px;opacity:.7;font-weight:500}' +
    '.pf-tab.done{color:var(--tx,#f5f5f7)}.pf-tab.done em:before{content:"\\2713  "}' +
    '.pf-tab.on{background:var(--tx,#f5f5f7);color:var(--on,#000);border-color:var(--tx,#f5f5f7)}.pf-tab.on b,.pf-tab.on em{opacity:.65}' +
    '.pf-top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}.pf-top>div{min-width:0}' +
    '.pf-sw{flex:none;display:inline-flex;align-items:center;gap:10px;margin-top:6px;font-size:13.5px;font-weight:600;cursor:pointer;user-select:none}' +
    '.pf-sw input{position:absolute;opacity:0;pointer-events:none}' +
    '.pf-sw i{width:46px;height:28px;border-radius:99px;background:var(--line2,#ffffff26);position:relative;transition:background .2s}' +
    '.pf-sw i:after{content:"";position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:var(--bg,#000);transition:transform .2s}' +
    '.pf-sw input:checked+i{background:var(--tx,#f5f5f7)}.pf-sw input:checked+i:after{transform:translateX(18px)}.pf-sw input:focus-visible+i{outline:2px solid var(--tx,#f5f5f7);outline-offset:2px}' +
    '.pf-offmsg{display:none;padding:26px;border:1px dashed var(--line2,#ffffff26);border-radius:18px;color:var(--mu,#a1a1a6);text-align:center}' +
    '.pf-sec.off .pf-g{display:none}.pf-sec.off .pf-offmsg{display:block}.pf-sec.off .pf-h,.pf-sec.off .pf-s{opacity:.5}' +
    '.pf-tab.off{opacity:.55}.pf-tab.off em{text-transform:uppercase;letter-spacing:.05em}' +
    '.pf-sec{display:none}.pf-sec.on{display:block;animation:pfin .25s ease}' +
    '@keyframes pfin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
    '.pf-h{font-family:Archivo,Inter,sans-serif;font-weight:800;font-stretch:112%;letter-spacing:-.02em;line-height:1.02;font-size:clamp(28px,6vw,42px);margin-bottom:8px}' +
    '.pf-s{color:var(--mu,#a1a1a6);margin-bottom:22px}' +
    '.pf-g{display:grid;grid-template-columns:1fr 1fr;gap:18px 16px;background:var(--card,transparent);border:1px solid var(--cardb,transparent);border-radius:24px;padding:var(--cardp,0);box-shadow:var(--cards,none)}' +
    '.pf-f{min-width:0}.pf-f.w,.pf-head{grid-column:1/-1}' +
    '.pf-f>label,.pf-lab{display:block;font-size:13px;font-weight:600;margin-bottom:7px;color:var(--tx,#f5f5f7)}' +
    '.pf-f>label i,.pf-lab i{font-style:normal;font-weight:400;color:var(--mu2,#6e6e73);margin-left:6px}' +
    '.pf-head{font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--mu2,#6e6e73);font-weight:600;margin-top:10px;padding-top:18px;border-top:1px solid var(--line,#ffffff14)}' +
    '.pf-in{width:100%;min-height:48px;background:var(--p2,#131315);border:1px solid var(--line,#ffffff14);border-radius:14px;padding:12px 15px;font-size:16px;outline:0;color:inherit;font-family:inherit;transition:border-color .2s,background .2s}' +
    '.pf-in:focus{border-color:#ffffff66;background:var(--p3,#1b1b1e)}.pf-in::placeholder{color:var(--mu2,#6e6e73)}' +
    'textarea.pf-in{min-height:84px;resize:none;line-height:1.45}' +
    'input[type=time].pf-in{color-scheme:inherit;-webkit-appearance:none;appearance:none;display:block;text-align:left}' +
    '.pf-flash{animation:pfflash 1.8s ease}@keyframes pfflash{0%,60%{border-color:#30d158;box-shadow:0 0 0 3px #30d15840}100%{}}' +
    '.pf-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
    '.pf-row3{display:grid;grid-template-columns:1.1fr 1fr 1fr;gap:10px}' +
    '.pf-chips{display:flex;flex-wrap:wrap;gap:8px}' +
    '.pf-chip{min-height:44px;padding:9px 16px;border:1px solid var(--line2,#ffffff26);border-radius:999px;color:var(--mu,#a1a1a6);font-weight:500;font-size:14.5px;transition:all .15s}' +
    '.pf-chip.on{background:var(--tx,#f5f5f7);color:var(--on,#000);border-color:var(--tx,#f5f5f7);font-weight:600}' +
    '.pf-songs{border:1px solid var(--line,#ffffff14);border-radius:16px;background:var(--p1,#0b0b0c);padding:12px}' +
    '.pf-srow{display:grid;grid-template-columns:26px 1fr 1fr 40px;gap:8px;align-items:center;margin-bottom:8px}' +
    '.pf-srow .pf-in{min-height:44px;padding:9px 13px;font-size:15px}' +
    '.pf-num{color:var(--mu2,#6e6e73);font-size:12px;text-align:center}' +
    '.pf-x{width:40px;height:40px;border-radius:50%;color:var(--mu2,#6e6e73);font-size:20px;line-height:1}.pf-x:hover{color:var(--tx,#f5f5f7);background:var(--p3,#1b1b1e)}' +
    '.pf-sbar{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}' +
    '.pf-link{padding:9px 15px;border-radius:999px;border:1px solid var(--line2,#ffffff26);font-weight:600;font-size:13.5px}.pf-link:hover{background:var(--p3,#1b1b1e)}' +
    '.pf-paste{display:none;margin-top:10px}.pf-paste.on{display:block}.pf-paste p{font-size:13px;color:var(--mu,#a1a1a6);margin-bottom:8px}' +
    '.pf-trad{grid-column:1/-1;display:grid;grid-template-columns:200px auto 1fr;gap:12px;align-items:center;padding:12px 0;border-top:1px solid var(--line,#ffffff14)}' +
    '.pf-trad:first-child{border-top:0}.pf-trad>b{font-weight:600}' +
    '.pf-yn{display:flex;gap:6px}.pf-yn .pf-chip{min-width:64px;padding:9px 14px}' +
    '.pf-nav{position:sticky;bottom:0;z-index:4;display:flex;justify-content:space-between;gap:10px;margin-top:26px;padding:26px 0 calc(14px + env(safe-area-inset-bottom));background:linear-gradient(transparent,var(--bg,#000) 32%)}' +
    '.pf-btn{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:12px 26px;border-radius:999px;background:var(--tx,#f5f5f7);color:var(--on,#000);font-weight:600;font-size:15px;transition:transform .15s,opacity .15s}' +
    '.pf-btn:active{transform:scale(.97)}.pf-btn.ghost{background:var(--p3,#1b1b1e);color:var(--tx,#f5f5f7);border:1px solid var(--line,#ffffff14)}.pf-btn[disabled]{opacity:.45}' +
    '.pf-rv{background:var(--p1,#0b0b0c);border:1px solid var(--line,#ffffff14);border-radius:18px;padding:6px 20px;margin-bottom:14px}' +
    '.pf-rv h4{display:flex;justify-content:space-between;align-items:center;font-size:13px;letter-spacing:.1em;text-transform:uppercase;padding:14px 0 6px}' +
    '.pf-rv h4 button{font-size:12.5px;letter-spacing:0;text-transform:none;color:var(--mu,#a1a1a6);text-decoration:underline}' +
    '.pf-rv dl{display:grid;grid-template-columns:minmax(120px,32%) 1fr;gap:6px 14px;padding:4px 0 14px}' +
    '.pf-rv dt{color:var(--mu,#a1a1a6);font-size:13.5px}.pf-rv dd{font-size:14.5px;white-space:pre-wrap;overflow-wrap:anywhere}' +
    '.pf-rv .none{color:var(--mu2,#6e6e73);padding:2px 0 14px;font-size:14px}' +
    '.pf-send{background:var(--p2,#131315);border:1px solid var(--line2,#ffffff26);border-radius:18px;padding:22px;margin-top:20px;text-align:center}' +
    '.pf-send p{color:var(--mu,#a1a1a6);margin-bottom:16px}' +
    '@media(max-width:700px){.pf-g{grid-template-columns:1fr}.pf-trad{grid-template-columns:1fr auto}.pf-trad .pf-in{grid-column:1/-1}.pf-srow{grid-template-columns:22px 1fr 36px}.pf-srow .pf-sa{grid-column:2/3}.pf-srow .pf-x{grid-row:1;grid-column:3}.pf-row3{grid-template-columns:1fr 1fr}.pf-row3 .pf-first{grid-column:1/-1}.pf-rv dl{grid-template-columns:1fr}.pf-rv dt{margin-top:6px}}' +
    '@media print{.pf-sec.off{display:none!important}.pf-sw{display:none}.pf-tabs,.pf-nav,.pf-sbar,.pf-paste,.pf-x,.pf-send{display:none!important}.pf-sec{display:block!important;animation:none;break-inside:avoid;margin-bottom:22px}.pf-sec.pf-review{display:none!important}.pf,.pf *{color:#000!important}.pf-in{background:#fff!important;border:0!important;border-bottom:1px solid #888!important;border-radius:0!important;min-height:0!important;padding:3px 0!important}.pf-chip:not(.on){display:none}.pf-chip.on{background:none!important;border:1px solid #000!important}.pf-songs{border:0;background:none;padding:0}.pf-h{font-size:22px}}';

  function injectCss() {
    if (document.getElementById('pf-css')) return;
    var s = document.createElement('style'); s.id = 'pf-css'; s.textContent = CSS; document.head.appendChild(s);
  }

  function mount(el, opt) {
    injectCss();
    var get = function (k) { var v = opt.get(k); return v == null ? '' : String(v); };
    var set = opt.set, couple = opt.mode === 'couple';
    var cur = 0, reviewIdx = S.length;
    el.className = (el.className ? el.className + ' ' : '') + 'pf';
    if (opt.topOffset) el.style.setProperty('--pf-top', opt.topOffset);

    function inp(k, type, ph, extra) {
      var v = get(k);
      if (type === 'area') return '<textarea class="pf-in" data-k="' + k + '" rows="3" placeholder="' + esc(ph || '') + '">' + esc(v) + '</textarea>';
      var t = type === 'num' ? 'text" inputmode="numeric' : type === 'tel' ? 'tel' : type === 'time' ? 'time' : type === 'link' ? 'url" inputmode="url' : 'text';
      var ac = type === 'tel' ? ' autocomplete="tel"' : ' autocomplete="off"';
      return '<input class="pf-in" data-k="' + k + '" type="' + t + '" value="' + esc(v) + '" placeholder="' + esc(ph || '') + '"' + ac + (extra || '') + '>';
    }
    function chips(k, opts, multi) {
      var v = get(k), sel = v.split(', ');
      return '<div class="pf-chips" data-ck="' + k + '" data-multi="' + (multi ? 1 : 0) + '">' + opts.map(function (o) {
        return '<button type="button" class="pf-chip' + (sel.indexOf(o) > -1 ? ' on' : '') + '" data-v="' + esc(o) + '">' + esc(o) + '</button>';
      }).join('') + '</div>';
    }
    function isPeople(k) { return k === 'wp_list'; }
    function songRow(i, r, k) {
      var pp = isPeople(k);
      return '<div class="pf-srow"><span class="pf-num">' + (i + 1) + '</span><input class="pf-in pf-st" placeholder="' + (pp ? 'Name' : 'Song title') + '" value="' + esc(r.t) + '" autocomplete="off"><input class="pf-in pf-sa" placeholder="' + (pp ? 'Role (bridesmaid, groomsman...)' : 'Artist') + '" value="' + esc(r.a) + '" autocomplete="off"><button type="button" class="pf-x" data-del="' + i + '" aria-label="Remove">&times;</button></div>';
    }
    function songsHTML(k) {
      var list = parseList(get(k));
      if (!list.length) list = [{ t: '', a: '' }];
      return '<div class="pf-songs" data-list="' + k + '"><div class="pf-rows">' + list.map(function (r, i) { return songRow(i, r, k); }).join('') + '</div>' +
        '<div class="pf-sbar"><button type="button" class="pf-link" data-add="' + k + '">+ Add ' + (isPeople(k) ? 'a person' : 'a song') + '</button><button type="button" class="pf-link" data-paste="' + k + '">Paste a list</button></div>' +
        '<div class="pf-paste" data-pastebox="' + k + '"><p>' + (isPeople(k) ? 'One person per line. “Name - Role” works best.' : 'One song per line. “Title - Artist” works best.') + '</p><textarea class="pf-in" rows="5" placeholder="Shut Up and Dance - Walk the Moon&#10;Dancing Queen - ABBA"></textarea><div class="pf-sbar"><button type="button" class="pf-btn" style="min-height:44px;padding:9px 20px" data-addlist="' + k + '">Add these</button></div></div></div>';
    }
    function fieldHTML(f) {
      var lab = '<label>' + esc(f.l) + (f.h && f.t !== 'songs' && f.t !== 'area' && f.t !== 'text' && f.t !== 'chips' ? '' : '') + '</label>';
      var hint = f.h ? ' <i>' + esc(f.h) + '</i>' : '';
      var L = function (t) { return '<label>' + esc(t) + hint + '</label>'; };
      var body;
      switch (f.t) {
        case 'contact': body = L(f.l) + '<div class="pf-row">' + inp(f.k + '_n', 'text', 'Name') + inp(f.k + '_p', 'tel', 'Phone') + '</div>'; break;
        case 'song': body = L(f.l) + '<div class="pf-row">' + inp(f.k + '_t', 'text', 'Song title') + inp(f.k + '_a', 'text', 'Artist') + '</div>'; break;
        case 'party': body = L(f.l) + '<div class="pf-row3"><div class="pf-first">' + inp(f.k + '_n', 'text', 'Names') + '</div>' + inp(f.k + '_t', 'text', 'Song') + inp(f.k + '_a', 'text', 'Artist') + '</div>'; break;
        case 'people': case 'songs': body = L(f.l) + songsHTML(f.k); break;
        case 'choice': body = L(f.l) + chips(f.k, f.o, false); break;
        case 'chips': body = L(f.l) + chips(f.k, f.o, true); break;
        case 'area': body = L(f.l) + inp(f.k, 'area'); break;
        default: body = L(f.l) + inp(f.k, f.t);
      }
      var wide = f.w || f.t === 'contact' || f.t === 'song' || f.t === 'party' || f.t === 'songs' || f.t === 'people' || f.t === 'chips';
      return '<div class="pf-f' + (wide ? ' w' : '') + '">' + body + '</div>';
    }
    function tradHTML(f) {
      var on = get('t_' + f.k + '_on');
      return '<div class="pf-trad"><b>' + esc(f.l) + '</b><div class="pf-yn" data-yn="' + f.k + '"><button type="button" class="pf-chip' + (on === 'yes' ? ' on' : '') + '" data-v="yes">Yes</button><button type="button" class="pf-chip' + (on === 'no' ? ' on' : '') + '" data-v="no">No</button></div>' + inp('t_' + f.k + '_d', 'text', 'Details (optional)') + '</div>';
    }
    function build() {
      var c = counts(get);
      var tabs = '<div class="pf-tabs" role="tablist">' + S.map(function (s, i) {
        return '<button type="button" class="pf-tab' + (i === cur ? ' on' : '') + (c[i].off ? ' off' : c[i].n === c[i].t ? ' done' : '') + '" data-tab="' + i + '" role="tab"><b>' + String(i + 1).padStart(2, '0') + '</b>' + esc(s.t) + '<em>' + (c[i].off ? 'Off' : c[i].n + '/' + c[i].t) + '</em></button>';
      }).join('') + '<button type="button" class="pf-tab' + (cur === reviewIdx ? ' on' : '') + '" data-tab="' + reviewIdx + '" role="tab"><b>' + String(S.length + 1).padStart(2, '0') + '</b>Review</button></div>';
      var secs = S.map(function (s, i) {
        var g = s.f.map(function (f) {
          if (f.t === 'head') return '<div class="pf-head">' + esc(f.l) + '</div>';
          if (f.t === 'trads') return TRAD.map(function (t) { return tradHTML({ k: t[0], l: t[1] }); }).join('');
          return fieldHTML(f);
        }).join('');
        var nav = '<div class="pf-nav">' + (i > 0 ? '<button type="button" class="pf-btn ghost" data-go="' + (i - 1) + '">Back</button>' : '<span></span>') + '<button type="button" class="pf-btn" data-go="' + (i + 1) + '">' + (i === S.length - 1 ? 'Review' : 'Next') + '</button></div>';
        var isOff = c[i].off;
        var sw = s.id === 'overview' ? '' : '<label class="pf-sw"><input type="checkbox" data-sw="' + s.id + '"' + (isOff ? '' : ' checked') + '><i></i><span>Include</span></label>';
        return '<section class="pf-sec' + (i === cur ? ' on' : '') + (isOff ? ' off' : '') + '" data-sec="' + i + '" data-id="' + s.id + '"><div class="pf-top"><div><h2 class="pf-h">' + esc(s.t) + '</h2><p class="pf-s">' + esc(s.s) + '</p></div>' + sw + '</div><div class="pf-offmsg">Not part of this event. Turn it back on with the switch above.</div><div class="pf-g">' + g + '</div>' + nav + '</section>';
      }).join('');
      var rv = '<section class="pf-sec pf-review' + (cur === reviewIdx ? ' on' : '') + '" data-sec="' + reviewIdx + '"><h2 class="pf-h">Review</h2><p class="pf-s">' + (couple ? 'Here is everything so far. Tap Edit on any part to change it.' : 'Everything filled in so far.') + '</p><div id="pf-rv"></div>' +
        (couple ? '<div class="pf-send"><p id="pf-sendmsg"></p><button type="button" class="pf-btn" id="pf-sendbtn">Send to Cade</button></div>' : '') +
        '<div class="pf-nav"><button type="button" class="pf-btn ghost" data-go="' + (S.length - 1) + '">Back</button><span></span></div></section>';
      el.innerHTML = tabs + secs + rv;
      grow();
      sendState();
    }
    function grow() { el.querySelectorAll('textarea.pf-in').forEach(function (t) { t.style.height = 'auto'; t.style.height = Math.max(84, t.scrollHeight + 2) + 'px'; }); }
    function refreshTabs() {
      var c = counts(get);
      el.querySelectorAll('.pf-tab[data-tab]').forEach(function (b) {
        var i = +b.dataset.tab;
        if (i >= S.length) return;
        b.classList.toggle('off', !!c[i].off);
        b.classList.toggle('done', !c[i].off && c[i].n === c[i].t);
        b.querySelector('em').textContent = c[i].off ? 'Off' : c[i].n + '/' + c[i].t;
      });
    }
    function summary() {
      var h = '';
      var offs = offList(get);
      S.forEach(function (s, i) {
        if (offs.indexOf(s.id) > -1) { h += '<div class="pf-rv"><h4>' + esc(s.t) + '<button type="button" data-go="' + i + '">Edit</button></h4><div class="none">Not part of this event.</div></div>'; return; }
        var rows = '';
        fieldsOf(s, i).forEach(function (f) {
          if (!filled(f, get)) return;
          var v;
          if (f.t === 'contact') v = [get(f.k + '_n'), get(f.k + '_p')].filter(Boolean).join(' · ');
          else if (f.t === 'song') v = [get(f.k + '_t'), get(f.k + '_a')].filter(Boolean).join(' - ');
          else if (f.t === 'party') v = [get(f.k + '_n'), [get(f.k + '_t'), get(f.k + '_a')].filter(Boolean).join(' - ')].filter(Boolean).join(' · ');
          else if (f.t === 'songs' || f.t === 'people') v = parseList(get(f.k)).map(function (r, j) { return (j + 1) + '. ' + [r.t, r.a].filter(Boolean).join(' - '); }).join('\n');
          else if (f.t === 'trad') v = [get('t_' + f.k + '_on') === 'yes' ? 'Yes' : get('t_' + f.k + '_on') === 'no' ? 'No' : '', get('t_' + f.k + '_d')].filter(Boolean).join(' · ');
          else v = get(f.k);
          rows += '<dt>' + esc(f.l) + '</dt><dd>' + esc(v) + '</dd>';
        });
        h += '<div class="pf-rv"><h4>' + esc(s.t) + '<button type="button" data-go="' + i + '">Edit</button></h4>' + (rows ? '<dl>' + rows + '</dl>' : '<div class="none">Nothing yet.</div>') + '</div>';
      });
      el.querySelector('#pf-rv').innerHTML = h;
    }
    function sendState() {
      var m = el.querySelector('#pf-sendmsg'), b = el.querySelector('#pf-sendbtn');
      if (!m) return;
      var done = opt.submitted && opt.submitted();
      m.textContent = done ? 'Sent. You can keep editing and send again any time.' : 'When you are ready, send it over. You can come back and change things later with this same link.';
      b.textContent = done ? 'Send update to Cade' : 'Send to Cade';
    }
    function go(i) {
      if (i < 0 || i > reviewIdx) return;
      cur = i;
      el.querySelectorAll('.pf-tab').forEach(function (b) { b.classList.toggle('on', +b.dataset.tab === i); });
      el.querySelectorAll('.pf-sec').forEach(function (s) { s.classList.toggle('on', +s.dataset.sec === i); });
      if (i === reviewIdx) summary();
      var tab = el.querySelector('.pf-tab.on');
      if (tab && tab.scrollIntoView) { try { tab.scrollIntoView({ inline: 'center', block: 'nearest' }); } catch (e) { } }
      grow();
      var top = el.getBoundingClientRect().top;
      if (top < 0 || opt.scrollTo) { var sc = opt.scroller || window; if (sc.scrollTo) sc.scrollTo({ top: (sc === window ? window.scrollY : sc.scrollTop) + top - (opt.scrollPad || 0), behavior: 'auto' }); }
    }
    function readList(box) {
      var out = [];
      box.querySelectorAll('.pf-srow').forEach(function (r) {
        var t = r.querySelector('.pf-st').value.trim(), a = r.querySelector('.pf-sa').value.trim();
        if (t || a) out.push({ t: t, a: a });
      });
      return out;
    }
    function saveList(box) { var o = readList(box); set(box.dataset.list, o.length ? JSON.stringify(o) : ''); }
    function renumber(box) { box.querySelectorAll('.pf-srow').forEach(function (r, i) { r.querySelector('.pf-num').textContent = i + 1; r.querySelector('.pf-x').dataset.del = i; }); }
    function addRow(box, focus) {
      var rows = box.querySelector('.pf-rows');
      var d = document.createElement('div'); d.innerHTML = songRow(rows.children.length, { t: '', a: '' }, box.dataset.list);
      rows.appendChild(d.firstChild);
      if (focus) rows.lastChild.querySelector('.pf-st').focus();
    }

    el.addEventListener('input', function (e) {
      var t = e.target;
      if (t.dataset && t.dataset.k) { set(t.dataset.k, t.value); if (t.tagName === 'TEXTAREA') grow(); refreshTabs(); return; }
      var box = t.closest && t.closest('[data-list]');
      if (box && t.classList.contains('pf-in') && t.closest('.pf-srow')) { saveList(box); refreshTabs(); }
    });
    el.addEventListener('change', function (e) {
      var t = e.target;
      if (!t.dataset || !t.dataset.sw) return;
      var offs = offList(get), id = t.dataset.sw, ix = offs.indexOf(id);
      if (t.checked && ix > -1) offs.splice(ix, 1);
      if (!t.checked && ix < 0) offs.push(id);
      set('sec_off', offs.join(','));
      t.closest('.pf-sec').classList.toggle('off', !t.checked);
      refreshTabs();
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.classList.contains('pf-sa')) {
        e.preventDefault();
        var box = e.target.closest('[data-list]'), row = e.target.closest('.pf-srow');
        if (row === box.querySelector('.pf-rows').lastElementChild) addRow(box, true); else row.nextElementSibling.querySelector('.pf-st').focus();
      }
    });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b || !el.contains(b)) return;
      if (b.dataset.tab !== undefined) return go(+b.dataset.tab);
      if (b.dataset.go !== undefined) return go(+b.dataset.go);
      var cc = b.closest('[data-ck]');
      if (cc && b.classList.contains('pf-chip')) {
        var k = cc.dataset.ck, v = b.dataset.v, multi = cc.dataset.multi === '1';
        var sel = get(k) ? get(k).split(', ') : [];
        if (multi) { var ix = sel.indexOf(v); if (ix > -1) sel.splice(ix, 1); else sel.push(v); }
        else sel = sel[0] === v ? [] : [v];
        cc.querySelectorAll('.pf-chip').forEach(function (x) { x.classList.toggle('on', sel.indexOf(x.dataset.v) > -1); });
        set(k, sel.join(', ')); refreshTabs(); return;
      }
      var yn = b.closest('[data-yn]');
      if (yn) {
        var key = 't_' + yn.dataset.yn + '_on', now = get(key), nv = now === b.dataset.v ? '' : b.dataset.v;
        yn.querySelectorAll('.pf-chip').forEach(function (x) { x.classList.toggle('on', x.dataset.v === nv); });
        set(key, nv); refreshTabs(); return;
      }
      if (b.dataset.add) { addRow(b.closest('[data-list]'), true); return; }
      if (b.dataset.del !== undefined) {
        var box = b.closest('[data-list]'), rows = box.querySelector('.pf-rows');
        if (rows.children.length > 1) b.closest('.pf-srow').remove();
        else { b.closest('.pf-srow').querySelectorAll('input').forEach(function (x) { x.value = ''; }); }
        renumber(box); saveList(box); refreshTabs(); return;
      }
      if (b.dataset.paste) { var pb = b.closest('[data-list]').querySelector('.pf-paste'); pb.classList.toggle('on'); if (pb.classList.contains('on')) pb.querySelector('textarea').focus(); return; }
      if (b.dataset.addlist) {
        var bx = b.closest('[data-list]'), ta = bx.querySelector('.pf-paste textarea');
        var add = ta.value.split(/\r?\n/).map(function (l) { return l.replace(/^\s*(\d+[.)]|[-*•])\s*/, '').trim(); }).filter(Boolean).map(function (l) {
          var m = l.split(/\s+[-–—]\s+/); if (m.length < 2) m = l.split(/\s+by\s+/i);
          return m.length > 1 ? { t: m[0].trim(), a: m.slice(1).join(' - ').trim() } : { t: l, a: '' };
        });
        if (!add.length) return;
        var all = readList(bx).concat(add);
        set(bx.dataset.list, JSON.stringify(all));
        var rowsEl = bx.querySelector('.pf-rows'); rowsEl.innerHTML = all.map(function (r, i) { return songRow(i, r, bx.dataset.list); }).join('');
        ta.value = ''; bx.querySelector('.pf-paste').classList.remove('on'); refreshTabs(); return;
      }
      if (b.id === 'pf-sendbtn' && opt.onSubmit) {
        b.disabled = true; b.textContent = 'Sending...';
        Promise.resolve(opt.onSubmit()).then(function () { b.disabled = false; sendState(); }).catch(function () { b.disabled = false; sendState(); });
      }
    });
    function flash(i) { i.classList.add('pf-flash'); setTimeout(function () { i.classList.remove('pf-flash'); }, 1900); }
    function sync() {
      var n = 0, ae = document.activeElement;
      var offs = offList(get);
      el.querySelectorAll('[data-sw]').forEach(function (sw) {
        var on = offs.indexOf(sw.dataset.sw) < 0;
        if (sw.checked !== on) { sw.checked = on; sw.closest('.pf-sec').classList.toggle('off', !on); n++; }
      });
      el.querySelectorAll('[data-k]').forEach(function (i) {
        if (i === ae) return;
        var v = get(i.dataset.k);
        if (i.value !== v) { i.value = v; flash(i); n++; }
      });
      el.querySelectorAll('[data-ck]').forEach(function (cc) {
        var sel = get(cc.dataset.ck) ? get(cc.dataset.ck).split(', ') : [];
        cc.querySelectorAll('.pf-chip').forEach(function (x) { var on = sel.indexOf(x.dataset.v) > -1; if (x.classList.contains('on') !== on) { x.classList.toggle('on', on); n++; } });
      });
      el.querySelectorAll('[data-yn]').forEach(function (g) {
        var cv = get('t_' + g.dataset.yn + '_on');
        g.querySelectorAll('.pf-chip').forEach(function (x) { var on = x.dataset.v === cv; if (x.classList.contains('on') !== on) { x.classList.toggle('on', on); n++; } });
      });
      el.querySelectorAll('[data-list]').forEach(function (box) {
        if (ae && box.contains(ae)) return;
        var want = parseList(get(box.dataset.list)), have = readList(box);
        if (JSON.stringify(want) !== JSON.stringify(have)) {
          if (!want.length) want = [{ t: '', a: '' }];
          box.querySelector('.pf-rows').innerHTML = want.map(function (r, i) { return songRow(i, r, box.dataset.list); }).join('');
          flash(box); n++;
        }
      });
      if (n) { refreshTabs(); if (cur === reviewIdx) summary(); grow(); }
      return n;
    }
    build();
    return { refresh: function () { build(); }, go: go, sendState: sendState, sync: sync };
  }

  w.PlanForm = { mount: mount, pct: pct, sections: S, counts: counts };
})(window);
