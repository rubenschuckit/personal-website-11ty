/* ═══════════════════════════════════════════════════════════
   CMS — Core Application
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Config ───────────────────────────────────────────
  const REPO_OWNER = 'rubenschuckit';
  const REPO_NAME = 'personal-website-11ty';
  const BRANCH = 'master';
  const GITHUB_API = 'https://api.github.com';

  // Paths in repo
  const POSTS_PATH = 'posts';
  const PAGES_PATH = 'pages';
  const IMAGES_PATH = 'static/img';

  // ─── State ────────────────────────────────────────────
  let token = localStorage.getItem('cms_gh_token') || null;
  let currentFile = null;   // { path, sha, content, frontmatter, body }
  let currentTab = 'posts';
  let editor = null;        // EasyMDE instance
  let isDirty = false;
  let contentCache = {};    // path -> file data
  let imageCache = [];      // list of image paths

  // ─── DOM refs ─────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const loginScreen = $('#login-screen');
  const loginBtn = $('#login-btn');
  const app = $('#app');
  const contentList = $('#content-list');
  const imageGallery = $('#image-gallery');
  const emptyState = $('#empty-state');
  const editorPanel = $('#editor-panel');
  const fmTitle = $('#fm-title');
  const fmDate = $('#fm-date');
  const fmTags = $('#fm-tags');
  const fmLayout = $('#fm-layout');
  const saveBtn = $('#save-btn');
  const deleteBtn = $('#delete-btn');
  const editorStatus = $('#editor-status');
  const dropOverlay = $('#drop-overlay');
  const imageModal = $('#image-modal');
  const uploadZone = $('#upload-zone');
  const fileInput = $('#file-input');
  const uploadPreview = $('#upload-preview');
  const uploadProgress = $('#upload-progress');
  const progressFill = $('#progress-fill');
  const progressText = $('#progress-text');
  const uploadConfirm = $('#upload-confirm');
  const modalClose = $('#modal-close');
  const newModal = $('#new-modal');
  const newConfirm = $('#new-confirm');
  const logoutBtn = $('#logout-btn');
  const newContentBtn = $('#new-content-btn');

  // ─── Init ─────────────────────────────────────────────
  function init() {
    // Check for OAuth callback
    const params = new URLSearchParams(window.location.search);
    const returnedToken = params.get('token');
    if (returnedToken) {
      token = returnedToken;
      localStorage.setItem('cms_gh_token', token);
      window.history.replaceState({}, '', '/cms/');
    }

    if (token) {
      showApp();
    } else {
      showLogin();
    }

    bindEvents();
  }

  // ─── Auth ─────────────────────────────────────────────
  function showLogin() {
    loginScreen.classList.remove('hidden');
    app.classList.add('hidden');
  }

  function showApp() {
    loginScreen.classList.add('hidden');
    app.classList.remove('hidden');
    loadContent('posts');
    loadImages();
  }

  function handleLogin() {
    // Redirect to Netlify Function which starts OAuth flow
    window.location.href = '/.netlify/functions/auth';
  }

  function handleLogout() {
    token = null;
    localStorage.removeItem('cms_gh_token');
    if (editor) {
      editor.toTextArea();
      editor = null;
    }
    currentFile = null;
    showLogin();
  }

  // ─── GitHub API helpers ───────────────────────────────
  async function ghFetch(path, opts = {}) {
    const url = path.startsWith('http') ? path : `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/${path}`;
    const res = await fetch(url, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        ...opts.headers,
      },
      ...opts,
    });
    if (res.status === 401) {
      toast('Session expired. Please sign in again.', 'error');
      handleLogout();
      throw new Error('Unauthorized');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `GitHub API error ${res.status}`);
    }
    return res.json();
  }

  // ─── Content Loading ──────────────────────────────────
  async function loadContent(type) {
    const listEl = contentList;
    listEl.innerHTML = '<div class="loading-spinner"></div>';

    const dirPath = type === 'posts' ? POSTS_PATH : PAGES_PATH;
    try {
      const files = await ghFetch(`contents/${dirPath}?ref=${BRANCH}`);
      const mdFiles = files.filter(f => f.name.endsWith('.md'));

      // Sort by name descending (roughly by date for posts)
      mdFiles.sort((a, b) => b.name.localeCompare(a.name));

      listEl.innerHTML = '';
      if (mdFiles.length === 0) {
        listEl.innerHTML = '<div style="padding:16px;color:var(--cms-text-dim);font-size:13px;">No content found.</div>';
        return;
      }

      for (const f of mdFiles) {
        const item = document.createElement('div');
        item.className = 'content-item';
        item.dataset.path = f.path;
        item.dataset.sha = f.sha;

        // Try to extract a title from the filename
        const displayName = f.name.replace('.md', '').replace(/-/g, ' ');
        item.innerHTML = `
          <span class="content-item-title">${capitalize(displayName)}</span>
          <span class="content-item-meta">${f.path}</span>
        `;
        item.addEventListener('click', () => openFile(f.path, f.sha));
        listEl.appendChild(item);
      }
    } catch (err) {
      listEl.innerHTML = `<div style="padding:16px;color:var(--cms-danger);font-size:13px;">Error: ${err.message}</div>`;
    }
  }

  async function loadImages() {
    imageGallery.innerHTML = '<div class="loading-spinner"></div>';
    try {
      const items = await loadImagesRecursive(IMAGES_PATH);
      imageCache = items;
      renderImageGallery(items);
    } catch (err) {
      imageGallery.innerHTML = `<div style="padding:16px;color:var(--cms-danger);font-size:13px;">Error loading images</div>`;
    }
  }

  async function loadImagesRecursive(path) {
    const files = await ghFetch(`contents/${path}?ref=${BRANCH}`);
    let images = [];
    for (const f of files) {
      if (f.type === 'dir') {
        const sub = await loadImagesRecursive(f.path);
        images = images.concat(sub);
      } else if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f.name)) {
        images.push(f);
      }
    }
    return images;
  }

  function renderImageGallery(images) {
    imageGallery.innerHTML = '';
    if (images.length === 0) {
      imageGallery.innerHTML = '<div style="padding:16px;color:var(--cms-text-dim);font-size:13px;grid-column:1/-1;">No images found.</div>';
      return;
    }
    for (const img of images) {
      const el = document.createElement('div');
      el.className = 'gallery-item';
      // Use raw GitHub URL for preview
      const rawUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${img.path}`;
      el.innerHTML = `
        <img src="${rawUrl}" alt="${img.name}" loading="lazy">
        <div class="gallery-item-name">${img.name}</div>
      `;
      el.addEventListener('click', () => insertImageFromGallery(img));
      imageGallery.appendChild(el);
    }
  }

  // ─── File Operations ──────────────────────────────────
  async function openFile(path, sha) {
    try {
      setStatus('Loading…');

      // Highlight active item
      $$('.content-item').forEach(el => el.classList.remove('active'));
      const activeItem = document.querySelector(`.content-item[data-path="${path}"]`);
      if (activeItem) activeItem.classList.add('active');

      const fileData = await ghFetch(`contents/${path}?ref=${BRANCH}`);
      const raw = atob(fileData.content);
      const { frontmatter, body } = parseFrontmatter(raw);

      currentFile = {
        path: fileData.path,
        sha: fileData.sha,
        content: raw,
        frontmatter,
        body,
        isNew: false,
      };

      showEditor(frontmatter, body);
      setStatus('Ready');
      isDirty = false;
    } catch (err) {
      toast(`Failed to open file: ${err.message}`, 'error');
      setStatus('Error');
    }
  }

  function showEditor(fm, body) {
    emptyState.classList.add('hidden');
    editorPanel.classList.remove('hidden');

    // Populate frontmatter fields
    fmTitle.value = fm.title || '';
    fmDate.value = fm.date ? formatDateForInput(fm.date) : '';
    fmTags.value = Array.isArray(fm.tags) ? fm.tags.join(', ') : (fm.tags || '');

    // Set layout dropdown
    const layout = fm.layout || 'layouts/post.njk';
    for (const opt of fmLayout.options) {
      opt.selected = opt.value === layout;
    }

    // Initialize or update EasyMDE
    if (editor) {
      editor.value(body || '');
    } else {
      initEditor(body || '');
    }
  }

  function initEditor(content) {
    const textarea = $('#markdown-editor');

    editor = new EasyMDE({
      element: textarea,
      initialValue: content,
      spellChecker: false,
      autofocus: true,
      status: false,
      autoDownloadFontAwesome: true,
      toolbar: [
        'bold', 'italic', 'heading', '|',
        'quote', 'unordered-list', 'ordered-list', '|',
        'link',
        {
          name: 'upload-image',
          action: () => showImageModal(),
          className: 'fa fa-image',
          title: 'Insert Image',
        },
        'code', 'table', '|',
        'preview', 'side-by-side', 'fullscreen', '|',
        'guide',
      ],
      previewRender: (text) => {
        return marked.parse(text);
      },
    });

    // Track dirty state
    editor.codemirror.on('change', () => {
      isDirty = true;
      setStatus('Unsaved changes');
    });
  }

  async function saveFile() {
    if (!currentFile) return;

    const fm = buildFrontmatter();
    const body = editor.value();
    const fullContent = serializeFrontmatter(fm, body);

    setStatus('Saving…');
    saveBtn.disabled = true;

    try {
      const payload = {
        message: `cms: update ${currentFile.path}`,
        content: btoa(unescape(encodeURIComponent(fullContent))),
        branch: BRANCH,
      };
      if (currentFile.sha) {
        payload.sha = currentFile.sha;
      }

      const res = await ghFetch(`contents/${currentFile.path}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      currentFile.sha = res.content.sha;
      currentFile.isNew = false;
      isDirty = false;
      setStatus('Saved');
      toast('Content saved successfully!', 'success');

      // Refresh content list
      loadContent(currentTab);
    } catch (err) {
      toast(`Save failed: ${err.message}`, 'error');
      setStatus('Save failed');
    } finally {
      saveBtn.disabled = false;
    }
  }

  async function deleteFile() {
    if (!currentFile || currentFile.isNew) return;
    if (!confirm(`Delete "${currentFile.path}"? This cannot be undone.`)) return;

    setStatus('Deleting…');
    try {
      await ghFetch(`contents/${currentFile.path}`, {
        method: 'DELETE',
        body: JSON.stringify({
          message: `cms: delete ${currentFile.path}`,
          sha: currentFile.sha,
          branch: BRANCH,
        }),
      });

      toast('File deleted.', 'info');
      currentFile = null;
      editorPanel.classList.add('hidden');
      emptyState.classList.remove('hidden');
      if (editor) {
        editor.value('');
      }
      loadContent(currentTab);
    } catch (err) {
      toast(`Delete failed: ${err.message}`, 'error');
      setStatus('Error');
    }
  }

  // ─── New Content ──────────────────────────────────────
  function showNewModal() {
    newModal.classList.remove('hidden');
    $('#new-title').value = '';
    $('#new-title').focus();
  }

  function createNewContent() {
    const type = $('#new-type').value;
    const title = $('#new-title').value.trim();
    if (!title) {
      toast('Please enter a title.', 'error');
      return;
    }

    const slug = slugify(title);
    const dir = type === 'post' ? POSTS_PATH : PAGES_PATH;
    const path = `${dir}/${slug}.md`;
    const layout = type === 'post' ? 'layouts/post.njk' : 'layouts/page.njk';
    const today = new Date().toISOString().split('T')[0];

    const fm = { title, layout };
    if (type === 'post') {
      fm.date = today;
      fm.tags = ['post'];
    }

    currentFile = {
      path,
      sha: null,
      content: '',
      frontmatter: fm,
      body: '\nStart writing here…\n',
      isNew: true,
    };

    // Switch to correct tab
    switchTab(type === 'post' ? 'posts' : 'pages');

    showEditor(fm, currentFile.body);
    isDirty = true;
    setStatus('New file — unsaved');

    newModal.classList.add('hidden');
  }

  // ─── Image Upload ─────────────────────────────────────
  let pendingFiles = [];

  function showImageModal() {
    imageModal.classList.remove('hidden');
    pendingFiles = [];
    uploadPreview.innerHTML = '';
    uploadPreview.classList.add('hidden');
    uploadProgress.classList.add('hidden');
    uploadConfirm.disabled = true;
    fileInput.value = '';
  }

  function hideImageModal() {
    imageModal.classList.add('hidden');
    pendingFiles = [];
  }

  function handleFileSelect(files) {
    pendingFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (pendingFiles.length === 0) return;

    uploadPreview.innerHTML = '';
    uploadPreview.classList.remove('hidden');
    uploadConfirm.disabled = false;

    pendingFiles.forEach(f => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target.result;
        uploadPreview.appendChild(img);
      };
      reader.readAsDataURL(f);
    });
  }

  async function uploadImages() {
    if (pendingFiles.length === 0) return;

    uploadConfirm.disabled = true;
    uploadProgress.classList.remove('hidden');
    progressFill.style.width = '0%';

    const insertedPaths = [];

    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i];
      const pct = ((i) / pendingFiles.length * 100);
      progressFill.style.width = pct + '%';
      progressText.textContent = `Uploading ${i + 1}/${pendingFiles.length}…`;

      try {
        const base64 = await fileToBase64(file);
        const filePath = `${IMAGES_PATH}/${file.name}`;

        // Check if file already exists
        let existingSha = null;
        try {
          const existing = await ghFetch(`contents/${filePath}?ref=${BRANCH}`);
          existingSha = existing.sha;
        } catch (e) {
          // File doesn't exist, that's fine
        }

        const payload = {
          message: `cms: upload image ${file.name}`,
          content: base64,
          branch: BRANCH,
        };
        if (existingSha) payload.sha = existingSha;

        await ghFetch(`contents/${filePath}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });

        insertedPaths.push(`/${filePath}`);
      } catch (err) {
        toast(`Failed to upload ${file.name}: ${err.message}`, 'error');
      }
    }

    progressFill.style.width = '100%';
    progressText.textContent = 'Done!';

    // Insert image markdown into editor
    if (editor && insertedPaths.length > 0) {
      const imageMarkdown = insertedPaths.map(p => `![image](${p})`).join('\n');
      const cm = editor.codemirror;
      const cursor = cm.getCursor();
      cm.replaceRange('\n' + imageMarkdown + '\n', cursor);
    }

    toast(`${insertedPaths.length} image(s) uploaded!`, 'success');
    hideImageModal();
    loadImages();
  }

  function insertImageFromGallery(img) {
    if (!editor) {
      toast('Open a file first to insert images.', 'error');
      return;
    }
    const imagePath = `/${img.path}`;
    const cm = editor.codemirror;
    const cursor = cm.getCursor();
    cm.replaceRange(`\n![image](${imagePath})\n`, cursor);
    toast('Image inserted!', 'info');
  }

  // ─── Frontmatter Parsing ──────────────────────────────
  function parseFrontmatter(content) {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) return { frontmatter: {}, body: content };
    try {
      const frontmatter = jsyaml.load(match[1]) || {};
      return { frontmatter, body: match[2] };
    } catch (e) {
      return { frontmatter: {}, body: content };
    }
  }

  function buildFrontmatter() {
    const fm = {};
    fm.title = fmTitle.value.trim() || 'Untitled';
    if (fmDate.value) fm.date = fmDate.value;
    if (fmTags.value.trim()) {
      fm.tags = fmTags.value.split(',').map(t => t.trim()).filter(Boolean);
    }
    fm.layout = fmLayout.value;

    // Preserve any extra frontmatter keys from the original
    if (currentFile && currentFile.frontmatter) {
      const preserved = ['summary', 'permalink', 'eleventyNavigation', 'order', 'section'];
      for (const key of preserved) {
        if (currentFile.frontmatter[key] !== undefined && fm[key] === undefined) {
          fm[key] = currentFile.frontmatter[key];
        }
      }
    }

    return fm;
  }

  function serializeFrontmatter(fm, body) {
    const yaml = jsyaml.dump(fm, { lineWidth: -1, quotingType: '"', forceQuotes: false });
    return `---\n${yaml}---\n${body}`;
  }

  // ─── Tabs ─────────────────────────────────────────────
  function switchTab(tab) {
    currentTab = tab;
    $$('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));

    if (tab === 'images') {
      contentList.classList.add('hidden');
      imageGallery.classList.remove('hidden');
    } else {
      contentList.classList.remove('hidden');
      imageGallery.classList.add('hidden');
      loadContent(tab);
    }
  }

  // ─── Drag & Drop ──────────────────────────────────────
  function setupDragDrop() {
    const editorArea = $('#editor-area');
    let dragCounter = 0;

    editorArea.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      if (dragCounter === 1) {
        dropOverlay.classList.remove('hidden');
      }
    });

    editorArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        dropOverlay.classList.add('hidden');
      }
    });

    editorArea.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    editorArea.addEventListener('drop', (e) => {
      e.preventDefault();
      dragCounter = 0;
      dropOverlay.classList.add('hidden');
      
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (files.length > 0) {
        pendingFiles = files;
        showImageModal();
        handleFileSelect(files);
      }
    });
  }

  // ─── Events ───────────────────────────────────────────
  function bindEvents() {
    // Login
    loginBtn.addEventListener('click', handleLogin);

    // Logout
    logoutBtn.addEventListener('click', handleLogout);

    // Tabs
    $$('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // New content
    newContentBtn.addEventListener('click', showNewModal);
    newConfirm.addEventListener('click', createNewContent);
    newModal.querySelector('[data-close]').addEventListener('click', () => newModal.classList.add('hidden'));
    newModal.querySelector('.modal-backdrop').addEventListener('click', () => newModal.classList.add('hidden'));
    // Enter key in new title
    $('#new-title').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') createNewContent();
    });

    // Save
    saveBtn.addEventListener('click', saveFile);

    // Delete
    deleteBtn.addEventListener('click', deleteFile);

    // Keyboard shortcut
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentFile) saveFile();
      }
    });

    // Image modal
    modalClose.addEventListener('click', hideImageModal);
    imageModal.querySelector('.modal-backdrop').addEventListener('click', hideImageModal);
    uploadConfirm.addEventListener('click', uploadImages);
    fileInput.addEventListener('change', (e) => handleFileSelect(e.target.files));

    // Upload zone click
    uploadZone.addEventListener('click', () => fileInput.click());

    // Upload zone drag
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('drag-over');
    });
    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('drag-over');
    });
    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
      handleFileSelect(e.dataTransfer.files);
    });

    // Frontmatter change tracking
    [fmTitle, fmDate, fmTags, fmLayout].forEach(el => {
      el.addEventListener('input', () => {
        isDirty = true;
        setStatus('Unsaved changes');
      });
    });

    // Drag & drop on editor
    setupDragDrop();

    // Warn before leaving with unsaved changes
    window.addEventListener('beforeunload', (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  // ─── Helpers ──────────────────────────────────────────
  function toast(message, type = 'info') {
    const container = $('#toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  function setStatus(text) {
    editorStatus.textContent = text;
  }

  function capitalize(str) {
    return str.replace(/\b\w/g, c => c.toUpperCase());
  }

  function slugify(str) {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function formatDateForInput(date) {
    if (typeof date === 'string') {
      // Handle ISO strings and plain dates
      return date.split('T')[0];
    }
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return '';
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Remove data URL prefix to get pure base64
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ─── Boot ─────────────────────────────────────────────
  init();

})();
