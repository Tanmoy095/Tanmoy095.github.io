/* Portfolio Admin CMS - dual mode: Vercel server API or GitHub PAT fallback */
(function () {
  const CFG = window.__ADMIN_CONFIG__ || {};
  const SESSION_KEY = 'portfolio_admin_session';
  const GIT_KEY = 'git_cms_config';

  let state = {
    authenticated: false,
    serverMode: false,
    token: null,
    gitConfig: { owner: 'Tanmoy095', repo: 'Tanmoy095.github.io', branch: 'main', token: '' },
    profileData: null,
    profileSha: '',
    projectsData: [],
    projectsSha: '',
    blogsList: [],
    learningsList: [],
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
  async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  function utf8_to_b64(str) { return btoa(unescape(encodeURIComponent(str))); }
  function b64_to_utf8(str) { return decodeURIComponent(escape(atob(str))); }
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result.split(',')[1]);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }

  // ─── Auth ────────────────────────────────────────────────────
  async function detectServerMode() {
    try {
      const res = await fetch('/api/auth/verify');
      if (!res.ok) return false;
      const data = await res.json();
      state.serverMode = !!data.serverMode;
      if (data.adminEmail) CFG.email = data.adminEmail;
      return data;
    } catch { return false; }
  }

  async function login(email, password) {
    if (state.serverMode) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      state.token = data.token;
      state.authenticated = true;
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: data.token, email, exp: Date.now() + 8 * 3600000, mode: 'server' }));
      return;
    }
    const hash = await sha256(password);
    if (email.toLowerCase() !== (CFG.email || '').toLowerCase() || hash !== CFG.passwordHash) {
      throw new Error('Invalid email or password');
    }
    state.authenticated = true;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email, exp: Date.now() + 8 * 3600000, mode: 'client' }));
  }

  async function logout() {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {}
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
      state.authenticated = true;
      state.token = s.token || null;
      return true;
    } catch { return false; }
  }

  // ─── GitHub API (server proxy or direct PAT) ─────────────────
  async function apiRequest(path, options = {}) {
    if (state.serverMode && state.token) {
      const method = options.method || 'GET';
      if (method === 'GET') {
        const ref = state.gitConfig.branch || 'main';
        const res = await fetch(`/api/github/proxy?path=${encodeURIComponent(path)}&ref=${ref}`, {
          headers: { Authorization: `Bearer ${state.token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'API error');
        return data;
      }
      const body = JSON.parse(options.body || '{}');
      const res = await fetch('/api/github/proxy', {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.token}` },
        body: JSON.stringify({ path, ...body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API error');
      return data;
    }

    if (!state.gitConfig.token) throw new Error('Configure GitHub PAT in Settings tab');
    const url = `https://api.github.com/repos/${state.gitConfig.owner}/${state.gitConfig.repo}/contents/${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${state.gitConfig.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'GitHub API error');
    return data;
  }

  async function uploadImage(file, filename) {
    const base64 = await fileToBase64(file);
    if (state.serverMode && state.token) {
      const res = await fetch('/api/github/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.token}` },
        body: JSON.stringify({ filename, contentBase64: base64, message: `cms: upload ${filename}` }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      return data.path;
    }
    const path = `public/blog-assets/${filename}`;
    let sha;
    try {
      const ex = await apiRequest(`${path}?ref=${state.gitConfig.branch}`);
      sha = ex.sha;
    } catch {}
    await apiRequest(path, {
      method: 'PUT',
      body: JSON.stringify({ message: `cms: upload ${filename}`, content: base64, sha, branch: state.gitConfig.branch }),
    });
    return `/blog-assets/${filename}`;
  }

  // ─── Frontmatter helpers ───────────────────────────────────────
  function parseFrontmatter(text) {
    const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { data: {}, body: text };
    const data = {};
    match[1].split('\n').forEach(line => {
      const idx = line.indexOf(':');
      if (idx < 1) return;
      const k = line.slice(0, idx).trim();
      let v = line.slice(idx + 1).trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      if (v === 'true') v = true;
      if (v === 'false') v = false;
      if (v.startsWith('[') && v.endsWith(']')) {
        v = v.slice(1, -1).split(',').map(s => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
      }
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
          <input type="text" class="form-input skill-cat" data-idx="${ci}" value="${cat.category}" placeholder="Category name" />
          <button type="button" class="btn-del-skill-cat px-3 text-rose-600 text-xs font-bold" data-idx="${ci}">✕</button>
        </div>
        <div class="skill-items space-y-2" data-cat="${ci}"></div>
        <button type="button" class="btn-add-skill-item text-xs text-indigo-600 font-semibold" data-cat="${ci}">+ Add skill</button>`;
      el.appendChild(card);
      const itemsEl = card.querySelector('.skill-items');
      (cat.items || []).forEach((item, ii) => {
        itemsEl.innerHTML += `<div class="flex gap-2"><input type="text" class="form-input skill-item" data-cat="${ci}" data-item="${ii}" value="${item}" /><button type="button" class="btn-del-skill-item text-rose-500 text-xs" data-cat="${ci}" data-item="${ii}">✕</button></div>`;
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

  function renderRolesEditor(roles) {
    const el = $('roles-editor');
    if (!el) return;
    el.innerHTML = (roles || []).map((r, i) =>
      `<div class="flex gap-2 mb-2"><input type="text" class="form-input role-item" data-idx="${i}" value="${r}" /><button type="button" class="btn-del-role text-rose-500 text-xs" data-idx="${i}">✕</button></div>`
    ).join('');
    el.querySelectorAll('.btn-del-role').forEach(btn => btn.onclick = () => {
      const roles = [...document.querySelectorAll('.role-item')].map(i => i.value.trim()).filter(Boolean);
      roles.splice(+btn.dataset.idx, 1);
      renderRolesEditor(roles);
    });
  }

  // ─── Data Loaders ──────────────────────────────────────────────
  async function loadProfile() {
    const res = await apiRequest('src/data/profile.json?ref=' + state.gitConfig.branch);
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
    $('prof-summary').value = state.profileData.summary || '';
    $('prof-detailedSummary').value = state.profileData.detailedSummary || '';
    $('prof-objective').value = state.profileData.objective || '';
    $('prof-recruiter').value = state.profileData.recruiterSummary || '';
    renderSkillsEditor(state.profileData.skills);
    renderRolesEditor(state.profileData.targetRoles);
    renderListEditor('highlights-editor', state.profileData.experienceHighlights,
      [{ key: 'title', label: 'Title' }, { key: 'description', label: 'Description', type: 'textarea', rows: 3 }]);
    renderListEditor('history-editor', state.profileData.workHistory,
      [{ key: 'role', label: 'Role' }, { key: 'company', label: 'Company' }, { key: 'period', label: 'Period' }, { key: 'description', label: 'Description', type: 'textarea', rows: 3 }], true);
    $('profile-form').classList.remove('hidden');
    $('profile-prompt').classList.add('hidden');
    $('stat-profile').textContent = 'Loaded';
  }

  async function loadProjects() {
    const res = await apiRequest('src/data/projects.json?ref=' + state.gitConfig.branch);
    state.projectsSha = res.sha;
    state.projectsData = JSON.parse(b64_to_utf8(res.content.replace(/\s/g, '')));
    renderProjectsList();
    $('projects-prompt').classList.add('hidden');
    $('btn-add-project').classList.remove('hidden');
    $('btn-publish-projects').classList.remove('hidden');
    $('stat-projects').textContent = state.projectsData.length;
  }

  function renderProjectsList() {
    const el = $('projects-list-container');
    el.innerHTML = state.projectsData.length ? '' : '<p class="text-slate-400 text-sm text-center py-6">No projects yet.</p>';
    state.projectsData.forEach((p, idx) => {
      const card = document.createElement('div');
      card.className = 'p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-center';
      card.innerHTML = `<div><h4 class="font-bold">${p.name}</h4><p class="text-xs text-slate-500">${p.tagline}</p></div>
        <div class="flex gap-2"><button class="btn-edit-proj btn-secondary py-1 px-3 text-xs" data-idx="${idx}">Edit</button>
        <button class="btn-del-proj text-rose-600 text-xs font-bold px-2" data-idx="${idx}">Delete</button></div>`;
      el.appendChild(card);
    });
    el.querySelectorAll('.btn-edit-proj').forEach(b => b.onclick = () => openProjectForm(+b.dataset.idx));
    el.querySelectorAll('.btn-del-proj').forEach(b => b.onclick = () => {
      if (confirm('Delete this project?')) { state.projectsData.splice(+b.dataset.idx, 1); renderProjectsList(); }
    });
  }

  async function loadBlogs() {
    const res = await apiRequest('src/content/blog?ref=' + state.gitConfig.branch);
    state.blogsList = res.filter(i => i.name.endsWith('.md'));
    const el = $('blogs-list-container');
    el.innerHTML = '';
    state.blogsList.forEach(f => {
      const card = document.createElement('div');
      card.className = 'p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-center';
      card.innerHTML = `<div><h4 class="font-bold text-sm">${f.name}</h4></div><button class="btn-edit-blog btn-secondary py-1 px-3 text-xs" data-path="${f.path}" data-sha="${f.sha}">Edit</button>`;
      el.appendChild(card);
    });
    el.querySelectorAll('.btn-edit-blog').forEach(btn => btn.onclick = () => editBlog(btn.dataset.path, btn.dataset.sha));
    $('blogs-prompt').classList.add('hidden');
    $('btn-create-blog').classList.remove('hidden');
    $('stat-blogs').textContent = state.blogsList.length;
  }

  async function loadLearnings() {
    const res = await apiRequest('src/content/learning?ref=' + state.gitConfig.branch);
    state.learningsList = res.filter(i => i.name.endsWith('.md'));
    const el = $('learnings-list-container');
    el.innerHTML = '';
    state.learningsList.forEach(f => {
      const card = document.createElement('div');
      card.className = 'p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-between items-center';
      card.innerHTML = `<div><h4 class="font-bold text-sm">${f.name}</h4></div><button class="btn-edit-learn btn-secondary py-1 px-3 text-xs" data-path="${f.path}" data-sha="${f.sha}">Edit</button>`;
      el.appendChild(card);
    });
    el.querySelectorAll('.btn-edit-learn').forEach(btn => btn.onclick = () => editLearning(btn.dataset.path, btn.dataset.sha));
    $('learnings-prompt').classList.add('hidden');
    $('btn-create-learning').classList.remove('hidden');
    $('stat-learnings').textContent = state.learningsList.length;
  }

  async function autoLoadAll() {
    try {
      await loadProfile();
      await loadProjects();
      await loadBlogs();
      await loadLearnings();
      toast('All content loaded from repository', 'success');
    } catch (e) {
      if (!state.serverMode && !state.gitConfig.token) {
        toast('Configure GitHub PAT in Settings (required on GitHub Pages)', 'error');
        switchTab('tab-settings');
      } else {
        toast('Load error: ' + e.message, 'error');
      }
    }
  }

  // ─── Blog / Learning / Project forms ───────────────────────────
  function openProjectForm(idx) {
    $('project-form').classList.remove('hidden');
    $('proj-index').value = idx;
    if (idx === -1) {
      $('project-form-title').textContent = 'New Project';
      ['proj-id','proj-name','proj-tagline','proj-desc','proj-tech','proj-image'].forEach(id => $(id).value = '');
      $('proj-features-json').value = '[{"title":"Component","detail":"Description"}]';
    } else {
      const p = state.projectsData[idx];
      $('project-form-title').textContent = 'Edit: ' + p.name;
      $('proj-id').value = p.id; $('proj-name').value = p.name; $('proj-tagline').value = p.tagline;
      $('proj-desc').value = p.description; $('proj-tech').value = (p.technologies || []).join(', ');
      $('proj-image').value = p.image || '';
      $('proj-features-json').value = JSON.stringify(p.features || [], null, 2);
    }
  }

  async function editBlog(path, sha) {
    const res = await apiRequest(path + '?ref=' + state.gitConfig.branch);
    const parsed = parseFrontmatter(b64_to_utf8(res.content.replace(/\s/g, '')));
    $('blog-form').classList.remove('hidden');
    $('blog-sha').value = sha; $('blog-old-path').value = path;
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
  }

  async function editLearning(path, sha) {
    const res = await apiRequest(path + '?ref=' + state.gitConfig.branch);
    const parsed = parseFrontmatter(b64_to_utf8(res.content.replace(/\s/g, '')));
    $('learning-form').classList.remove('hidden');
    $('learn-sha').value = sha; $('learn-old-path').value = path;
    $('learn-slug').value = path.replace('src/content/learning/', '').replace('.md', '');
    $('learn-date').value = (parsed.data.date || '').toString().slice(0, 10);
    $('learn-title').value = parsed.data.title || '';
    $('learn-category').value = parsed.data.category || '';
    $('learn-isADR').checked = parsed.data.isADR === true || parsed.data.isADR === 'true';
    $('learn-adrStatus').disabled = !$('learn-isADR').checked;
    $('learn-adrStatus').value = parsed.data.adrStatus || '';
    $('learn-tags').value = (parsed.data.tags || []).join(', ');
    $('learn-content').value = parsed.body.trim();
    $('btn-delete-learning').classList.remove('hidden');
  }

  function updateBlogImagePreview(url) {
    const prev = $('blog-image-preview');
    if (!prev) return;
    if (url) { prev.src = url; prev.classList.remove('hidden'); }
    else { prev.classList.add('hidden'); }
  }

  // ─── Init & Event Bindings ─────────────────────────────────────
  async function init() {
    const saved = localStorage.getItem(GIT_KEY);
    if (saved) state.gitConfig = JSON.parse(saved);

    await detectServerMode();
    if ($('login-email')) $('login-email').value = CFG.email || '';
    if ($('login-hint')) {
      $('login-hint').textContent = state.serverMode
        ? 'Vercel server mode: enter your admin email and password. No GitHub token needed.'
        : 'GitHub Pages mode: enter admin email + password, then add PAT in Settings.';
    }

    if (restoreSession()) showDashboard();
    else showLogin();

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

    document.querySelectorAll('.nav-tab').forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.target)));

    $('config-form')?.addEventListener('submit', e => {
      e.preventDefault();
      state.gitConfig = {
        owner: $('cfg-owner').value.trim(),
        repo: $('cfg-repo').value.trim(),
        branch: $('cfg-branch').value.trim(),
        token: $('cfg-token').value.trim(),
      };
      localStorage.setItem(GIT_KEY, JSON.stringify(state.gitConfig));
      toast('Git settings saved', 'success');
    });

    if ($('cfg-owner')) {
      $('cfg-owner').value = state.gitConfig.owner;
      $('cfg-repo').value = state.gitConfig.repo;
      $('cfg-branch').value = state.gitConfig.branch;
      $('cfg-token').value = state.gitConfig.token || '';
    }

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

    $('profile-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      btn.disabled = true;
      try {
        const updated = {
          ...state.profileData,
          name: $('prof-name').value, title: $('prof-title').value,
          email: $('prof-email').value, phone: $('prof-phone').value, location: $('prof-location').value,
          github: $('prof-github').value, linkedin: $('prof-linkedin').value, twitter: $('prof-twitter').value,
          summary: $('prof-summary').value, detailedSummary: $('prof-detailedSummary').value,
          objective: $('prof-objective').value, recruiterSummary: $('prof-recruiter').value,
          skills: collectSkills(),
          targetRoles: [...document.querySelectorAll('.role-item')].map(i => i.value.trim()).filter(Boolean),
          experienceHighlights: collectListEditor('highlights-editor', [{ key: 'title' }, { key: 'description' }]),
          workHistory: collectListEditor('history-editor', [{ key: 'role' }, { key: 'company' }, { key: 'period' }, { key: 'description' }], true),
        };
        const res = await apiRequest('src/data/profile.json', {
          method: 'PUT',
          body: JSON.stringify({ message: 'cms: update profile', content: utf8_to_b64(JSON.stringify(updated, null, 2)), sha: state.profileSha, branch: state.gitConfig.branch }),
        });
        state.profileSha = res.content?.sha || res.sha;
        state.profileData = updated;
        toast('Profile published! Site will redeploy in ~2 min.', 'success');
      } catch (err) { toast(err.message, 'error'); }
      finally { btn.disabled = false; }
    });

    $('btn-add-project')?.addEventListener('click', () => openProjectForm(-1));
    $('btn-cancel-project')?.addEventListener('click', () => $('project-form').classList.add('hidden'));
    $('project-form')?.addEventListener('submit', e => {
      e.preventDefault();
      const idx = +$('proj-index').value;
      const proj = {
        id: $('proj-id').value.trim(), name: $('proj-name').value.trim(), tagline: $('proj-tagline').value.trim(),
        description: $('proj-desc').value.trim(),
        image: $('proj-image').value.trim() || undefined,
        technologies: $('proj-tech').value.split(',').map(s => s.trim()).filter(Boolean),
        features: JSON.parse($('proj-features-json').value),
      };
      if (idx === -1) state.projectsData.push(proj); else state.projectsData[idx] = proj;
      renderProjectsList();
      $('project-form').classList.add('hidden');
    });
    $('btn-publish-projects')?.addEventListener('click', async () => {
      try {
        const res = await apiRequest('src/data/projects.json', {
          method: 'PUT',
          body: JSON.stringify({ message: 'cms: update projects', content: utf8_to_b64(JSON.stringify(state.projectsData, null, 2)), sha: state.projectsSha, branch: state.gitConfig.branch }),
        });
        state.projectsSha = res.content?.sha || res.sha;
        toast('Projects published!', 'success');
      } catch (e) { toast(e.message, 'error'); }
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
    });
    $('btn-cancel-blog')?.addEventListener('click', () => $('blog-form').classList.add('hidden'));

    $('blog-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const slug = $('blog-slug').value.trim();
      let imagePath = $('blog-image').value.trim();
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
          await apiRequest(oldPath, { method: 'DELETE', body: JSON.stringify({ message: `cms: delete renamed blog ${slug}`, sha, branch: state.gitConfig.branch }) });
          await apiRequest(newPath, { method: 'PUT', body: JSON.stringify({ message: `cms: publish blog ${slug}`, content: utf8_to_b64(md), branch: state.gitConfig.branch }) });
        } else {
          await apiRequest(newPath, { method: 'PUT', body: JSON.stringify({ message: `cms: publish blog ${slug}`, content: utf8_to_b64(md), sha: sha || undefined, branch: state.gitConfig.branch }) });
        }
        toast('Blog published!', 'success');
        $('blog-form').classList.add('hidden');
        await loadBlogs();
      } catch (err) { toast(err.message, 'error'); }
    });

    $('btn-delete-blog')?.addEventListener('click', async () => {
      if (!confirm('Delete this blog post permanently?')) return;
      try {
        await apiRequest($('blog-old-path').value, { method: 'DELETE', body: JSON.stringify({ message: 'cms: delete blog', sha: $('blog-sha').value, branch: state.gitConfig.branch }) });
        toast('Blog deleted', 'success');
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
      $('learn-isADR').checked = false; $('learn-adrStatus').disabled = true;
      $('btn-delete-learning').classList.add('hidden');
    });
    $('btn-cancel-learning')?.addEventListener('click', () => $('learning-form').classList.add('hidden'));

    $('learning-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const slug = $('learn-slug').value.trim();
      const isADR = $('learn-isADR').checked;
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
          await apiRequest(oldPath, { method: 'DELETE', body: JSON.stringify({ message: `cms: delete renamed learning ${slug}`, sha, branch: state.gitConfig.branch }) });
          await apiRequest(newPath, { method: 'PUT', body: JSON.stringify({ message: `cms: publish learning ${slug}`, content: utf8_to_b64(md), branch: state.gitConfig.branch }) });
        } else {
          await apiRequest(newPath, { method: 'PUT', body: JSON.stringify({ message: `cms: publish learning ${slug}`, content: utf8_to_b64(md), sha: sha || undefined, branch: state.gitConfig.branch }) });
        }
        toast('Learning entry published!', 'success');
        $('learning-form').classList.add('hidden');
        await loadLearnings();
      } catch (err) { toast(err.message, 'error'); }
    });

    $('btn-delete-learning')?.addEventListener('click', async () => {
      if (!confirm('Delete this entry?')) return;
      try {
        await apiRequest($('learn-old-path').value, { method: 'DELETE', body: JSON.stringify({ message: 'cms: delete learning', sha: $('learn-sha').value, branch: state.gitConfig.branch }) });
        toast('Entry deleted', 'success');
        $('learning-form').classList.add('hidden');
        await loadLearnings();
      } catch (e) { toast(e.message, 'error'); }
    });

    $('btn-reload-all')?.addEventListener('click', autoLoadAll);

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
