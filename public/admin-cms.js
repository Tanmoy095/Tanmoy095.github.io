/* Portfolio Admin CMS: all privileged operations use the server API. */
(function () {
  const CFG = window.__ADMIN_CONFIG__ || {};
  const SESSION_KEY = 'portfolio_admin_session';
  const API_BASE = (CFG.apiBaseUrl || '').replace(/\/+$/, '');

  let state = {
    authenticated: false,
    serverMode: true,
    token: null,
    gitConfig: { branch: 'main' },
    profileData: null,
    profileSha: '',
    projectsData: [],
    projectsSha: '',
    blogsList: [],
    learningsList: [],
    knowledgeList: [],
    pendingImage: null,
  };

  // ─── Utilities ───────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }

  function toast(msg, type = 'info') {
    const el = $('cms-toast');
    if (!el) return alert(msg);
    el.textContent = msg;
    el.className = `fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl text-sm font-semibold shadow-lg transition-all ${
      type === 'error' ? 'bg-rose-600 text-white' : type === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white'
    }`;
    el.classList.remove('hidden', 'opacity-0');
    setTimeout(() => el.classList.add('opacity-0'), 3200);
    setTimeout(() => el.classList.add('hidden'), 3600);
  }

  function utf8_to_b64(str) {
    const bytes = new TextEncoder().encode(str);
    const binString = String.fromCodePoint(...bytes);
    return btoa(binString);
  }
  function b64_to_utf8(str) {
    const binString = atob(str);
    const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
    return new TextDecoder().decode(bytes);
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result.split(',')[1]);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  // Strip any embedded ?ref=... from a path before passing to apiRequest
  function cleanPath(path) {
    return path.replace(/\?ref=[^&]*/, '');
  }

  // ─── Auth ────────────────────────────────────────────────────
  async function detectServerMode() {
    if (!API_BASE) return { serverMode: false, error: 'PUBLIC_API_BASE_URL is missing. Configure the Vercel API URL and rebuild the site.' };
    try {
      const apiUrl = new URL(API_BASE);
      if (apiUrl.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(apiUrl.hostname)) throw new Error('The CMS API must use HTTPS.');
      const res = await fetch(`${API_BASE}/api/auth/verify`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `API returned ${res.status}`);
      state.serverMode = !!data.serverMode;
      return data;
    } catch (error) { return { serverMode: false, error: `CMS API unavailable: ${error.message}` }; }
  }

  async function login(email, password) {
    if (!state.serverMode) throw new Error('CMS server is unavailable. Check PUBLIC_API_BASE_URL and Vercel configuration.');
    {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      if (!data.token) throw new Error('CMS API did not return an authenticated session.');
      state.token = data.token;
      state.authenticated = true;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: data.token, exp: Date.now() + 30 * 60 * 1000, mode: 'server' }));
      return;
    }
  }

  async function logout() {
    try { await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', headers: state.token ? { Authorization: `Bearer ${state.token}` } : {} }); } catch {}
    sessionStorage.removeItem(SESSION_KEY);
    state.authenticated = false;
    state.token = null;
    showLogin();
  }

  function restoreSession() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    try {
      const s = JSON.parse(raw);
      if (Date.now() > s.exp) { sessionStorage.removeItem(SESSION_KEY); return false; }
      if (!s.token) { sessionStorage.removeItem(SESSION_KEY); return false; }
      state.authenticated = true;
      state.token = s.token;
      return true;
    } catch { return false; }
  }

  // ─── GitHub API (server proxy or direct PAT) ─────────────────
  async function apiRequest(rawPath, options = {}) {
    const path = cleanPath(rawPath);
    if (!API_BASE) throw new Error('PUBLIC_API_BASE_URL is not configured.');
    if (state.serverMode && state.token) {
      const method = options.method || 'GET';
      const headers = { Authorization: `Bearer ${state.token}` };
      if (method === 'GET') {
        return request(`${API_BASE}/api/github/proxy?path=${encodeURIComponent(path)}&ref=${encodeURIComponent(state.gitConfig.branch || 'main')}`, { headers });
      }
      const body = JSON.parse(options.body || '{}');
      return request(`${API_BASE}/api/github/proxy`, { method, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ path, ...body }) });
    }
    throw new Error('Sign in to the configured CMS API first.');
  }

  async function request(url, options = {}) {
    const res = await fetch(url, options);
    let data;
    try { data = await res.json(); } catch { data = {}; }
    if (!res.ok) throw new Error(data.error || `CMS API request failed (${res.status})`);
    return data;
  }

  // Fetch with ?ref= for GET-style reads (PAT direct mode)
  async function apiGet(path) {
    return apiRequest(path + '?ref=' + (state.gitConfig.branch || 'main'));
  }

  async function uploadImage(file, filename, target = 'blog-assets') {
    const base64 = await fileToBase64(file);
    if (state.serverMode && state.token) {
      const res = await fetch(`${API_BASE}/api/github/upload-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.token}` },
        body: JSON.stringify({ filename, contentBase64: base64, target, message: `cms: upload ${filename}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      return data.path;
    }
    throw new Error('Image upload requires an active server session.');
  }

  async function uploadDocument(file, filename) {
    const base64 = await fileToBase64(file);
    const result = await request(`${API_BASE}/api/github/upload-document`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.token}` },
      body: JSON.stringify({ filename, contentBase64: base64 }),
    });
    return result.path;
  }

  async function uploadCV(file) {
    const base64 = await fileToBase64(file);
    const cvPath = `public/cv.pdf`;
    let sha;
    try { const ex = await apiGet(cvPath); sha = ex.sha; } catch {}
    await apiRequest(cvPath, {
      method: 'PUT',
      body: JSON.stringify({ message: 'cms: upload CV / Resume', content: base64, sha, branch: state.gitConfig.branch }),
    });
    return `/cv.pdf`;
  }

  function updateCVStatusDisplay(cvUrl) {
    const titleEl = $('cv-status-title');
    const pathEl = $('cv-status-path');
    const btnDel = $('btn-delete-cv');
    if (!titleEl || !pathEl) return;
    if (cvUrl) {
      titleEl.textContent = 'Current CV';
      titleEl.className = 'text-sm font-semibold text-slate-950 dark:text-slate-100';
      pathEl.textContent = cvUrl;
      if (btnDel) btnDel.classList.remove('hidden');
    } else {
      titleEl.textContent = 'No CV uploaded';
      titleEl.className = 'text-sm font-semibold text-slate-400 dark:text-slate-500';
      pathEl.textContent = 'None';
      if (btnDel) btnDel.classList.add('hidden');
    }
  }

  async function uploadAvatar(file) {
    const base64 = await fileToBase64(file);
    const ext = file.name.split('.').pop() || 'jpg';
    const avatarPath = `public/profile-assets/profile-avatar.${ext}`;
    let sha;
    try { const ex = await apiGet(avatarPath); sha = ex.sha; } catch {}
    await apiRequest(avatarPath, {
      method: 'PUT',
      body: JSON.stringify({ message: 'cms: upload profile avatar', content: base64, sha, branch: state.gitConfig.branch }),
    });
    return `/profile-assets/profile-avatar.${ext}`;
  }

  function updateAvatarStatusDisplay(avatarUrl) {
    const titleEl = $('avatar-status-title');
    const pathEl = $('avatar-status-path');
    const btnDel = $('btn-delete-avatar');
    const imgPrev = $('prof-avatar-preview');
    const imgPlac = $('prof-avatar-placeholder');
    if (!titleEl || !pathEl) return;
    if (avatarUrl) {
      titleEl.textContent = 'Current Profile Photo';
      titleEl.className = 'text-sm font-semibold text-slate-950 dark:text-slate-100';
      pathEl.textContent = avatarUrl;
      if (btnDel) btnDel.classList.remove('hidden');
      if (imgPrev) {
        imgPrev.src = avatarUrl + '?t=' + Date.now();
        imgPrev.classList.remove('hidden');
      }
      if (imgPlac) imgPlac.classList.add('hidden');
    } else {
      titleEl.textContent = 'No photo uploaded';
      titleEl.className = 'text-sm font-semibold text-slate-400 dark:text-slate-500';
      pathEl.textContent = 'None';
      if (btnDel) btnDel.classList.add('hidden');
      if (imgPrev) {
        imgPrev.src = '';
        imgPrev.classList.add('hidden');
      }
      if (imgPlac) imgPlac.classList.remove('hidden');
    }
  }

  // ─── Frontmatter helpers ───────────────────────────────────────
  function parseFrontmatter(text) {
    // Normalize CRLF and lone CR to LF before regex matching
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { data: {}, body: normalized };
    const data = {};
    match[1].split('\n').forEach(line => {
      const idx = line.indexOf(':');
      if (idx < 1) return;
      const k = line.slice(0, idx).trim();
      let v = line.slice(idx + 1).trim();
      if (v.startsWith('"') && v.endsWith('"')) { try { v = JSON.parse(v); } catch { v = v.slice(1, -1); } }
      if (v === 'true') v = true;
      if (v === 'false') v = false;
      if (v.startsWith('[') && v.endsWith(']')) { try { v = JSON.parse(v); } catch { v = v.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean); } }
      data[k] = v;
    });
    return { data, body: match[2] };
  }

  function buildBlogFrontmatter(data, body) {
    const tags = (data.tags || []).map(t => `"${t}"`).join(', ');
    const image = data.image || `/blog-assets/${data.slug}.jpg`;
    return `---\ntitle: "${data.title}"\ndescription: "${data.description}"\npubDate: "${data.pubDate}"\nauthor: "${data.author || 'Aunmoy Dey Tanmoy'}"\ntags: [${tags}]\nimage: "${image}"\n---\n\n${body}`;
  }

  function buildLearningFrontmatter(data, body) {
    let yaml = `---\ntitle: "${data.title}"\ndate: "${data.date}"\ncategory: "${data.category}"\ntags: [${(data.tags || []).map(t => `"${t}"`).join(', ')}]\nisADR: ${!!data.isADR}\n`;
    if (data.isADR && data.adrStatus) yaml += `adrStatus: "${data.adrStatus}"\n`;
    if (data.image) yaml += `image: "${data.image}"\n`;
    return yaml + `---\n\n${body}`;
  }

  const KNOWLEDGE_FIELDS = {
    type:'type',status:'status',title:'title',description:'description',category:'category',tags:'tags',date:'date',order:'order',featured:'featured',seoTitle:'seo-title',seoDescription:'seo-description',coverImage:'cover',coverAlt:'cover-alt',gallery:'gallery',galleryCaptions:'gallery-captions',abstract:'abstract',researchQuestion:'question',objectives:'objectives',background:'background',literatureReview:'literature',methodology:'methodology',materialsAndMethods:'materials',findings:'findings',discussion:'discussion',conclusion:'conclusion',references:'references',documents:'documents',university:'university',degree:'degree',department:'department',faculty:'faculty',graduationYear:'graduation',startDate:'start',endDate:'end',academicInterests:'interests',academicQualifications:'qualifications',achievements:'achievements',coursework:'coursework',researchInterests:'research-interests',relevantLinks:'relevant-links',relatedProjects:'related-projects',thesisTitle:'thesis',country:'country',location:'location',visitedPlaces:'places',travelStart:'travel-start',travelEnd:'travel-end',bookTitle:'book-title',bookAuthor:'book-author',publisher:'publisher',edition:'edition',readingStatus:'reading-status',readingStart:'reading-start',readingEnd:'reading-end',concepts:'concepts',quoteText:'quote',quoteAuthor:'quote-author',quoteSource:'quote-source',quotePage:'quote-page',interpretation:'interpretation',takeaways:'takeaways'
  };
  const KNOWLEDGE_ARRAYS = new Set(['gallery','galleryCaptions','references','documents','academicInterests','academicQualifications','achievements','coursework','researchInterests','relevantLinks','relatedProjects','visitedPlaces','concepts','takeaways']);
  function knowledgeValue(data, key) {
    if (KNOWLEDGE_ARRAYS.has(key)) return (data[key] || []).map(x => JSON.stringify(String(x))).join(', ');
    if (key === 'featured') return String(!!data[key]);
    if (key === 'order') return String(data[key] ?? 0);
    return JSON.stringify(data[key] ?? '');
  }
  function buildKnowledgeFrontmatter(data, body) {
    const lines = ['---'];
    for (const [key, id] of Object.entries(KNOWLEDGE_FIELDS)) {
      const v = data[key];
      if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) continue;
      lines.push(`${key}: ${knowledgeValue(data, key)}`);
    }
    lines.push('---', '', body || '');
    return lines.join('\n');
  }
  function knowledgeFormData() {
    const out = {};
    for (const [key,id] of Object.entries(KNOWLEDGE_FIELDS)) {
      const el = $(`knowledge-${id}`); if (!el) continue;
      if (key === 'featured') out[key] = el.checked;
      else if (key === 'tags') out[key] = el.value.split(',').map(x=>x.trim()).filter(Boolean);
      else if (KNOWLEDGE_ARRAYS.has(key)) out[key] = el.value.split('\n').map(x=>x.trim()).filter(Boolean);
      else if (key === 'order') out[key] = Number(el.value || 0);
      else out[key] = el.value.trim();
    }
    return out;
  }
  function setKnowledgeForm(data = {}) {
    for (const [key,id] of Object.entries(KNOWLEDGE_FIELDS)) {
      const el = $(`knowledge-${id}`); if (!el) continue;
      if (key === 'featured') el.checked = !!data[key];
      else if (key === 'tags') el.value = (data[key] || []).join(', ');
      else if (KNOWLEDGE_ARRAYS.has(key)) el.value = (data[key] || []).join('\n');
      else el.value = data[key] instanceof Date ? data[key].toISOString().slice(0,10) : (data[key] ?? '');
    }
    document.querySelectorAll('.knowledge-fields').forEach(el => el.classList.toggle('hidden', !el.dataset.types.split(',').includes($('knowledge-type').value)));
  }
  function renderKnowledge() {
    const list = $('knowledge-list'); if (!list) return;
    const q = ($('knowledge-search').value || '').toLowerCase();
    const type = $('knowledge-type-filter').value, status = $('knowledge-status-filter').value;
    const items = state.knowledgeList.filter(x => (type === 'all' || x.data.type === type) && (status === 'all' || x.data.status === status) && `${x.data.title} ${x.data.description} ${(x.data.tags||[]).join(' ')}`.toLowerCase().includes(q));
    $('knowledge-prompt').classList.toggle('hidden', items.length > 0);
    if (!items.length) $('knowledge-prompt').textContent = 'No entries match. Create a draft to start.';
    list.replaceChildren(...items.map(x => {
      const card = document.createElement('article'); card.className='rounded-xl border border-slate-200 p-4 dark:border-slate-800';
      const title = document.createElement('h3'); title.className='font-bold'; title.textContent=x.data.title || x.path;
      const meta = document.createElement('p'); meta.className='my-2 text-xs text-slate-500'; meta.textContent=`${x.data.type} · ${x.data.status} · ${x.path}`;
      const actions=document.createElement('div'); actions.className='flex gap-2';
      const edit=document.createElement('button'); edit.type='button'; edit.className='btn-secondary rounded-lg px-3 py-2 text-xs'; edit.textContent='Edit'; edit.onclick=()=>openKnowledge(x);
      const del=document.createElement('button'); del.type='button'; del.className='rounded-lg px-3 py-2 text-xs text-rose-600'; del.textContent='Delete'; del.onclick=()=>deleteKnowledge(x);
      actions.append(edit,del); card.append(title,meta,actions); return card;
    }));
  }
  async function loadKnowledge() {
    const list = await apiGet('src/content/knowledge');
    state.knowledgeList = await Promise.all((Array.isArray(list) ? list : []).filter(f=>f.type==='file' && f.name.endsWith('.md')).map(async f=>{
      const res=await apiGet(f.path); const parsed=parseFrontmatter(b64_to_utf8(res.content.replace(/\s/g,'')));
      let data=parsed.data;
      for (const [key,value] of Object.entries(data)) {
        if (typeof value === 'string' && value.startsWith('[')) { try { data[key]=JSON.parse(value); } catch {} }
        else if (typeof value === 'string' && value.startsWith('"')) { try { data[key]=JSON.parse(value); } catch {} }
      }
      return {path:f.path,sha:res.sha,data,body:parsed.body};
    }));
    renderKnowledge();
  }
  function openKnowledge(item) {
    $('knowledge-form').classList.remove('hidden'); $('knowledge-sha').value=item?.sha||''; $('knowledge-path').value=item?.path||'';
    $('knowledge-form-title').textContent=item?'Edit: '+(item.data.title||item.path):'New knowledge entry';
    $('knowledge-slug').value=item?.path?.split('/').pop().replace(/\.md$/,'')||'';
    setKnowledgeForm(item?{...item.data,date:item.data.date instanceof Date?item.data.date.toISOString().slice(0,10):item.data.date}:{});
    $('knowledge-body').value=item?.body||'';
    $('knowledge-delete').classList.toggle('hidden',!item); $('knowledge-form').scrollIntoView({behavior:'smooth',block:'start'});
  }
  async function deleteKnowledge(item) {
    if (!confirm('Delete this entry permanently?')) return;
    try { await apiRequest(item.path,{method:'DELETE',body:JSON.stringify({message:'cms: delete knowledge entry',sha:item.sha,branch:state.gitConfig.branch})}); toast('Entry deleted','success'); await loadKnowledge(); }
    catch(e){toast(e.message,'error');}
  }
  async function saveKnowledge(status) {
    if (status === 'private') { toast('Private entries are disabled until a private content store is configured; this repository is public.','error'); return; }
    const slug=$('knowledge-slug').value.trim();
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)){toast('Use a lowercase URL slug with letters, numbers, and hyphens.','error');return;}
    const data=knowledgeFormData(); data.status=status;
    if(!data.title){toast('Title is required.','error');return;}
    const oldPath=$('knowledge-path').value, sha=$('knowledge-sha').value, path=`src/content/knowledge/${slug}.md`;
    const md=buildKnowledgeFrontmatter(data,$('knowledge-body').value);
    try{
      await apiRequest(path,{method:'PUT',body:JSON.stringify({message:`cms: save ${status} knowledge entry ${slug}`,content:utf8_to_b64(md),sha:oldPath===path?sha:undefined,branch:state.gitConfig.branch})});
      if(oldPath&&oldPath!==path&&sha) await apiRequest(oldPath,{method:'DELETE',body:JSON.stringify({message:`cms: remove renamed knowledge entry ${slug}`,sha,branch:state.gitConfig.branch})});
      $('knowledge-form').classList.add('hidden'); toast(status==='published'?'Entry published; site deployment will update shortly.':'Draft saved; this entry remains private.','success'); await loadKnowledge();
    }catch(err){toast(err.message,'error');}
  }

  // ─── UI: Login / Dashboard ───────────────────────────────────
  function showLogin() {
    $('login-screen')?.classList.remove('hidden');
    $('dashboard-screen')?.classList.add('hidden');
    updateBadge(false);
  }

  function showDashboard() {
    $('login-screen')?.classList.add('hidden');
    $('dashboard-screen')?.classList.remove('hidden');
    $('mode-label').textContent = state.serverMode ? 'Server Mode (Vercel)' : 'Client Mode (GitHub PAT)';
    $('pat-settings')?.classList.toggle('hidden', state.serverMode);
    updateBadge(true);
    autoLoadAll();
  }

  function updateBadge(ok) {
    const badge = $('status-badge');
    if (!badge) return;
    if (ok) {
      badge.className = 'px-4 py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-2';
      badge.innerHTML = '<span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Authenticated';
    } else {
      badge.className = 'px-4 py-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-2';
      badge.innerHTML = '<span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span> Locked';
    }
  }

  function switchTab(targetId) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
    document.getElementById(targetId)?.classList.remove('hidden');
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.target === targetId);
    });
  }

  // ─── Visual Editors ────────────────────────────────────────────
  function renderSkillsEditor(skills) {
    const el = $('skills-editor');
    if (!el) return;
    el.innerHTML = '';
    (skills || []).forEach((cat, ci) => {
      const card = document.createElement('div');
      card.className = 'p-4 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3';
      card.innerHTML = `
        <div class="flex gap-2">
          <input type="text" class="form-input skill-cat" data-idx="${ci}" value="${escHtml(cat.category)}" placeholder="Category name" />
          <button type="button" class="btn-del-skill-cat px-3 text-rose-600 text-xs font-bold" data-idx="${ci}">✕</button>
        </div>
        <div class="skill-items space-y-2" data-cat="${ci}"></div>
        <button type="button" class="btn-add-skill-item text-xs text-indigo-600 font-semibold" data-cat="${ci}">+ Add skill</button>`;
      el.appendChild(card);
      const itemsEl = card.querySelector('.skill-items');
      (cat.items || []).forEach((item, ii) => {
        itemsEl.innerHTML += `<div class="flex gap-2"><input type="text" class="form-input skill-item" data-cat="${ci}" data-item="${ii}" value="${escHtml(item)}" /><button type="button" class="btn-del-skill-item text-rose-500 text-xs" data-cat="${ci}" data-item="${ii}">✕</button></div>`;
      });
    });
    bindSkillsEditor();
  }

  function collectSkills() {
    const cats = [...document.querySelectorAll('#skills-editor > div')];
    return cats.map(card => ({
      category: card.querySelector('.skill-cat')?.value?.trim() || '',
      items: [...card.querySelectorAll('.skill-item')].map(i => i.value.trim()).filter(Boolean),
    })).filter(c => c.category);
  }

  function bindSkillsEditor() {
    document.querySelectorAll('.btn-del-skill-cat').forEach(btn => btn.onclick = () => {
      renderSkillsEditor(collectSkills().filter((_, i) => i !== +btn.dataset.idx));
    });
    document.querySelectorAll('.btn-add-skill-item').forEach(btn => btn.onclick = () => {
      const skills = collectSkills();
      const ci = +btn.dataset.cat;
      skills[ci].items.push('');
      renderSkillsEditor(skills);
    });
    document.querySelectorAll('.btn-del-skill-item').forEach(btn => btn.onclick = () => {
      const skills = collectSkills();
      const ci = +btn.dataset.cat, ii = +btn.dataset.item;
      skills[ci].items.splice(ii, 1);
      renderSkillsEditor(skills);
    });
  }

  function renderListEditor(containerId, items, fields, withBullets = false) {
    const el = $(containerId);
    if (!el) return;
    el.innerHTML = '';
    (items || []).forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'p-4 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2';
      fields.forEach(f => {
        const wrap = document.createElement('div');
        const label = document.createElement('label');
        label.className = 'label-heading';
        label.textContent = f.label;
        wrap.appendChild(label);
        let input;
        if (f.type === 'textarea') {
          input = document.createElement('textarea');
          input.rows = f.rows || 3;
          input.value = item[f.key] || '';
        } else {
          input = document.createElement('input');
          input.type = f.input || 'text';
          input.value = item[f.key] || '';
        }
        input.className = 'form-input list-field';
        input.dataset.field = f.key;
        wrap.appendChild(input);
        card.appendChild(wrap);
      });
      if (withBullets) {
        const wrap = document.createElement('div');
        const label = document.createElement('label');
        label.className = 'label-heading';
        label.textContent = 'Bullet Points (one per line)';
        wrap.appendChild(label);
        const ta = document.createElement('textarea');
        ta.className = 'form-input list-bullets';
        ta.rows = 4;
        ta.value = (item.bullets || []).join('\n');
        wrap.appendChild(ta);
        card.appendChild(wrap);
      }
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn-del-list-item text-xs text-rose-600 font-bold';
      del.dataset.container = containerId;
      del.dataset.idx = String(idx);
      del.textContent = 'Remove';
      card.appendChild(del);
      el.appendChild(card);
    });
    el.querySelectorAll('.btn-del-list-item').forEach(btn => btn.onclick = () => {
      const collected = collectListEditor(containerId, fields, withBullets);
      collected.splice(+btn.dataset.idx, 1);
      renderListEditor(containerId, collected, fields, withBullets);
    });
  }

  function collectListEditor(containerId, fields, withBullets = false) {
    const el = $(containerId);
    return [...el.children].map(card => {
      const obj = {};
      fields.forEach(f => {
        const input = card.querySelector(`[data-field="${f.key}"]`);
        if (input) obj[f.key] = input.value.trim();
      });
      if (withBullets) {
        const bullets = card.querySelector('.list-bullets');
        obj.bullets = bullets ? bullets.value.split('\n').map(s => s.trim()).filter(Boolean) : [];
      }
      return obj;
    });
  }

  function renderProjFeaturesEditor(features) {
    const el = $('proj-features-editor');
    if (!el) return;
    el.innerHTML = '';
    (features || []).forEach((feat, idx) => {
      const card = document.createElement('div');
      card.className = 'p-3 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2';
      card.innerHTML = `
        <div class="flex gap-2">
          <input type="text" class="form-input feat-title flex-1" data-idx="${idx}" value="${escHtml(feat.title)}" placeholder="Feature Title (e.g. AI Gateway)" />
          <button type="button" class="btn-del-proj-feat text-rose-500 text-xs px-2" data-idx="${idx}">✕</button>
        </div>
        <textarea class="form-input feat-detail" rows="2" placeholder="Feature Detail Description...">${escHtml(feat.detail)}</textarea>`;
      el.appendChild(card);
    });
    bindProjFeaturesEditor();
  }

  function collectProjFeatures() {
    const cards = [...document.querySelectorAll('#proj-features-editor > div')];
    return cards.map(card => ({
      title: card.querySelector('.feat-title')?.value?.trim() || '',
      detail: card.querySelector('.feat-detail')?.value?.trim() || '',
    })).filter(f => f.title);
  }

  function bindProjFeaturesEditor() {
    document.querySelectorAll('.btn-del-proj-feat').forEach(btn => btn.onclick = () => {
      renderProjFeaturesEditor(collectProjFeatures().filter((_, i) => i !== +btn.dataset.idx));
    });
  }

  function renderRolesEditor(roles) {
    const el = $('roles-editor');
    if (!el) return;
    el.innerHTML = (roles || []).map((r, i) =>
      `<div class="flex gap-2 mb-2"><input type="text" class="form-input role-item" data-idx="${i}" value="${escHtml(r)}" /><button type="button" class="btn-del-role text-rose-500 text-xs" data-idx="${i}">✕</button></div>`
    ).join('');
    el.querySelectorAll('.btn-del-role').forEach(btn => btn.onclick = () => {
      const roles = [...document.querySelectorAll('.role-item')].map(i => i.value.trim()).filter(Boolean);
      roles.splice(+btn.dataset.idx, 1);
      renderRolesEditor(roles);
    });
  }

  // Escape HTML for safe injection into innerHTML
  function escHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ─── Section Loading States ────────────────────────────────────
  function setTabLoading(tabId, loading) {
    const el = document.getElementById(tabId);
    const existing = el?.querySelector('.tab-loading-indicator');
    if (loading && !existing) {
      const ind = document.createElement('div');
      ind.className = 'tab-loading-indicator text-sm text-slate-400 animate-pulse py-4';
      ind.textContent = 'Loading from GitHub...';
      el?.prepend(ind);
    } else if (!loading && existing) {
      existing.remove();
    }
  }

  function setTabError(promptId, msg) {
    const el = $(promptId);
    if (!el) return;
    el.textContent = `⚠ ${msg}`;
    el.className = 'text-rose-500 text-sm text-center py-4';
    el.classList.remove('hidden');
  }

  // ─── Data Loaders ──────────────────────────────────────────────
  async function loadProfile() {
    setTabLoading('tab-profile', true);
    const res = await apiGet('src/data/profile.json');
    state.profileSha = res.sha;
    state.profileData = JSON.parse(b64_to_utf8(res.content.replace(/\s/g, '')));
    $('prof-name').value = state.profileData.name || '';
    $('prof-title').value = state.profileData.title || '';
    $('prof-email').value = state.profileData.email || '';
    $('prof-phone').value = state.profileData.phone || '';
    $('prof-location').value = state.profileData.location || '';
    $('prof-github').value = state.profileData.github || '';
    $('prof-linkedin').value = state.profileData.linkedin || '';
    $('prof-twitter').value = state.profileData.twitter || '';
    const cvUrlVal = state.profileData.cvUrl !== undefined ? state.profileData.cvUrl : '/cv.pdf';
    $('prof-cv-url').value = cvUrlVal;
    updateCVStatusDisplay(cvUrlVal);
    const avatarUrlVal = state.profileData.avatarUrl || '';
    $('prof-avatar-url').value = avatarUrlVal;
    updateAvatarStatusDisplay(avatarUrlVal);
    $('prof-summary').value = state.profileData.summary || '';
    $('prof-detailedSummary').value = state.profileData.detailedSummary || '';
    $('prof-objective').value = state.profileData.objective || '';
    $('prof-recruiter').value = state.profileData.recruiterSummary || '';
    renderSkillsEditor(state.profileData.skills);
    renderRolesEditor(state.profileData.targetRoles);
    renderListEditor('highlights-editor', state.profileData.experienceHighlights,
      [{ key: 'title', label: 'Title' }, { key: 'description', label: 'Description', type: 'textarea', rows: 3 }]);
    renderListEditor('education-editor', state.profileData.education || [],
      [{ key: 'degree', label: 'Degree' }, { key: 'institution', label: 'Institution' }, { key: 'period', label: 'Year / Period' }, { key: 'status', label: 'Status' }]);
    renderListEditor('history-editor', state.profileData.workHistory,
      [{ key: 'role', label: 'Role' }, { key: 'company', label: 'Company' }, { key: 'period', label: 'Period' }, { key: 'description', label: 'Description', type: 'textarea', rows: 3 }], true);
    $('profile-form').classList.remove('hidden');
    $('profile-prompt').classList.add('hidden');
    $('stat-profile').textContent = 'Loaded';
    setTabLoading('tab-profile', false);
  }

  async function loadProjects() {
    setTabLoading('tab-projects', true);
    const res = await apiGet('src/data/projects.json');
    state.projectsSha = res.sha;
    state.projectsData = JSON.parse(b64_to_utf8(res.content.replace(/\s/g, '')));
    renderProjectsList();
    $('projects-prompt').classList.add('hidden');
    $('btn-add-project').classList.remove('hidden');
    $('btn-publish-projects').classList.remove('hidden');
    $('stat-projects').textContent = state.projectsData.length;
    setTabLoading('tab-projects', false);
  }

  async function publishProjects() {
    return apiRequest('src/data/projects.json', {
      method: 'PUT',
      body: JSON.stringify({
        message: 'cms: update projects',
        content: utf8_to_b64(JSON.stringify(state.projectsData, null, 2)),
        sha: state.projectsSha,
        branch: state.gitConfig.branch
      }),
    }).then(res => {
      state.projectsSha = res.content?.sha || res.sha;
    });
  }

  function renderProjectsList() {
    const el = $('projects-list-container');
    el.innerHTML = state.projectsData.length ? '' : '<p class="text-slate-400 text-sm text-center py-6">No projects yet.</p>';
    state.projectsData.forEach((p, idx) => {
      const card = document.createElement('div');
      card.className = 'p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-center gap-3';
      card.innerHTML = `<div class="flex-1 min-w-0"><h4 class="font-bold truncate">${escHtml(p.name)}</h4><p class="text-xs text-slate-500 truncate">${escHtml(p.tagline)}</p></div>
        <div class="flex gap-2 flex-shrink-0"><button class="btn-edit-proj btn-secondary py-1 px-3 text-xs" data-idx="${idx}">Edit</button>
        <button class="btn-del-proj text-rose-600 text-xs font-bold px-2 py-1 border border-rose-200 dark:border-rose-900/30 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition" data-idx="${idx}">Delete</button></div>`;
      el.appendChild(card);
    });
    el.querySelectorAll('.btn-edit-proj').forEach(b => b.onclick = () => openProjectForm(+b.dataset.idx));
    el.querySelectorAll('.btn-del-proj').forEach(b => b.onclick = async () => {
      if (!confirm('Delete this project permanently?')) return;
      try {
        state.projectsData.splice(+b.dataset.idx, 1);
        await publishProjects();
        renderProjectsList();
        toast('Project deleted and published live!', 'success');
      } catch (e) { toast('Failed to delete project: ' + e.message, 'error'); }
    });
  }

  async function loadBlogs() {
    setTabLoading('tab-blogs', true);
    const dirRes = await apiGet('src/content/blog');
    const mdFiles = dirRes.filter(i => i.name.endsWith('.md'));
    state.blogsList = mdFiles;

    // Fetch all file contents in parallel to extract titles
    const enriched = await Promise.all(mdFiles.map(async f => {
      try {
        const fileRes = await apiGet(f.path);
        const content = b64_to_utf8(fileRes.content.replace(/\s/g, ''));
        const { data } = parseFrontmatter(content);
        return { ...f, sha: fileRes.sha, title: data.title || f.name, pubDate: data.pubDate || '', description: data.description || '', tags: data.tags || [] };
      } catch {
        return { ...f, title: f.name, pubDate: '', description: '', tags: [] };
      }
    }));
    state.blogsList = enriched;

    renderBlogsList();
    $('blogs-prompt').classList.add('hidden');
    $('btn-create-blog').classList.remove('hidden');
    $('stat-blogs').textContent = enriched.length;
    setTabLoading('tab-blogs', false);
  }

  function renderBlogsList() {
    const el = $('blogs-list-container');
    el.innerHTML = state.blogsList.length ? '' : '<p class="text-slate-400 text-sm text-center py-6">No blog posts yet. Create your first one!</p>';
    state.blogsList.forEach(f => {
      const card = document.createElement('div');
      card.className = 'p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-start gap-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition';
      const dateStr = f.pubDate ? new Date(f.pubDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
      const tagsHtml = (f.tags || []).slice(0, 3).map(t => `<span class="bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] px-2 py-0.5 rounded font-medium">${escHtml(t)}</span>`).join('');
      card.innerHTML = `<div class="flex-1 min-w-0">
          <h4 class="font-bold text-sm leading-tight mb-0.5">${escHtml(f.title)}</h4>
          <p class="text-xs text-slate-400 mb-1.5">${escHtml(f.description).slice(0, 100)}${f.description.length > 100 ? '…' : ''}</p>
          <div class="flex items-center gap-2 flex-wrap">${dateStr ? `<span class="text-[10px] text-slate-400 font-mono">${escHtml(dateStr)}</span>` : ''}<span class="text-[10px] text-slate-300">|</span><span class="text-[10px] font-mono text-slate-400">${escHtml(f.name)}</span>${tagsHtml}</div>
        </div>
        <div class="flex gap-2 flex-shrink-0">
          <button class="btn-edit-blog btn-secondary py-1 px-3 text-xs" data-path="${f.path}" data-sha="${f.sha}">Edit</button>
          <button class="btn-del-blog text-rose-600 text-xs font-bold px-2 py-1 border border-rose-200 dark:border-rose-900/30 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition" data-path="${f.path}" data-sha="${f.sha}">Delete</button>
        </div>`;
      el.appendChild(card);
    });
    el.querySelectorAll('.btn-edit-blog').forEach(btn => btn.onclick = () => editBlog(btn.dataset.path, btn.dataset.sha));
    el.querySelectorAll('.btn-del-blog').forEach(btn => btn.onclick = async () => {
      if (!confirm('Delete this blog post permanently?')) return;
      try {
        await apiRequest(btn.dataset.path, { method: 'DELETE', body: JSON.stringify({ message: 'cms: delete blog', sha: btn.dataset.sha, branch: state.gitConfig.branch }) });
        toast('Blog deleted!', 'success');
        await loadBlogs();
      } catch (e) { toast(e.message, 'error'); }
    });
  }

  async function loadLearnings() {
    setTabLoading('tab-learnings', true);
    const dirRes = await apiGet('src/content/learning');
    const mdFiles = dirRes.filter(i => i.name.endsWith('.md'));

    // Fetch all file contents in parallel to extract titles
    const enriched = await Promise.all(mdFiles.map(async f => {
      try {
        const fileRes = await apiGet(f.path);
        const content = b64_to_utf8(fileRes.content.replace(/\s/g, ''));
        const { data } = parseFrontmatter(content);
        return { ...f, sha: fileRes.sha, title: data.title || f.name, date: data.date || '', category: data.category || '', isADR: data.isADR === true || data.isADR === 'true', adrStatus: data.adrStatus || '', tags: data.tags || [] };
      } catch {
        return { ...f, title: f.name, date: '', category: '', isADR: false, adrStatus: '', tags: [] };
      }
    }));
    // Sort by date descending
    enriched.sort((a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf());
    state.learningsList = enriched;

    renderLearningsList();
    $('learnings-prompt').classList.add('hidden');
    $('btn-create-learning').classList.remove('hidden');
    $('stat-learnings').textContent = enriched.length;
    setTabLoading('tab-learnings', false);
  }

  function renderLearningsList() {
    const el = $('learnings-list-container');
    el.innerHTML = state.learningsList.length ? '' : '<p class="text-slate-400 text-sm text-center py-6">No learning entries yet. Create your first one!</p>';
    state.learningsList.forEach(f => {
      const card = document.createElement('div');
      card.className = 'p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-start gap-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition';
      const dateStr = f.date ? new Date(f.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
      const adrBadge = f.isADR ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded ${f.adrStatus === 'Accepted' ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600' : 'bg-amber-100 dark:bg-amber-950/30 text-amber-600'}">ADR: ${escHtml(f.adrStatus || 'Proposed')}</span>` : '';
      const catBadge = f.category ? `<span class="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-[10px] px-2 py-0.5 rounded font-semibold">${escHtml(f.category)}</span>` : '';
      card.innerHTML = `<div class="flex-1 min-w-0">
          <h4 class="font-bold text-sm leading-tight mb-1">${escHtml(f.title)}</h4>
          <div class="flex items-center gap-2 flex-wrap">${dateStr ? `<span class="text-[10px] text-slate-400 font-mono">${escHtml(dateStr)}</span>` : ''}${catBadge}${adrBadge}<span class="text-[10px] font-mono text-slate-400">${escHtml(f.name)}</span></div>
        </div>
        <div class="flex gap-2 flex-shrink-0">
          <button class="btn-edit-learn btn-secondary py-1 px-3 text-xs" data-path="${f.path}" data-sha="${f.sha}">Edit</button>
          <button class="btn-del-learn text-rose-600 text-xs font-bold px-2 py-1 border border-rose-200 dark:border-rose-900/30 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition" data-path="${f.path}" data-sha="${f.sha}">Delete</button>
        </div>`;
      el.appendChild(card);
    });
    el.querySelectorAll('.btn-edit-learn').forEach(btn => btn.onclick = () => editLearning(btn.dataset.path, btn.dataset.sha));
    el.querySelectorAll('.btn-del-learn').forEach(btn => btn.onclick = async () => {
      if (!confirm('Delete this learning entry permanently?')) return;
      try {
        await apiRequest(btn.dataset.path, { method: 'DELETE', body: JSON.stringify({ message: 'cms: delete learning', sha: btn.dataset.sha, branch: state.gitConfig.branch }) });
        toast('Entry deleted!', 'success');
        await loadLearnings();
      } catch (e) { toast(e.message, 'error'); }
    });
  }

  async function autoLoadAll() {
    // Load each section independently so one failure doesn't block others
    const results = await Promise.allSettled([
      loadProfile().catch(e => { setTabError('profile-prompt', e.message); throw e; }),
      loadProjects().catch(e => { setTabError('projects-prompt', e.message); $('btn-add-project').classList.remove('hidden'); throw e; }),
      loadBlogs().catch(e => { setTabError('blogs-prompt', e.message); $('btn-create-blog').classList.remove('hidden'); throw e; }),
      loadLearnings().catch(e => { setTabError('learnings-prompt', e.message); $('btn-create-learning').classList.remove('hidden'); throw e; }),
      loadKnowledge().catch(e => { setTabError('knowledge-prompt', e.message); throw e; }),
    ]);

    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length === 0) {
      toast('All content loaded successfully!', 'success');
    } else if (failed.length === results.length) {
      toast(`${failed.length} section(s) failed to load. Check the API configuration and try reloading.`, 'error');
    } else {
      toast(`Loaded with ${failed.length} error(s) — some sections unavailable`, 'info');
    }
  }

  // ─── Blog / Learning / Project forms ───────────────────────────
  function openProjectForm(idx) {
    $('project-form').classList.remove('hidden');
    $('proj-index').value = idx;
    if (idx === -1) {
      $('project-form-title').textContent = 'New Project';
      ['proj-id','proj-name','proj-tagline','proj-desc','proj-tech','proj-image','proj-type','proj-status'].forEach(id => $(id).value = '');
      $('proj-type').value = 'Personal project'; $('proj-status').value = 'In development';
      renderProjFeaturesEditor([{ title: '', detail: '' }]);
    } else {
      const p = state.projectsData[idx];
      $('project-form-title').textContent = 'Edit: ' + p.name;
      $('proj-id').value = p.id; $('proj-name').value = p.name; $('proj-tagline').value = p.tagline;
      $('proj-desc').value = p.description; $('proj-tech').value = (p.technologies || []).join(', ');
      $('proj-image').value = p.image || '';
      $('proj-type').value = p.type || 'Personal project'; $('proj-status').value = p.status || 'In development';
      renderProjFeaturesEditor(p.features || []);
    }
    $('project-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function editBlog(path, sha) {
    try {
      const res = await apiGet(path);
      const raw = b64_to_utf8(res.content.replace(/\s/g, ''));
      const parsed = parseFrontmatter(raw);
      $('blog-form').classList.remove('hidden');
      $('blog-sha').value = res.sha || sha;
      $('blog-old-path').value = path;
      $('blog-slug').value = path.replace('src/content/blog/', '').replace('.md', '');
      $('blog-date').value = (parsed.data.pubDate || '').toString().slice(0, 10);
      $('blog-title').value = parsed.data.title || '';
      $('blog-desc').value = parsed.data.description || '';
      $('blog-tags').value = (parsed.data.tags || []).join(', ');
      $('blog-image').value = parsed.data.image || '';
      $('blog-content').value = parsed.body.trim();
      $('btn-delete-blog').classList.remove('hidden');
      state.pendingImage = null;
      updateBlogImagePreview(parsed.data.image);
      $('blog-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      toast('Failed to load blog: ' + e.message, 'error');
    }
  }

  async function editLearning(path, sha) {
    try {
      const res = await apiGet(path);
      const raw = b64_to_utf8(res.content.replace(/\s/g, ''));
      const parsed = parseFrontmatter(raw);
      $('learning-form').classList.remove('hidden');
      $('learn-sha').value = res.sha || sha;
      $('learn-old-path').value = path;
      $('learn-slug').value = path.replace('src/content/learning/', '').replace('.md', '');
      $('learn-date').value = (parsed.data.date || '').toString().slice(0, 10);
      $('learn-title').value = parsed.data.title || '';
      $('learn-category').value = parsed.data.category || '';
      const isADR = parsed.data.isADR === true || parsed.data.isADR === 'true';
      $('learn-isADR').checked = isADR;
      $('learn-adrStatus').disabled = !isADR;
      $('learn-adrStatus').value = parsed.data.adrStatus || '';
      $('learn-tags').value = (parsed.data.tags || []).join(', ');
      $('learn-content').value = parsed.body.trim();
      $('btn-delete-learning').classList.remove('hidden');
      $('learning-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      toast('Failed to load entry: ' + e.message, 'error');
    }
  }

  function updateBlogImagePreview(url) {
    const prev = $('blog-image-preview');
    if (!prev) return;
    if (url) { prev.src = url; prev.classList.remove('hidden'); }
    else { prev.src = ''; prev.classList.add('hidden'); }
  }

  async function testGitConnection() {
    if (!API_BASE) return toast('Set PUBLIC_API_BASE_URL in the GitHub Pages build.', 'error');
    try { const res = await request(`${API_BASE}/api/auth/verify`); toast(res.serverMode ? 'CMS API is available.' : 'CMS server credentials are not configured.', res.serverMode ? 'success' : 'error'); }
    catch (e) { toast(e.message, 'error'); }
  }

  // ─── Init & Event Bindings ─────────────────────────────────────
  async function init() {
    const health = await detectServerMode();
    if ($('login-email')) $('login-email').value = '';
    if ($('login-hint')) {
      $('login-hint').textContent = health.error || 'Enter your admin email and password. GitHub access is managed securely by the server.';
    }

    const restored = restoreSession();
    if (restored && API_BASE) {
      try {
        const sessionCheck = await request(`${API_BASE}/api/auth/verify`, { headers: { Authorization: `Bearer ${state.token}` } });
        if (sessionCheck.authenticated) showDashboard();
        else { sessionStorage.removeItem(SESSION_KEY); state.token = null; state.authenticated = false; showLogin(); }
      } catch { showLogin(); }
    } else showLogin();

    $('login-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = $('login-submit');
      btn.disabled = true; btn.textContent = 'Signing in...';
      try {
        await login($('login-email').value.trim(), $('login-password').value);
        showDashboard();
        toast('Welcome back!', 'success');
      } catch (err) { toast(err.message, 'error'); }
      finally { btn.disabled = false; btn.textContent = 'Unlock Dashboard'; }
    });

    $('btn-logout')?.addEventListener('click', logout);

    $('btn-delete-cv')?.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to delete the CV file from GitHub?')) return;
      try {
        const cvPath = 'public/cv.pdf';
        let sha;
        try { const ex = await apiGet(cvPath); sha = ex.sha; } catch {}
        if (sha) {
          await apiRequest(cvPath, {
            method: 'DELETE',
            body: JSON.stringify({ message: 'cms: delete CV / Resume file', sha, branch: state.gitConfig.branch }),
          });
        }
        $('prof-cv-url').value = '';
        $('prof-cv-file').value = '';
        updateCVStatusDisplay('');
        toast('CV file deleted from GitHub. Remember to click "Publish About & Profile Live" to save!', 'info');
      } catch (e) {
        toast('Failed to delete CV: ' + e.message, 'error');
      }
    });

    $('btn-delete-avatar')?.addEventListener('click', async () => {
      if (!confirm('Are you sure you want to delete the profile photo from GitHub?')) return;
      try {
        const avatarUrl = $('prof-avatar-url').value.trim();
        if (avatarUrl && avatarUrl.startsWith('/profile-assets/')) {
          const avatarPath = `public${avatarUrl}`;
          let sha;
          try { const ex = await apiGet(avatarPath); sha = ex.sha; } catch {}
          if (sha) {
            await apiRequest(avatarPath, {
              method: 'DELETE',
              body: JSON.stringify({ message: 'cms: delete profile photo file', sha, branch: state.gitConfig.branch }),
            });
          }
        }
        $('prof-avatar-url').value = '';
        $('prof-avatar-file').value = '';
        updateAvatarStatusDisplay('');
        toast('Profile photo deleted from GitHub. Remember to click "Publish About & Profile Live" to save!', 'info');
      } catch (e) {
        toast('Failed to delete photo: ' + e.message, 'error');
      }
    });

    $('prof-avatar-file')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const imgPrev = $('prof-avatar-preview');
        const imgPlac = $('prof-avatar-placeholder');
        if (imgPrev) {
          imgPrev.src = reader.result;
          imgPrev.classList.remove('hidden');
        }
        if (imgPlac) imgPlac.classList.add('hidden');
      };
      reader.readAsDataURL(file);
    });

    document.querySelectorAll('.nav-tab').forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.target)));

    $('btn-test-connection')?.addEventListener('click', testGitConnection);

    $('btn-add-proj-feature')?.addEventListener('click', () => {
      renderProjFeaturesEditor([...collectProjFeatures(), { title: '', detail: '' }]);
    });

    $('btn-add-skill-cat')?.addEventListener('click', () => renderSkillsEditor([...collectSkills(), { category: '', items: [] }]));
    $('btn-add-role')?.addEventListener('click', () => renderRolesEditor([...[...document.querySelectorAll('.role-item')].map(i => i.value.trim()), '']));
    $('btn-add-highlight')?.addEventListener('click', () => {
      const items = collectListEditor('highlights-editor', [{ key: 'title' }, { key: 'description' }]);
      items.push({ title: '', description: '' });
      renderListEditor('highlights-editor', items, [{ key: 'title', label: 'Title' }, { key: 'description', label: 'Description', type: 'textarea', rows: 3 }]);
    });
    $('btn-add-history')?.addEventListener('click', () => {
      const items = collectListEditor('history-editor', [{ key: 'role' }, { key: 'company' }, { key: 'period' }, { key: 'description' }], true);
      items.push({ role: '', company: '', period: '', description: '', bullets: [] });
      renderListEditor('history-editor', items,
        [{ key: 'role', label: 'Role' }, { key: 'company', label: 'Company' }, { key: 'period', label: 'Period' }, { key: 'description', label: 'Description', type: 'textarea', rows: 3 }], true);
    });
    $('btn-add-education')?.addEventListener('click', () => {
      const items = collectListEditor('education-editor', [{ key: 'degree' }, { key: 'institution' }, { key: 'period' }, { key: 'status' }]);
      items.push({ degree: '', institution: '', period: '', status: '' });
      renderListEditor('education-editor', items,
        [{ key: 'degree', label: 'Degree' }, { key: 'institution', label: 'Institution' }, { key: 'period', label: 'Year / Period' }, { key: 'status', label: 'Status' }]);
    });

    $('profile-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = 'Publishing...';
      try {
        let cvUrl = $('prof-cv-url').value.trim();
        const cvFile = $('prof-cv-file').files[0];
        if (cvFile) {
          cvUrl = await uploadCV(cvFile);
          $('prof-cv-url').value = cvUrl;
          $('prof-cv-file').value = '';
        }
        updateCVStatusDisplay(cvUrl);

        let avatarUrl = $('prof-avatar-url').value.trim();
        const avatarFile = $('prof-avatar-file').files[0];
        if (avatarFile) {
          avatarUrl = await uploadAvatar(avatarFile);
          $('prof-avatar-url').value = avatarUrl;
          $('prof-avatar-file').value = '';
        }
        updateAvatarStatusDisplay(avatarUrl);

        const updated = {
          ...state.profileData,
          name: $('prof-name').value, title: $('prof-title').value,
          email: $('prof-email').value, phone: $('prof-phone').value, location: $('prof-location').value,
          github: $('prof-github').value, linkedin: $('prof-linkedin').value, twitter: $('prof-twitter').value,
          cvUrl: cvUrl,
          avatarUrl: avatarUrl,
          summary: $('prof-summary').value, detailedSummary: $('prof-detailedSummary').value,
          objective: $('prof-objective').value, recruiterSummary: $('prof-recruiter').value,
          skills: collectSkills(),
          targetRoles: [...document.querySelectorAll('.role-item')].map(i => i.value.trim()).filter(Boolean),
          experienceHighlights: collectListEditor('highlights-editor', [{ key: 'title' }, { key: 'description' }]),
          workHistory: collectListEditor('history-editor', [{ key: 'role' }, { key: 'company' }, { key: 'period' }, { key: 'description' }], true),
          education: collectListEditor('education-editor', [{ key: 'degree' }, { key: 'institution' }, { key: 'period' }, { key: 'status' }]),
        };
        const res = await apiRequest('src/data/profile.json', {
          method: 'PUT',
          body: JSON.stringify({ message: 'cms: update profile', content: utf8_to_b64(JSON.stringify(updated, null, 2)), sha: state.profileSha, branch: state.gitConfig.branch }),
        });
        state.profileSha = res.content?.sha || res.sha;
        state.profileData = updated;
        toast('Profile published! Site will redeploy in ~2 min.', 'success');
      } catch (err) { toast(err.message, 'error'); }
      finally { btn.disabled = false; btn.textContent = 'Publish About & Profile Live'; }
    });

    $('btn-add-project')?.addEventListener('click', () => openProjectForm(-1));
    $('btn-cancel-project')?.addEventListener('click', () => $('project-form').classList.add('hidden'));
    $('project-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const idx = +$('proj-index').value;
      const existing = idx >= 0 ? state.projectsData[idx] : {};
      const features = collectProjFeatures();
      const proj = {
        ...existing,
        id: $('proj-id').value.trim(), name: $('proj-name').value.trim(), tagline: $('proj-tagline').value.trim(),
        description: $('proj-desc').value.trim(),
        type: $('proj-type').value.trim() || 'Personal project',
        status: $('proj-status').value.trim() || 'In development',
        image: $('proj-image').value.trim() || undefined,
        technologies: $('proj-tech').value.split(',').map(s => s.trim()).filter(Boolean),
        features,
      };
      
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = 'Publishing...';
      
      try {
        const backup = [...state.projectsData];
        if (idx === -1) state.projectsData.push(proj); else state.projectsData[idx] = proj;
        
        await publishProjects();
        renderProjectsList();
        $('project-form').classList.add('hidden');
        toast('Project published! Site will redeploy in ~2 min.', 'success');
      } catch (err) {
        toast('Failed to publish project: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Publish Project Live';
      }
    });

    $('btn-publish-projects')?.addEventListener('click', async () => {
      const btn = $('btn-publish-projects');
      btn.disabled = true; btn.textContent = 'Publishing...';
      try {
        await publishProjects();
        toast('Projects published! Site will redeploy in ~2 min.', 'success');
      } catch (e) { toast(e.message, 'error'); }
      finally { btn.disabled = false; btn.textContent = 'Publish Projects Live'; }
    });

    $('blog-image-file')?.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      state.pendingImage = file;
      const reader = new FileReader();
      reader.onload = () => { $('blog-image-preview').src = reader.result; $('blog-image-preview').classList.remove('hidden'); };
      reader.readAsDataURL(file);
    });

    $('btn-create-blog')?.addEventListener('click', () => {
      $('blog-form').classList.remove('hidden');
      $('blog-sha').value = ''; $('blog-old-path').value = '';
      $('blog-slug').value = ''; $('blog-date').value = new Date().toISOString().slice(0, 10);
      ['blog-title','blog-desc','blog-tags','blog-content','blog-image'].forEach(id => $(id).value = '');
      $('btn-delete-blog').classList.add('hidden');
      state.pendingImage = null;
      $('blog-image-preview')?.classList.add('hidden');
      if ($('blog-image-preview')) $('blog-image-preview').src = '';
      $('blog-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    $('btn-cancel-blog')?.addEventListener('click', () => $('blog-form').classList.add('hidden'));

    $('blog-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const slug = $('blog-slug').value.trim();
      if (!slug) { toast('Slug is required', 'error'); return; }
      let imagePath = $('blog-image').value.trim();
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = 'Publishing...';
      try {
        if (state.pendingImage) {
          const ext = state.pendingImage.name.split('.').pop() || 'jpg';
          imagePath = await uploadImage(state.pendingImage, `${slug}.${ext}`);
          $('blog-image').value = imagePath;
        }
        const data = {
          title: $('blog-title').value.trim(), description: $('blog-desc').value.trim(),
          pubDate: $('blog-date').value, slug, author: 'Aunmoy Dey Tanmoy',
          tags: $('blog-tags').value.split(',').map(s => s.trim()).filter(Boolean),
          image: imagePath || `/blog-assets/${slug}.jpg`,
        };
        const md = buildBlogFrontmatter(data, $('blog-content').value);
        const newPath = `src/content/blog/${slug}.md`;
        const oldPath = $('blog-old-path').value;
        const sha = $('blog-sha').value;
        if (oldPath && oldPath !== newPath && sha) {
          await apiRequest(newPath, { method: 'PUT', body: JSON.stringify({ message: `cms: publish blog ${slug}`, content: utf8_to_b64(md), branch: state.gitConfig.branch }) });
          await apiRequest(oldPath, { method: 'DELETE', body: JSON.stringify({ message: `cms: delete renamed blog ${slug}`, sha, branch: state.gitConfig.branch }) });
        } else {
          await apiRequest(newPath, { method: 'PUT', body: JSON.stringify({ message: `cms: publish blog ${slug}`, content: utf8_to_b64(md), sha: sha || undefined, branch: state.gitConfig.branch }) });
        }
        toast('Blog published! Site will redeploy in ~2 min.', 'success');
        $('blog-form').classList.add('hidden');
        await loadBlogs();
      } catch (err) { toast(err.message, 'error'); }
      finally { btn.disabled = false; btn.textContent = 'Publish Blog Live'; }
    });

    $('btn-delete-blog')?.addEventListener('click', async () => {
      if (!confirm('Delete this blog post permanently?')) return;
      try {
        await apiRequest($('blog-old-path').value, { method: 'DELETE', body: JSON.stringify({ message: 'cms: delete blog', sha: $('blog-sha').value, branch: state.gitConfig.branch }) });
        toast('Blog deleted!', 'success');
        $('blog-form').classList.add('hidden');
        await loadBlogs();
      } catch (e) { toast(e.message, 'error'); }
    });

    $('learn-isADR')?.addEventListener('change', () => { $('learn-adrStatus').disabled = !$('learn-isADR').checked; });

    $('btn-create-learning')?.addEventListener('click', () => {
      $('learning-form').classList.remove('hidden');
      $('learn-sha').value = ''; $('learn-old-path').value = '';
      $('learn-slug').value = ''; $('learn-date').value = new Date().toISOString().slice(0, 10);
      ['learn-title','learn-category','learn-tags','learn-content'].forEach(id => $(id).value = '');
      $('learn-isADR').checked = false;
      $('learn-adrStatus').disabled = true;
      $('learn-adrStatus').value = '';
      $('btn-delete-learning').classList.add('hidden');
      $('learning-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    $('btn-cancel-learning')?.addEventListener('click', () => $('learning-form').classList.add('hidden'));

    $('learning-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const slug = $('learn-slug').value.trim();
      if (!slug) { toast('Slug is required', 'error'); return; }
      const isADR = $('learn-isADR').checked;
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = 'Publishing...';
      try {
        const data = {
          title: $('learn-title').value.trim(), date: $('learn-date').value,
          category: $('learn-category').value.trim(),
          tags: $('learn-tags').value.split(',').map(s => s.trim()).filter(Boolean),
          isADR, adrStatus: isADR ? $('learn-adrStatus').value : undefined,
        };
        const md = buildLearningFrontmatter(data, $('learn-content').value);
        const newPath = `src/content/learning/${slug}.md`;
        const oldPath = $('learn-old-path').value;
        const sha = $('learn-sha').value;
        if (oldPath && oldPath !== newPath && sha) {
          await apiRequest(newPath, { method: 'PUT', body: JSON.stringify({ message: `cms: publish learning ${slug}`, content: utf8_to_b64(md), branch: state.gitConfig.branch }) });
          await apiRequest(oldPath, { method: 'DELETE', body: JSON.stringify({ message: `cms: delete renamed learning ${slug}`, sha, branch: state.gitConfig.branch }) });
        } else {
          await apiRequest(newPath, { method: 'PUT', body: JSON.stringify({ message: `cms: publish learning ${slug}`, content: utf8_to_b64(md), sha: sha || undefined, branch: state.gitConfig.branch }) });
        }
        toast('Learning entry published! Site will redeploy in ~2 min.', 'success');
        $('learning-form').classList.add('hidden');
        await loadLearnings();
      } catch (err) { toast(err.message, 'error'); }
      finally { btn.disabled = false; btn.textContent = 'Publish Entry Live'; }
    });

    $('btn-delete-learning')?.addEventListener('click', async () => {
      if (!confirm('Delete this entry permanently?')) return;
      try {
        await apiRequest($('learn-old-path').value, { method: 'DELETE', body: JSON.stringify({ message: 'cms: delete learning', sha: $('learn-sha').value, branch: state.gitConfig.branch }) });
        toast('Entry deleted!', 'success');
        $('learning-form').classList.add('hidden');
        await loadLearnings();
      } catch (e) { toast(e.message, 'error'); }
    });

    $('btn-create-knowledge')?.addEventListener('click', () => openKnowledge(null));
    $('knowledge-cancel')?.addEventListener('click', () => $('knowledge-form').classList.add('hidden'));
    ['knowledge-search','knowledge-type-filter','knowledge-status-filter'].forEach(id => $(id)?.addEventListener('input', renderKnowledge));
    $('knowledge-type')?.addEventListener('change', () => document.querySelectorAll('.knowledge-fields').forEach(el => el.classList.toggle('hidden', !el.dataset.types.split(',').includes($('knowledge-type').value))));
    $('knowledge-cover-file')?.addEventListener('change', async e => {
      const file=e.target.files?.[0]; if(!file) return;
      try { const path=await uploadImage(file, `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'-')}`, 'personal-assets'); $('knowledge-cover').value=path; toast('Cover uploaded (metadata stripped)','success'); }
      catch(err){toast(err.message,'error');}
    });
    $('knowledge-gallery-files')?.addEventListener('change', async e => {
      const urls=$('knowledge-gallery').value.split('\n').map(x=>x.trim()).filter(Boolean);
      for(const file of [...(e.target.files||[])]) { try { const path=await uploadImage(file, `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'-')}`, 'travel-assets'); urls.push(path); } catch(err){toast(err.message,'error');break;} }
      $('knowledge-gallery').value=urls.join('\n');
    });
    $('knowledge-doc-file')?.addEventListener('change', async e => {
      const file=e.target.files?.[0]; if(!file) return;
      try { const path=await uploadDocument(file,`${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,'-')}`); const urls=$('knowledge-documents').value.split('\n').filter(Boolean); urls.push('/'+path.replace(/^public\//,'')); $('knowledge-documents').value=urls.join('\n'); toast('PDF uploaded','success'); }
      catch(err){toast(err.message,'error');}
    });
    $('knowledge-write-tab')?.addEventListener('click',()=>{$('knowledge-body').classList.remove('hidden');$('knowledge-preview').classList.add('hidden');});
    $('knowledge-preview-tab')?.addEventListener('click',()=>{
      $('knowledge-body').classList.add('hidden'); const preview=$('knowledge-preview'); preview.classList.remove('hidden');
      const raw=typeof marked!=='undefined'?marked.parse($('knowledge-body').value):$('knowledge-body').value;
      const doc=new DOMParser().parseFromString(raw,'text/html');
      const allowed=new Set(['P','BR','HR','H1','H2','H3','H4','BLOCKQUOTE','UL','OL','LI','STRONG','B','EM','I','DEL','S','CODE','PRE','TABLE','THEAD','TBODY','TR','TH','TD','A','IMG']);
      doc.querySelectorAll('*').forEach(n=>{
        if(!allowed.has(n.tagName)){n.replaceWith(doc.createTextNode(n.textContent||''));return;}
        [...n.attributes].forEach(a=>{
          const name=a.name.toLowerCase();
          if(name.startsWith('on')||!(['href','src','alt','title','colspan','rowspan'].includes(name)))n.removeAttribute(a.name);
          else if(name==='href'&&!/^(https?:|mailto:|#|\/)/i.test(a.value))n.removeAttribute(a.name);
          else if(name==='src'&&!/^(https?:|\/)/i.test(a.value))n.removeAttribute(a.name);
        });
      });
      preview.replaceChildren(...[...doc.body.childNodes].map(n=>document.importNode(n,true)));
    });
    $('knowledge-save-draft')?.addEventListener('click',()=>saveKnowledge('draft'));
    $('knowledge-form')?.addEventListener('submit',e=>{e.preventDefault();saveKnowledge($('knowledge-status').value || 'published');});
    $('knowledge-delete')?.addEventListener('click',async()=>{
      if(!confirm('Delete this entry permanently?'))return;
      try{await apiRequest($('knowledge-path').value,{method:'DELETE',body:JSON.stringify({message:'cms: delete knowledge entry',sha:$('knowledge-sha').value,branch:state.gitConfig.branch})});$('knowledge-form').classList.add('hidden');toast('Entry deleted','success');await loadKnowledge();}catch(err){toast(err.message,'error');}
    });

    $('btn-reload-all')?.addEventListener('click', () => {
      // Reset prompts
      ['profile-prompt','projects-prompt','blogs-prompt','learnings-prompt','knowledge-prompt'].forEach(id => {
        const el = $(id);
        if (el) { el.textContent = 'Loading...'; el.className = 'text-slate-400 text-sm hidden'; }
      });
      autoLoadAll();
    });

    // Markdown preview tabs
    [['blog-write-tab','blog-preview-tab','blog-write-container','blog-preview-container','blog-content'],
     ['learn-write-tab','learn-preview-tab','learn-write-container','learn-preview-container','learn-content']
    ].forEach(([wt, pt, wc, pc, ta]) => {
      $(wt)?.addEventListener('click', () => { $(wc).classList.remove('hidden'); $(pc).classList.add('hidden'); });
      $(pt)?.addEventListener('click', () => {
        $(wc).classList.add('hidden'); $(pc).classList.remove('hidden');
        const md = $(ta).value;
        $(pc).innerHTML = typeof marked !== 'undefined' ? marked.parse(md) : md;
      });
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
