/**
 * Diễm Gay - Hệ Thống Ôn Sources Chuẩn Xác 100%
 * Frontend Application Engine with Device-Node Security
 */

const SECRET_SALT = 'DIEMGAY_SECRET_SALT_2026_VUTHEDAN';

const VIP_KEYS = [
  'DG-VIP-01-9482-A7F1',
  'DG-VIP-02-3819-B5E2',
  'DG-VIP-03-7264-C8D3',
  'DG-VIP-04-1945-D2C4',
  'DG-VIP-05-5820-E6B5',
  'DG-VIP-06-8371-F9A6',
  'DG-VIP-07-2693-G4T7',
  'DG-VIP-08-6154-H7S8',
  'DG-VIP-09-4708-J1R9',
  'DG-VIP-10-9532-K3P0'
];

const ADMIN_MASTER_KEY = 'ADMIN-DIEMGAY-9999';

// Pure JavaScript FIPS 180-2 SHA-256 implementation (Works 100% offline & all origins)
function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  var mathPow = Math.pow;
  var maxWord = mathPow(2, 32);
  var lengthProperty = 'length';
  var i, j;
  var result = '';
  var words = [];
  var asciiBitLength = ascii[lengthProperty] * 8;
  var hash = [];
  var k = [];
  var primeCounter = 0;
  var isComposite = {};
  for (var candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  ascii += '\x80';
  while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
  words[words[lengthProperty]] = (asciiBitLength | 0);
  for (j = 0; j < words[lengthProperty];) {
    var w = words.slice(j, j += 16);
    var oldHash = hash;
    hash = hash.slice(0, 8);
    for (i = 0; i < 64; i++) {
      var w15 = w[i - 15], w2 = w[i - 2];
      var a = hash[0], e = hash[4];
      var temp1 = hash[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & hash[5]) ^ ((~e) & hash[6]))
        + k[i]
        + (w[i] = (i < 16) ? w[i] : (
            w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0
        );
      var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  for (i = 0; i < 8; i++) {
    for (var i2 = 3; i2 >= 0; i2--) {
      var b = (hash[i] >> (8 * i2)) & 255;
      result += ((b < 16) ? 0 : '') + b.toString(16);
    }
  }
  return result;
}

function getDeviceId() {
  let devId = localStorage.getItem('diemgay_device_id');
  if (!devId) {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const seed = (navigator.userAgent.length * 31 + screen.width * 7 + screen.height * 11).toString(16).toUpperCase().slice(-4).padStart(4, 'A');
    devId = 'DG-DEV-' + seed + '-' + rand;
    localStorage.setItem('diemgay_device_id', devId);
  }
  return devId;
}

function generateKeyForDevice(deviceId) {
  const clean = (deviceId || '').trim().toUpperCase();
  const hash = sha256(clean + ':' + SECRET_SALT).toUpperCase();
  return 'DG-KEY-' + hash.slice(0, 4) + '-' + hash.slice(4, 8) + '-' + hash.slice(8, 12);
}


class DiemGayApp {
  constructor() {
    this.deviceId = getDeviceId();
    this.isUnlocked = this.checkUnlockStatus();
    this.logoClickCount = 0;
    this.data = window.DIEMGAY_DATA || { subjects: [], questions: {} };
    this.currentSubjectId = 'ACC101';
    this.currentTab = 'batch'; // 'batch', 'exam', 'search'
    
    // Batch study state
    this.currentBatchIndex = null; // null = overview, number = specific batch
    this.currentBatchMode = 'learn'; // 'learn' or 'flashcard'
    this.currentQuestionIndex = 0;
    this.isReviewMode = false;
    this.reviewQuestionIds = [];
    
    // In-question states
    this.pickedAnswers = [];
    this.isChecked = false;
    this.isCardFlipped = false;
    
    // Exam state
    this.exam = {
      active: false,
      questions: [],
      userAnswers: {},
      currentIndex: 0,
      totalSeconds: 3600,
      secondsRemaining: 3600,
      timerId: null,
      submitted: false,
      score: 0,
      correctCount: 0
    };

    // Search state
    this.searchQuery = '';
    this.searchSubject = 'ALL';

    // Theme state
    this.isDark = localStorage.getItem('diemgay_theme') === 'dark';

    // Initialize
    this.init();
  }

  init() {
    // Logo 5-click easter egg to open Admin Panel
    const logoBtn = document.getElementById('brand-logo-btn');
    if (logoBtn) {
      logoBtn.addEventListener('click', (e) => {
        this.logoClickCount++;
        if (this.logoClickCount >= 5) {
          this.logoClickCount = 0;
          this.openAdminModal();
        }
      });
    }

    // Ctrl + Shift + A shortcut to open Admin Modal
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        this.openAdminModal();
      }
    });
    // Apply theme
    if (this.isDark) {
      document.documentElement.classList.add('dark');
      this.updateThemeIcons(true);
    }

    // Bind keyboard shortcuts
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Initial render
    this.renderSubjectTabs();
    this.render();
  }

  // --- STORAGE & PROGRESS MANAGEMENT ---
  getSubjectProgress(subjectId = this.currentSubjectId) {
    const key = `diemgay_progress_${subjectId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse progress for', subjectId, e);
      }
    }
    return {
      batchSize: 20,
      selectedYears: [],
      doneBatches: [],
      statuses: {} // { [qId]: 'know' | 'still' }
    };
  }

  saveSubjectProgress(progress, subjectId = this.currentSubjectId) {
    const key = `diemgay_progress_${subjectId}`;
    localStorage.setItem(key, JSON.stringify(progress));
  }

  getSubjectQuestions(subjectId = this.currentSubjectId) {
    return this.data.questions[subjectId] || [];
  }

  getCurrentSubjectInfo() {
    return this.data.subjects.find(s => s.id === this.currentSubjectId) || { name: this.currentSubjectId, totalQuestions: 0 };
  }

  // --- THEME TOGGLE ---
  toggleTheme() {
    this.isDark = !this.isDark;
    document.documentElement.classList.toggle('dark', this.isDark);
    localStorage.setItem('diemgay_theme', this.isDark ? 'dark' : 'light');
    this.updateThemeIcons(this.isDark);
  }

  updateThemeIcons(isDark) {
    const moon = document.getElementById('theme-icon-moon');
    const sun = document.getElementById('theme-icon-sun');
    if (moon && sun) {
      if (isDark) {
        moon.classList.add('hidden');
        sun.classList.remove('hidden');
      } else {
        moon.classList.remove('hidden');
        sun.classList.add('hidden');
      }
    }
  }

  // --- TABS & NAVIGATION ---
  setSubject(subjectId) {
    if (this.currentSubjectId === subjectId) return;
    this.currentSubjectId = subjectId;
    this.currentBatchIndex = null;
    this.isReviewMode = false;
    this.currentQuestionIndex = 0;
    this.resetQuestionState();
    this.renderSubjectTabs();
    this.render();
  }

  setTab(tab) {
    this.currentTab = tab;
    // Update active state in header
    ['batch', 'exam', 'search'].forEach(t => {
      const btn = document.getElementById(`nav-btn-${t}`);
      const mBtn = document.getElementById(`mobile-nav-batch`);
      if (btn) {
        if (t === tab) {
          btn.className = "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors duration-150 bg-primary-solid text-primary-on-solid";
        } else {
          btn.className = "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-content-muted hover:bg-surface-sunken hover:text-content transition-colors duration-150";
        }
      }
    });

    ['batch', 'exam', 'search'].forEach(t => {
      const mBtn = document.getElementById(`mobile-nav-${t}`);
      if (mBtn) {
        if (t === tab) {
          mBtn.className = "flex flex-col items-center gap-0.5 text-primary font-semibold";
        } else {
          mBtn.className = "flex flex-col items-center gap-0.5 text-content-muted";
        }
      }
    });

    this.render();
  }

  renderSubjectTabs() {
    const container = document.getElementById('subject-tabs');
    if (!container) return;

    container.innerHTML = this.data.subjects.map(s => {
      const active = s.id === this.currentSubjectId;
      const progress = this.getSubjectProgress(s.id);
      const knowCount = Object.values(progress.statuses).filter(st => st === 'know').length;
      const total = s.totalQuestions;
      const pct = total > 0 ? Math.round((knowCount / total) * 100) : 0;

      return `
        <button onclick="app.setSubject('${s.id}')" class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 transition-all ${
          active
            ? 'bg-surface-raised font-bold text-primary shadow-sm ring-1 ring-subtle'
            : 'text-content-muted hover:text-content hover:bg-surface/50'
        }">
          <span>${s.code}</span>
          <span class="rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
            active ? 'bg-primary-soft text-primary' : 'bg-surface-sunken text-content-subtle'
          }">${total} câu · ${pct}%</span>
        </button>
      `;
    }).join('');
  }

  // --- RENDER MAIN VIEW ---
  render() {
    this.updateHeaderLockState();
    const main = document.getElementById('main-content');
    if (!main) return;

    if (this.currentTab === 'batch') {
      main.innerHTML = this.renderBatchView();
    } else if (this.currentTab === 'exam') {
      main.innerHTML = this.renderExamView();
    } else if (this.currentTab === 'search') {
      main.innerHTML = this.renderSearchView();
    }
  }

  // ==========================================
  // VIEW 1: BATCH STUDY (ASK-4-HELP REPLICA)
  // ==========================================
  renderBatchView() {
    const questions = this.getSubjectQuestions();
    const progress = this.getSubjectProgress();

    if (questions.length === 0) {
      return `
        <div class="mx-auto max-w-2xl px-4 py-16 text-center">
          <p class="text-content-muted">Chưa có câu hỏi cho môn học này.</p>
        </div>
      `;
    }

    // Sub-view A: Active Session (Inside a Part or Review)
    if (this.currentBatchIndex !== null || this.isReviewMode) {
      return this.renderActiveSessionView();
    }

    // Sub-view B: Configuration Screen
    if (this.showBatchConfigModal) {
      return this.renderBatchConfigView();
    }

    // Sub-view C: Parts Overview List
    return this.renderBatchOverviewView();
  }

  renderBatchConfigView() {
    const questions = this.getSubjectQuestions();
    const progress = this.getSubjectProgress();
    const totalQ = questions.length;
    const presets = [10, 20, 30, 50, 100];
    const currentBatchSize = progress.batchSize || 20;

    return `
      <div class="mx-auto max-w-2xl px-4 py-8 animate-in fade-in duration-200">
        <div class="rounded-2xl bg-surface-raised p-6 sm:p-8 shadow-card ring-1 ring-subtle">
          <div class="flex items-center justify-between border-b border-subtle pb-4">
            <div>
              <h2 class="font-display text-xl font-bold text-content">Chia phần để học</h2>
              <p class="mt-1 text-sm text-content-muted">
                Nguồn <strong class="text-primary">${this.currentSubjectId}</strong> có <strong>${totalQ} câu hỏi</strong>.
                Chia thành từng phần nhỏ giúp học nhanh và dễ nhớ hơn.
              </p>
            </div>
            <button onclick="app.showBatchConfigModal = false; app.render();" class="grid size-8 place-items-center rounded-full hover:bg-surface-sunken text-content-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="mt-6 space-y-6">
            <div>
              <label class="block text-sm font-semibold text-content mb-3">Mỗi phần bao nhiêu câu?</label>
              <div class="flex flex-wrap items-center gap-2">
                ${presets.map(size => `
                  <button type="button" onclick="app.setTempBatchSize(${size})" class="h-10 rounded-full px-5 text-sm font-medium ring-1 transition-all ${
                    currentBatchSize === size
                      ? 'bg-primary-soft text-primary ring-primary font-semibold'
                      : 'bg-surface text-content-muted ring-subtle hover:ring-strong'
                  }">
                    ${size} câu
                  </button>
                `).join('')}
                
                <div class="inline-flex items-center gap-2 ml-2">
                  <span class="text-xs font-medium text-content-muted">Khác:</span>
                  <input type="number" id="custom-batch-size" min="5" max="500" value="${currentBatchSize}" 
                    class="h-10 w-24 rounded-full bg-surface px-3 text-center text-sm font-semibold text-content tabular-nums ring-1 ring-subtle focus:outline-none focus:ring-2 focus:ring-primary"
                    onchange="app.setTempBatchSize(Number(this.value))" />
                </div>
              </div>
            </div>

            <div class="border-t border-subtle pt-6 flex items-center justify-end gap-3">
              <button onclick="app.showBatchConfigModal = false; app.render();" class="rounded-full px-5 py-2.5 text-sm font-semibold text-content-muted hover:bg-surface-sunken">Hủy</button>
              <button onclick="app.saveBatchConfig()" class="rounded-full bg-primary-solid px-6 py-2.5 text-sm font-semibold text-primary-on-solid hover:brightness-95 shadow-md shadow-primary/20">
                Lưu và bắt đầu học
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setTempBatchSize(size) {
    if (size < 1) size = 20;
    const progress = this.getSubjectProgress();
    progress.batchSize = size;
    this.saveSubjectProgress(progress);
    this.render();
  }

  saveBatchConfig() {
    this.showBatchConfigModal = false;
    this.showToast('Đã lưu cấu hình chia phần!', 'success');
    this.render();
  }

  renderBatchOverviewView() {
    const questions = this.getSubjectQuestions();
    const progress = this.getSubjectProgress();
    const batchSize = progress.batchSize || 20;
    const totalQuestions = questions.length;
    const totalBatches = Math.ceil(totalQuestions / batchSize);
    const doneBatches = progress.doneBatches || [];
    const doneCount = doneBatches.length;

    // Build batch list
    const batchList = [];
    for (let i = 0; i < totalBatches; i++) {
      const from = i * batchSize + 1;
      const to = Math.min((i + 1) * batchSize, totalQuestions);
      const batchSlice = questions.slice(i * batchSize, (i + 1) * batchSize);
      const isDone = doneBatches.includes(i);
      
      const knowCount = batchSlice.filter(q => progress.statuses[q.id] === 'know').length;
      const stillCount = batchSlice.filter(q => progress.statuses[q.id] === 'still').length;
      const stillIds = batchSlice.filter(q => progress.statuses[q.id] === 'still').map(q => q.id);

      batchList.push({
        index: i,
        from,
        to,
        count: batchSlice.length,
        isDone,
        knowCount,
        stillCount,
        stillIds
      });
    }

    const nextBatch = batchList.find(b => !b.isDone) || batchList[0];
    const allStillIds = batchList.flatMap(b => b.stillIds);

    return `
      <div class="mx-auto max-w-3xl px-4 py-6 animate-in fade-in duration-200">
        
        <!-- Header summary & Progress -->
        <div class="rounded-2xl bg-surface-raised p-5 sm:p-6 shadow-card ring-1 ring-subtle">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <h1 class="font-display text-xl font-bold text-content">${this.getCurrentSubjectInfo().name}</h1>
                <span class="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">${totalQuestions} câu</span>
              </div>
              <p class="mt-1 text-sm text-content-muted tabular-nums">
                Đã xong <strong class="font-semibold text-primary">${doneCount}</strong>/${totalBatches} phần · ${batchSize} câu mỗi phần
              </p>
            </div>
            <button onclick="app.showBatchConfigModal = true; app.render();" class="btn-prominent">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              Chia lại
            </button>
          </div>

          <!-- Overall Progress Bar -->
          <div class="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
            <div class="h-full rounded-full bg-primary-solid transition-all duration-300 ease-product" style="width: ${totalBatches > 0 ? (doneCount / totalBatches) * 100 : 0}%"></div>
          </div>

          <!-- Quick Action Button -->
          ${!this.isUnlocked ? `
            <button onclick="app.openAdminModal()" class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/40 px-4 py-3 font-bold hover:bg-amber-500 hover:text-white shadow-sm transition-all group relative cursor-pointer" title="Bấm vào Bảng quản trị admin để mở khóa">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>Chưa mở khóa — Bấm vào Bảng quản trị admin để mở khóa</span>
              <div class="part-lock-tooltip">Bấm vào Bảng quản trị admin để mở khóa</div>
            </button>
          ` : (nextBatch ? `
            <button onclick="app.startBatch(${nextBatch.index}, 'learn')" class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-solid px-4 py-3 font-semibold text-primary-on-solid shadow-md shadow-primary/20 hover:brightness-95 transition-all active:scale-[0.99]">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
              Học tiếp phần ${nextBatch.index + 1} · câu ${nextBatch.from}–${nextBatch.to}
            </button>
          ` : `
            <div class="mt-4 rounded-xl bg-primary-soft p-3.5 text-center text-sm font-semibold text-primary">
              🎉 Bạn đã học hết tất cả ${totalBatches} phần của môn này!
            </div>
          `)}

          <!-- Review all marked questions pill -->
          ${allStillIds.length > 0 ? `
            <div class="mt-3 flex items-center justify-between rounded-xl bg-warning-soft px-4 py-2.5 text-xs text-warning">
              <span class="font-medium">Có <strong>${allStillIds.length} câu</strong> được đánh dấu cần học lại ở mọi phần.</span>
              <div class="flex items-center gap-1.5">
                <button onclick="app.startReviewSession(${JSON.stringify(allStillIds).replace(/"/g, '&quot;')}, 'learn')" class="rounded-full bg-warning px-3 py-1 font-semibold text-white hover:brightness-95">
                  Ôn lại (Học)
                </button>
                <button onclick="app.startReviewSession(${JSON.stringify(allStillIds).replace(/"/g, '&quot;')}, 'flashcard')" class="rounded-full bg-surface-raised px-3 py-1 font-semibold text-warning ring-1 ring-warning/30 hover:bg-warning-soft">
                  Lật thẻ
                </button>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Parts List Grid -->
        <div class="mt-3 space-y-2">
          <h3 class="text-xs font-semibold uppercase tracking-wider text-content-subtle px-1">Danh sách các phần (${totalBatches} phần)</h3>
          
          <div class="grid gap-2 sm:grid-cols-1">
            ${batchList.map(b => `
              <div class="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-raised p-3.5 sm:px-4 shadow-card ring-1 ring-subtle hover:ring-strong transition-all">
                
                <!-- Left: Complete toggle OR Lock Icon with Tooltip -->
                <div class="flex items-center gap-3">
                  ${this.isUnlocked ? `
                    <button onclick="app.toggleBatchDone(${b.index})" title="${b.isDone ? 'Bỏ đánh dấu xong' : 'Đánh dấu đã xong'}" class="grid size-8 shrink-0 place-items-center rounded-full ring-1 transition-colors ${
                      b.isDone
                        ? 'bg-primary-solid text-primary-on-solid ring-primary'
                        : 'bg-surface text-content-muted ring-subtle hover:ring-strong'
                    }">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                  ` : `
                    <div class="part-lock-wrapper group cursor-pointer" onclick="app.openAdminModal()" title="Bấm vào Bảng quản trị admin để mở khóa">
                      <div class="grid size-8 shrink-0 place-items-center rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/40 group-hover:bg-amber-500 group-hover:text-white transition-all shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      </div>
                      <div class="part-lock-tooltip">Bấm vào Bảng quản trị admin để mở khóa</div>
                    </div>
                  `}

                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-display text-sm font-bold text-content">Phần ${b.index + 1}</span>
                      <span class="text-xs text-content-muted tabular-nums">Câu ${b.from}–${b.to} (${b.count} câu)</span>
                    </div>
                    
                    <div class="flex items-center gap-2.5 text-[11px] text-content-subtle mt-0.5">
                      <span class="inline-flex items-center gap-1 text-primary"><span class="size-1.5 rounded-full bg-primary-solid"></span> ${b.knowCount} thuộc</span>
                      ${b.stillCount > 0 ? `<span class="inline-flex items-center gap-1 text-warning font-semibold"><span class="size-1.5 rounded-full bg-warning"></span> ${b.stillCount} học lại</span>` : ''}
                    </div>
                  </div>
                </div>

                <!-- Right: Study & Flashcard Action Buttons (Locked or Active) -->
                ${this.isUnlocked ? `
                  <div class="flex items-center gap-2 ml-auto">
                    <button onclick="app.startBatch(${b.index}, 'learn')" class="btn-part-hoc">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                      Học
                    </button>
                    <button onclick="app.startBatch(${b.index}, 'flashcard')" class="btn-part-card">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
                      Thẻ ghi nhớ
                    </button>
                  </div>
                ` : `
                  <div class="flex items-center gap-2 ml-auto">
                    <button onclick="app.openAdminModal()" class="btn-part-locked group/btn relative cursor-pointer" title="Bấm vào Bảng quản trị admin để mở khóa">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      Học
                      <div class="part-lock-tooltip">Bấm vào Bảng quản trị admin để mở khóa</div>
                    </button>
                    <button onclick="app.openAdminModal()" class="btn-part-locked group/btn relative cursor-pointer" title="Bấm vào Bảng quản trị admin để mở khóa">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      Thẻ ghi nhớ
                      <div class="part-lock-tooltip">Bấm vào Bảng quản trị admin để mở khóa</div>
                    </button>
                  </div>
                `}

              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;
  }

  toggleBatchDone(batchIndex) {
    const progress = this.getSubjectProgress();
    const doneBatches = progress.doneBatches || [];
    if (doneBatches.includes(batchIndex)) {
      progress.doneBatches = doneBatches.filter(i => i !== batchIndex);
    } else {
      progress.doneBatches.push(batchIndex);
      this.showToast(`Đã đánh dấu xong Phần ${batchIndex + 1}!`, 'success');
    }
    this.saveSubjectProgress(progress);
    this.render();
  }

  startBatch(batchIndex, mode = 'learn') {
    if (!this.isUnlocked) {
      this.showToast('Vui lòng mở khóa tại Bảng quản trị admin để học phần này!', 'warning');
      this.openAdminModal(true);
      return;
    }
    this.currentBatchIndex = batchIndex;
    this.currentBatchMode = mode;
    this.isReviewMode = false;
    this.reviewQuestionIds = [];
    this.currentQuestionIndex = 0;
    this.resetQuestionState();
    this.render();
  }

  startReviewSession(questionIds, mode = 'learn') {
    if (!this.isUnlocked) {
      this.showToast('Vui lòng mở khóa tại Bảng quản trị admin để ôn lại!', 'warning');
      this.openAdminModal(true);
      return;
    }
    if (!questionIds || questionIds.length === 0) return;
    this.currentBatchIndex = null;
    this.isReviewMode = true;
    this.reviewQuestionIds = questionIds;
    this.currentBatchMode = mode;
    this.currentQuestionIndex = 0;
    this.resetQuestionState();
    this.render();
  }

  exitBatchSession() {
    this.currentBatchIndex = null;
    this.isReviewMode = false;
    this.reviewQuestionIds = [];
    this.render();
  }

  // --- SUB-VIEW: ACTIVE SESSION (LEARN OR FLASHCARD) ---
  renderActiveSessionView() {
    const questions = this.getSubjectQuestions();
    const progress = this.getSubjectProgress();
    const batchSize = progress.batchSize || 20;

    let activeQuestions = [];
    let sessionTitle = '';

    if (this.isReviewMode) {
      activeQuestions = questions.filter(q => this.reviewQuestionIds.includes(q.id));
      sessionTitle = `Đang ôn lại ${activeQuestions.length} câu chưa thuộc`;
    } else {
      const start = this.currentBatchIndex * batchSize;
      const end = start + batchSize;
      activeQuestions = questions.slice(start, end);
      sessionTitle = `Phần ${this.currentBatchIndex + 1} · ${activeQuestions.length} câu`;
    }

    if (activeQuestions.length === 0) {
      return `
        <div class="mx-auto max-w-2xl px-4 py-16 text-center animate-in fade-in">
          <p class="text-content-muted">Phần này không còn câu nào cần học lại!</p>
          <button onclick="app.exitBatchSession()" class="mt-4 rounded-full bg-primary-solid px-6 py-2.5 font-semibold text-primary-on-solid">Quay lại danh sách</button>
        </div>
      `;
    }

    const currentQ = activeQuestions[this.currentQuestionIndex] || activeQuestions[0];
    const totalQ = activeQuestions.length;
    const currentQStatus = progress.statuses[currentQ.id];

    // Stats for progress bar in this active set
    const knowCount = activeQuestions.filter(q => progress.statuses[q.id] === 'know').length;
    const stillCount = activeQuestions.filter(q => progress.statuses[q.id] === 'still').length;
    const stillIds = activeQuestions.filter(q => progress.statuses[q.id] === 'still').map(q => q.id);
    const untouchedCount = totalQ - knowCount - stillCount;

    return `
      <div class="mx-auto flex max-w-3xl flex-col px-3 sm:px-4 py-2 sm:py-3 animate-in fade-in duration-150">
        
        <!-- Top Session Nav -->
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-subtle pb-3">
          <div class="flex items-center gap-2">
            <button onclick="app.exitBatchSession()" class="btn-prominent">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m15 18-6-6 6-6"/></svg>
              Danh sách phần
            </button>
            <span class="text-xs font-bold text-content tabular-nums">${sessionTitle}</span>
          </div>

          <!-- Switcher: Learn vs Flashcard -->
          <div class="mode-toggle-container">
            <button onclick="app.switchSessionMode('learn')" class="mode-toggle-btn ${
              this.currentBatchMode === 'learn' ? 'is-active' : ''
            }">
              Học
            </button>
            <button onclick="app.switchSessionMode('flashcard')" class="mode-toggle-btn ${
              this.currentBatchMode === 'flashcard' ? 'is-active' : ''
            }">
              Thẻ ghi nhớ
            </button>
          </div>
        </div>

        <!-- Sub-header: Current question & Question Matrix trigger -->
        <div class="mt-3 flex items-center justify-between gap-3">
          <div class="text-sm text-content-muted tabular-nums">
            ${this.currentBatchMode === 'learn' ? 'Câu' : 'Thẻ'} <strong class="text-content font-bold">${this.currentQuestionIndex + 1}</strong>/${totalQ}
          </div>

          <div class="flex items-center gap-2">
            <button onclick="app.openMatrixDrawer()" class="btn-prominent">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
              Ma trận câu
            </button>
          </div>
        </div>

        <!-- 3-Color Realtime Progress Bar -->
        <div class="mt-2.5">
          <div class="flex h-1.5 overflow-hidden rounded-full bg-surface-sunken">
            <div class="h-full bg-primary-solid transition-all duration-200" style="width: ${(knowCount / totalQ) * 100}%"></div>
            <div class="h-full bg-warning transition-all duration-200" style="width: ${(stillCount / totalQ) * 100}%"></div>
          </div>
          <div class="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-content-muted tabular-nums">
            <span class="inline-flex items-center gap-1.5"><span class="size-2 rounded-full bg-primary-solid"></span> Thuộc <strong class="font-semibold text-content">${knowCount}</strong></span>
            ${stillCount > 0 ? `
              <button onclick="app.startReviewSession(${JSON.stringify(stillIds).replace(/"/g, '&quot;')}, '${this.currentBatchMode}')" class="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-2 py-0.5 font-semibold text-warning hover:bg-warning hover:text-white transition">
                <span class="size-2 rounded-full bg-warning"></span> Ôn ${stillCount} câu này
              </button>
            ` : `
              <span class="inline-flex items-center gap-1.5"><span class="size-2 rounded-full bg-warning"></span> Học lại <strong class="font-semibold text-content">${stillCount}</strong></span>
            `}
            <span class="inline-flex items-center gap-1.5"><span class="size-2 rounded-full bg-surface-sunken ring-1 ring-strong"></span> Chưa làm <strong class="font-semibold text-content">${untouchedCount}</strong></span>
          </div>
        </div>

        <!-- Main Card Area (Learn Mode vs Flashcard Mode) -->
        <div class="mt-4 flex-1">
          ${this.currentBatchMode === 'learn'
            ? this.renderLearnCard(currentQ, this.currentQuestionIndex, totalQ)
            : this.renderFlashcard(currentQ, this.currentQuestionIndex, totalQ)
          }
        </div>

      </div>
    `;
  }

  switchSessionMode(mode) {
    this.currentBatchMode = mode;
    this.resetQuestionState();
    this.render();
  }

  resetQuestionState() {
    this.pickedAnswers = [];
    this.isChecked = false;
    this.isCardFlipped = false;
  }

  // --- SUB-VIEW: LEARN / QUIZ MODE (AUTH-STYLE) ---
  renderLearnCard(q, index, total) {
    const isMulti = q.questionType === 'MULTI' || q.correctArr.length > 1;
    const progress = this.getSubjectProgress();
    const status = progress.statuses[q.id];

    return `
      <div class="flex flex-col rounded-2xl bg-surface-raised p-4 sm:p-5 shadow-card ring-1 ring-subtle">
        
        <!-- Question Header & Badges -->
        <div class="flex items-center justify-between gap-2 border-b border-subtle pb-2">
          <div class="flex items-center gap-2">
            <span class="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary">Câu ${q.questionNo || (index + 1)}</span>
            <span class="text-xs text-content-subtle font-medium">${isMulti ? `Chọn ${q.correctArr.length} đáp án` : 'Chọn 1 đáp án'}</span>
          </div>
          ${status ? `
            <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              status === 'know' ? 'bg-primary-soft text-primary' : 'bg-warning-soft text-warning'
            }">
              ${status === 'know' ? '✓ Đã thuộc' : '⚠ Cần học lại'}
            </span>
          ` : ''}
        </div>

        <!-- Question Text -->
        <div class="mt-2.5 text-sm sm:text-base font-semibold leading-snug text-content whitespace-pre-wrap [overflow-wrap:anywhere]">
          ${q.questionText || '<span class="text-content-subtle italic">Xem các phương án bên dưới</span>'}
        </div>

        <!-- Answers Options List -->
        <div class="mt-5 space-y-2.5">
          ${q.answers.map(ans => {
            const isPicked = this.pickedAnswers.includes(ans.label);
            const isCorrect = q.correctArr.includes(ans.label);
            
            let itemClass = "border-subtle bg-surface hover:bg-surface-sunken";
            let badgeClass = "bg-surface-sunken text-content-muted";

            if (this.isChecked) {
              if (isCorrect) {
                itemClass = "border-primary bg-primary-soft text-primary ring-1 ring-primary";
                badgeClass = "bg-primary-solid text-primary-on-solid";
              } else if (isPicked && !isCorrect) {
                itemClass = "border-danger bg-danger-soft text-danger ring-1 ring-danger";
                badgeClass = "bg-danger text-white";
              }
            } else if (isPicked) {
              itemClass = "border-primary bg-primary-soft/40 ring-1 ring-primary";
              badgeClass = "bg-primary-solid text-primary-on-solid";
            }

            return `
              <button type="button" onclick="app.pickAnswer('${ans.label}', ${isMulti})" class="w-full flex items-start gap-2.5 sm:gap-3 rounded-xl border py-2 px-3 text-left text-xs sm:text-sm transition-all duration-150 ${itemClass}">
                <span class="grid size-6 shrink-0 place-items-center rounded-lg font-bold text-xs ${badgeClass}">
                  ${ans.label}
                </span>
                <div class="flex-1 pt-0.5 leading-relaxed text-content">
                  ${ans.content}
                </div>
                ${this.isChecked && isCorrect ? `
                  <span class="shrink-0 text-xs font-bold text-primary flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Đúng
                  </span>
                ` : ''}
                ${this.isChecked && isPicked && !isCorrect ? `
                  <span class="shrink-0 text-xs font-bold text-danger">Bạn chọn</span>
                ` : ''}
              </button>
            `;
          }).join('')}
        </div>

        <!-- Checked Result & Explanation Box -->
        ${this.isChecked ? `
          <div class="mt-3 rounded-xl bg-surface-sunken p-3 border border-subtle animate-in fade-in">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold uppercase tracking-wider text-primary">Đáp án chính xác:</span>
              <span class="font-display text-lg font-bold text-primary">${q.correctAnswer || q.correctArr.join(', ') || '—'}</span>
            </div>
            ${q.explanation ? `
              <div class="mt-2 text-xs text-content-muted leading-relaxed border-t border-subtle/50 pt-2">
                <strong>Giải thích:</strong> ${q.explanation}
              </div>
            ` : ''}

            <!-- Rating Feedback Prompt -->
            <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-subtle pt-3">
              <span class="text-xs font-semibold text-content-muted">Bạn thấy câu này thế nào?</span>
              <div class="flex items-center gap-2">
                <button onclick="app.markStatus('${q.id}', 'still')" class="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-4 py-2 text-xs font-bold text-warning hover:bg-warning hover:text-white transition active:scale-95">
                  <span class="kbd-badge bg-warning/20 text-warning">1</span>
                  Cần học lại
                </button>
                <button onclick="app.markStatus('${q.id}', 'know')" class="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-4 py-2 text-xs font-bold text-primary hover:bg-primary-solid hover:text-primary-on-solid transition active:scale-95">
                  <span class="kbd-badge bg-primary/20 text-primary">2</span>
                  Đã thuộc
                </button>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Bottom Action Buttons -->
        <div class="mt-3 border-t border-subtle pt-2.5 flex flex-col gap-2">
          ${!this.isChecked ? `
            <button onclick="app.checkAnswer()" ${this.pickedAnswers.length === 0 ? 'disabled' : ''} class="w-full flex items-center justify-center gap-2 rounded-xl bg-primary-solid py-2.5 text-sm font-bold text-primary-on-solid shadow-md shadow-primary/20 hover:brightness-95 disabled:opacity-40 disabled:pointer-events-none transition">
              Kiểm tra (Enter)
            </button>
          ` : ''}

          <div class="flex items-center justify-between gap-2 text-xs text-content-subtle">
            <button onclick="app.navigateQuestion(-1)" ${index === 0 ? 'disabled' : ''} class="inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-semibold text-content-muted hover:bg-surface-sunken disabled:opacity-30">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
              Trước
            </button>

            <span class="hidden sm:inline font-mono">
              ${this.isChecked ? '1: Học lại · 2: Đã thuộc · Enter: Câu sau' : 'A/B/C/D chọn · Enter kiểm tra'}
            </span>

            <button onclick="app.navigateQuestion(1)" ${index >= total - 1 ? 'disabled' : ''} class="inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-semibold text-content-muted hover:bg-surface-sunken disabled:opacity-30">
              ${this.isChecked ? 'Câu sau' : 'Bỏ qua'}
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>

      </div>
    `;
  }

  pickAnswer(label, isMulti) {
    if (this.isChecked) return;
    if (isMulti) {
      if (this.pickedAnswers.includes(label)) {
        this.pickedAnswers = this.pickedAnswers.filter(l => l !== label);
      } else {
        this.pickedAnswers.push(label);
      }
    } else {
      this.pickedAnswers = [label];
    }
    this.render();
  }

  checkAnswer() {
    if (this.pickedAnswers.length === 0 || this.isChecked) return;
    this.isChecked = true;
    this.render();
  }

  markStatus(questionId, status) {
    const progress = this.getSubjectProgress();
    progress.statuses[questionId] = status;
    this.saveSubjectProgress(progress);

    // Auto advance to next question
    this.navigateQuestion(1);
  }

  // --- SUB-VIEW: FLASHCARD 3D FLIP MODE (AUTH-STYLE) ---
  renderFlashcard(q, index, total) {
    const progress = this.getSubjectProgress();
    const status = progress.statuses[q.id];

    return `
      <div class="flex flex-col">
        
        <!-- 3D Card Container -->
        <div class="perspective-1600 w-full">
          <div id="flashcard-element" onclick="app.flipCard()" class="relative h-[20rem] sm:h-[22rem] w-full cursor-pointer rounded-2xl transform-style-3d shadow-card transition-all duration-300 ${
            this.isCardFlipped ? 'is-flipped' : ''
          }">
            
            <!-- FRONT FACE -->
            <div class="absolute inset-0 flex flex-col justify-between rounded-2xl bg-surface-raised p-5 sm:p-6 ring-1 ring-subtle backface-hidden overflow-y-auto">
              <div>
                <div class="flex items-center justify-between text-xs font-semibold text-content-subtle border-b border-subtle pb-3">
                  <span class="rounded-full bg-primary-soft px-2.5 py-0.5 text-primary">Thẻ ${q.questionNo || (index + 1)}</span>
                  <span>Nhấp hoặc bấm Space để lật</span>
                </div>
                <div class="mt-5 text-base sm:text-lg font-medium leading-relaxed text-content whitespace-pre-wrap [overflow-wrap:anywhere]">
                  ${q.questionText || 'Xem các phương án'}
                </div>

                <!-- Answers Options (hidden state) -->
                <div class="mt-4 space-y-2">
                  ${q.answers.map(ans => `
                    <div class="flex items-start gap-2.5 rounded-lg bg-surface px-3 py-2 text-xs text-content-muted">
                      <span class="font-bold text-primary">${ans.label}.</span>
                      <span class="leading-relaxed">${ans.content}</span>
                    </div>
                  `).join('')}
                </div>
              </div>

              <div class="mt-4 flex items-center justify-center gap-1.5 border-t border-subtle pt-3 text-xs text-content-subtle">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                Tự nhớ trước, rồi bấm vào thẻ để lật đáp án
              </div>
            </div>

            <!-- BACK FACE -->
            <div class="absolute inset-0 flex flex-col justify-between rounded-2xl bg-surface-raised p-5 sm:p-6 ring-2 ring-primary backface-hidden rotate-y-180 overflow-y-auto">
              <div>
                <div class="flex items-center justify-between border-b border-subtle pb-3">
                  <span class="text-xs font-bold uppercase tracking-wider text-primary">Đáp án chính xác</span>
                  <span class="text-xs text-content-subtle">Bấm để lật lại câu hỏi</span>
                </div>

                <div class="mt-4 flex items-center gap-3">
                  <span class="font-display text-4xl sm:text-5xl font-extrabold text-primary">${q.correctAnswer || q.correctArr.join(', ')}</span>
                  ${q.explanation ? `<p class="text-xs text-content-muted leading-relaxed">${q.explanation}</p>` : ''}
                </div>

                <!-- Highlighted Answers List -->
                <div class="mt-5 space-y-2">
                  ${q.answers.map(ans => {
                    const isCorrect = q.correctArr.includes(ans.label);
                    return `
                      <div class="flex items-start gap-2.5 rounded-lg p-2.5 text-xs ${
                        isCorrect ? 'bg-primary-soft text-primary font-bold ring-1 ring-primary' : 'bg-surface text-content-subtle opacity-70'
                      }">
                        <span class="font-bold">${ans.label}.</span>
                        <span class="leading-relaxed">${ans.content}</span>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>

              <div class="mt-4 flex items-center justify-center gap-1.5 border-t border-subtle pt-3 text-xs text-primary font-semibold">
                ✓ Đã xem đáp án
              </div>
            </div>

          </div>
        </div>

        <!-- Rating Controls Under Card -->
        <div class="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button onclick="app.navigateQuestion(-1)" ${index === 0 ? 'disabled' : ''} class="inline-flex items-center gap-1 rounded-full border border-subtle px-4 py-2 text-xs font-semibold text-content-muted hover:bg-surface-sunken disabled:opacity-30">
            ← Thẻ trước
          </button>

          <div class="flex items-center gap-2">
            <button onclick="app.markStatus('${q.id}', 'still')" class="inline-flex items-center gap-1.5 rounded-full bg-warning-soft px-5 py-2.5 text-xs font-bold text-warning hover:bg-warning hover:text-white transition active:scale-95">
              <span class="kbd-badge bg-warning/20 text-warning">1</span>
              Cần học lại
            </button>
            <button onclick="app.markStatus('${q.id}', 'know')" class="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-5 py-2.5 text-xs font-bold text-primary hover:bg-primary-solid hover:text-primary-on-solid transition active:scale-95">
              <span class="kbd-badge bg-primary/20 text-primary">2</span>
              Đã thuộc
            </button>
          </div>

          <button onclick="app.navigateQuestion(1)" ${index >= total - 1 ? 'disabled' : ''} class="inline-flex items-center gap-1 rounded-full border border-subtle px-4 py-2 text-xs font-semibold text-content-muted hover:bg-surface-sunken disabled:opacity-30">
            Thẻ sau →
          </button>
        </div>

        <p class="mt-3 text-center text-xs text-content-subtle font-mono">
          ← → chuyển thẻ · Space lật · 1 chưa thuộc · 2 đã thuộc
        </p>

      </div>
    `;
  }

  flipCard() {
    this.isCardFlipped = !this.isCardFlipped;
    const cardEl = document.getElementById('flashcard-element');
    if (cardEl) {
      cardEl.classList.toggle('is-flipped', this.isCardFlipped);
    }
  }

  isPickedCorrect(q) {
    if (!q || !q.correctArr || q.correctArr.length === 0) return false;
    return q.correctArr.every(a => this.pickedAnswers.includes(a)) && this.pickedAnswers.length === q.correctArr.length;
  }

  navigateQuestion(delta) {
    const questions = this.getSubjectQuestions();
    const progress = this.getSubjectProgress();
    const batchSize = progress.batchSize || 20;

    let activeQuestions = [];
    if (this.isReviewMode) {
      activeQuestions = questions.filter(q => this.reviewQuestionIds.includes(q.id));
    } else {
      const start = this.currentBatchIndex * batchSize;
      const end = start + batchSize;
      activeQuestions = questions.slice(start, end);
    }

    // Auto-record status if answer was checked and not yet marked explicitly
    const currentQ = activeQuestions[this.currentQuestionIndex];
    if (currentQ && this.isChecked && !progress.statuses[currentQ.id]) {
      const isCorrect = this.isPickedCorrect(currentQ);
      progress.statuses[currentQ.id] = isCorrect ? 'know' : 'still';
      this.saveSubjectProgress(progress);
    }

    const nextIdx = this.currentQuestionIndex + delta;
    if (nextIdx >= 0 && nextIdx < activeQuestions.length) {
      this.currentQuestionIndex = nextIdx;
      this.resetQuestionState();
      this.render();
    } else if (nextIdx >= activeQuestions.length) {
      this.showToast('Đã hoàn thành lượt câu này!', 'success');
      this.render();
    }
  }

  // --- QUESTION MATRIX DRAWER ---
  openMatrixDrawer() {
    const questions = this.getSubjectQuestions();
    const progress = this.getSubjectProgress();
    const batchSize = progress.batchSize || 20;

    let activeQuestions = [];
    if (this.isReviewMode) {
      activeQuestions = questions.filter(q => this.reviewQuestionIds.includes(q.id));
    } else {
      const start = this.currentBatchIndex * batchSize;
      const end = start + batchSize;
      activeQuestions = questions.slice(start, end);
    }

    const grid = document.getElementById('matrix-grid');
    if (!grid) return;

    grid.innerHTML = activeQuestions.map((q, idx) => {
      const status = progress.statuses[q.id];
      const isCurrent = idx === this.currentQuestionIndex;

      let btnClass = "bg-surface text-content-muted ring-1 ring-subtle hover:ring-strong";
      if (isCurrent) {
        btnClass = "bg-primary-solid text-primary-on-solid ring-2 ring-primary font-bold";
      } else if (status === 'know') {
        btnClass = "bg-primary-soft text-primary font-semibold ring-1 ring-primary/40";
      } else if (status === 'still') {
        btnClass = "bg-warning-soft text-warning font-semibold ring-1 ring-warning/40";
      }

      return `
        <button onclick="app.jumpToQuestion(${idx})" class="h-10 rounded-xl text-xs tabular-nums transition-transform active:scale-95 ${btnClass}">
          ${idx + 1}
        </button>
      `;
    }).join('');

    this.toggleMatrixDrawer(true);
  }

  jumpToQuestion(idx) {
    this.currentQuestionIndex = idx;
    this.resetQuestionState();
    this.toggleMatrixDrawer(false);
    this.render();
  }

  toggleMatrixDrawer(show) {
    const drawer = document.getElementById('matrix-drawer');
    if (drawer) {
      drawer.classList.toggle('hidden', !show);
    }
  }

  toggleHelpModal(show) {
    const modal = document.getElementById('help-modal');
    if (modal) {
      if (show === undefined) {
        modal.classList.toggle('hidden');
      } else {
        modal.classList.toggle('hidden', !show);
      }
    }
  }

  openDataModal(show = true) {
    const modal = document.getElementById('data-modal');
    if (modal) {
      modal.classList.toggle('hidden', !show);
    }
  }

  // ==========================================
  // VIEW 2: EXAM SIMULATION (THI THỬ 60 PHÚT)
  // ==========================================
  renderExamView() {
    if (!this.isUnlocked) {
      return `
        <div class="mx-auto max-w-xl px-4 py-12 text-center animate-in fade-in">
          <div class="rounded-2xl bg-surface-raised p-8 shadow-card ring-1 ring-subtle border border-amber-500/30">
            <div class="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-500/15 text-amber-500 mb-4 border border-amber-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h2 class="font-display text-xl font-bold text-content">Tính năng Thi Thử Đang Bị Khóa</h2>
            <p class="mt-2 text-sm text-content-muted leading-relaxed">
              Vui lòng mở khóa thiết bị tại Bảng quản trị admin để tham gia thi thử mô phỏng 60 phút và tính điểm chuẩn xác.
            </p>
            <button onclick="app.openAdminModal()" class="mt-5 inline-flex items-center gap-2 rounded-full bg-primary-solid px-6 py-2.5 text-sm font-bold text-primary-on-solid hover:brightness-110 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Bấm vào Bảng quản trị admin để mở khóa
            </button>
          </div>
        </div>
      `;
    }
    if (!this.exam.active && !this.exam.submitted) {
      return this.renderExamSetupView();
    } else if (this.exam.active) {
      return this.renderActiveExamView();
    } else {
      return this.renderExamResultView();
    }
  }

  renderExamSetupView() {
    const questions = this.getSubjectQuestions();
    const total = questions.length;

    return `
      <div class="mx-auto max-w-2xl px-4 py-8 animate-in fade-in duration-200">
        <div class="rounded-2xl bg-surface-raised p-6 sm:p-8 shadow-card ring-1 ring-subtle">
          <div class="flex items-center gap-3 border-b border-subtle pb-4">
            <div class="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <h2 class="font-display text-xl font-bold text-content">Thi thử đề thi ${this.currentSubjectId}</h2>
              <p class="text-xs text-content-muted">Mô phỏng thi thực tế với tính giờ và chấm điểm tự động</p>
            </div>
          </div>

          <div class="mt-6 space-y-5">
            <div>
              <label class="block text-sm font-semibold text-content mb-2">Số lượng câu hỏi trong đề thi:</label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                ${[30, 40, 50, 60].map(count => `
                  <button type="button" onclick="app.examQuestionCount = ${count}; app.render();" class="rounded-xl p-3 text-sm font-semibold ring-1 transition ${
                    (this.examQuestionCount || 40) === count ? 'bg-primary-soft text-primary ring-primary' : 'bg-surface text-content-muted ring-subtle hover:ring-strong'
                  }">
                    ${count} câu
                  </button>
                `).join('')}
              </div>
            </div>

            <div>
              <label class="block text-sm font-semibold text-content mb-2">Thời gian làm bài:</label>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                ${[30, 45, 60].map(mins => `
                  <button type="button" onclick="app.examMinutes = ${mins}; app.render();" class="rounded-xl p-3 text-sm font-semibold ring-1 transition ${
                    (this.examMinutes || 60) === mins ? 'bg-primary-soft text-primary ring-primary' : 'bg-surface text-content-muted ring-subtle hover:ring-strong'
                  }">
                    ${mins} phút
                  </button>
                `).join('')}
              </div>
            </div>

            <div class="rounded-xl bg-surface-sunken p-4 text-xs text-content-muted space-y-1">
              <p>• Đề thi được xáo ngẫu nhiên từ toàn bộ kho câu hỏi chuẩn của môn ${this.currentSubjectId}.</p>
              <p>• Khi hết giờ hoặc bấm Nộp bài, hệ thống sẽ tự động chấm điểm và chỉ ra các câu bạn làm sai.</p>
            </div>

            <div class="border-t border-subtle pt-5 flex justify-end">
              <button onclick="app.startExam()" class="w-full sm:w-auto rounded-full bg-primary-solid px-8 py-3 text-sm font-bold text-primary-on-solid hover:brightness-95 shadow-md shadow-primary/20">
                Bắt đầu làm bài thi
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  startExam() {
    if (!this.isUnlocked) {
      this.showToast('Vui lòng mở khóa tại Bảng quản trị admin để tham gia thi thử!', 'warning');
      this.openAdminModal(true);
      return;
    }
    const questions = [...this.getSubjectQuestions()];
    const count = Math.min(this.examQuestionCount || 40, questions.length);
    const minutes = this.examMinutes || 60;

    // Shuffle questions
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    this.exam = {
      active: true,
      questions: questions.slice(0, count),
      userAnswers: {},
      currentIndex: 0,
      totalSeconds: minutes * 60,
      secondsRemaining: minutes * 60,
      timerId: null,
      submitted: false,
      score: 0,
      correctCount: 0
    };

    // Start timer interval
    this.exam.timerId = setInterval(() => {
      this.exam.secondsRemaining--;
      const timerEl = document.getElementById('exam-countdown');
      if (timerEl) {
        timerEl.innerText = this.formatTime(this.exam.secondsRemaining);
      }
      if (this.exam.secondsRemaining <= 0) {
        clearInterval(this.exam.timerId);
        this.submitExam();
      }
    }, 1000);

    this.render();
  }

  formatTime(totalSec) {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  renderActiveExamView() {
    const q = this.exam.questions[this.exam.currentIndex];
    const totalQ = this.exam.questions.length;
    const answeredCount = Object.keys(this.exam.userAnswers).length;
    const currentAnswer = this.exam.userAnswers[q.id] || [];

    return `
      <div class="mx-auto max-w-4xl px-4 py-5 animate-in fade-in">
        
        <!-- Top Exam Header -->
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface-raised p-4 shadow-card ring-1 ring-subtle">
          <div class="flex items-center gap-2">
            <span class="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary">${this.currentSubjectId} EXAM</span>
            <span class="text-xs text-content-muted">Đã làm: <strong>${answeredCount}</strong>/${totalQ} câu</span>
          </div>

          <!-- Countdown Timer -->
          <div class="flex items-center gap-2 rounded-full bg-surface-sunken px-4 py-1.5 font-mono text-sm font-bold text-primary ring-1 ring-subtle">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span id="exam-countdown">${this.formatTime(this.exam.secondsRemaining)}</span>
          </div>

          <button onclick="app.confirmSubmitExam()" class="rounded-full bg-danger px-5 py-1.5 text-xs font-bold text-white hover:brightness-95 shadow-sm">
            Nộp bài
          </button>
        </div>

        <div class="mt-4 grid grid-cols-1 md:grid-cols-[1fr_260px] gap-4">
          
          <!-- Question Box -->
          <div class="rounded-2xl bg-surface-raised p-6 shadow-card ring-1 ring-subtle flex flex-col justify-between">
            <div>
              <div class="text-xs font-bold text-primary">CÂU HỎI ${this.exam.currentIndex + 1}/${totalQ}</div>
              <div class="mt-3 text-base font-medium leading-relaxed text-content whitespace-pre-wrap">
                ${q.questionText}
              </div>

              <!-- Options -->
              <div class="mt-5 space-y-2.5">
                ${q.answers.map(ans => {
                  const isChecked = currentAnswer.includes(ans.label);
                  return `
                    <button type="button" onclick="app.examSelectAnswer('${q.id}', '${ans.label}')" class="w-full flex items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition ${
                      isChecked ? 'border-primary bg-primary-soft/50 ring-1 ring-primary' : 'border-subtle bg-surface hover:bg-surface-sunken'
                    }">
                      <span class="grid size-6 shrink-0 place-items-center rounded-md font-bold text-xs ${
                        isChecked ? 'bg-primary-solid text-primary-on-solid' : 'bg-surface-sunken text-content-muted'
                      }">${ans.label}</span>
                      <span class="leading-relaxed text-content flex-1">${ans.content}</span>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- Nav buttons -->
            <div class="mt-6 border-t border-subtle pt-4 flex items-center justify-between">
              <button onclick="app.examNavigate(-1)" ${this.exam.currentIndex === 0 ? 'disabled' : ''} class="rounded-full px-4 py-2 text-xs font-semibold text-content-muted hover:bg-surface-sunken disabled:opacity-30">
                ← Câu trước
              </button>
              <button onclick="app.examNavigate(1)" ${this.exam.currentIndex >= totalQ - 1 ? 'disabled' : ''} class="rounded-full bg-primary-solid px-5 py-2 text-xs font-semibold text-primary-on-solid hover:brightness-95 disabled:opacity-30">
                Câu tiếp theo →
              </button>
            </div>
          </div>

          <!-- Question Palette -->
          <div class="rounded-2xl bg-surface-raised p-4 shadow-card ring-1 ring-subtle h-fit">
            <h4 class="text-xs font-bold uppercase tracking-wider text-content-subtle mb-3">Danh sách câu hỏi</h4>
            <div class="grid grid-cols-5 gap-1.5 max-h-[28rem] overflow-y-auto">
              ${this.exam.questions.map((item, idx) => {
                const isAnswered = !!this.exam.userAnswers[item.id];
                const isCurrent = idx === this.exam.currentIndex;
                return `
                  <button onclick="app.examJump(${idx})" class="h-9 rounded-lg text-xs font-semibold tabular-nums transition ${
                    isCurrent
                      ? 'bg-primary-solid text-primary-on-solid ring-2 ring-primary font-bold'
                      : isAnswered
                      ? 'bg-primary-soft text-primary ring-1 ring-primary/30'
                      : 'bg-surface text-content-muted ring-1 ring-subtle hover:bg-surface-sunken'
                  }">
                    ${idx + 1}
                  </button>
                `;
              }).join('')}
            </div>
          </div>

        </div>

      </div>
    `;
  }

  examSelectAnswer(qId, label) {
    this.exam.userAnswers[qId] = [label];
    this.render();
  }

  examNavigate(delta) {
    const next = this.exam.currentIndex + delta;
    if (next >= 0 && next < this.exam.questions.length) {
      this.exam.currentIndex = next;
      this.render();
    }
  }

  examJump(idx) {
    this.exam.currentIndex = idx;
    this.render();
  }

  confirmSubmitExam() {
    const unanswered = this.exam.questions.length - Object.keys(this.exam.userAnswers).length;
    if (unanswered > 0) {
      if (confirm(`Bạn còn ${unanswered} câu chưa làm! Bạn có chắc chắn muốn nộp bài?`)) {
        this.submitExam();
      }
    } else {
      if (confirm('Bạn đã hoàn thành tất cả câu hỏi! Nộp bài ngay để chấm điểm?')) {
        this.submitExam();
      }
    }
  }

  submitExam() {
    if (this.exam.timerId) clearInterval(this.exam.timerId);
    this.exam.active = false;
    this.exam.submitted = true;

    // Calculate score
    let correct = 0;
    this.exam.questions.forEach(q => {
      const userAns = this.exam.userAnswers[q.id] || [];
      const isCorrect = q.correctArr.length > 0 && q.correctArr.every(a => userAns.includes(a)) && userAns.length === q.correctArr.length;
      if (isCorrect) correct++;
    });

    this.exam.correctCount = correct;
    this.exam.score = Number(((correct / this.exam.questions.length) * 10).toFixed(1));
    this.render();
  }

  renderExamResultView() {
    const totalQ = this.exam.questions.length;
    const correct = this.exam.correctCount;
    const score = this.exam.score;
    const passed = score >= 5.0;

    return `
      <div class="mx-auto max-w-3xl px-4 py-8 animate-in fade-in">
        
        <!-- Score Card -->
        <div class="rounded-2xl bg-surface-raised p-6 sm:p-8 shadow-card ring-1 ring-subtle text-center">
          <div class="inline-grid size-20 place-items-center rounded-2xl ${
            passed ? 'bg-primary-soft text-primary' : 'bg-danger-soft text-danger'
          } mx-auto text-3xl font-black font-display">
            ${score}
          </div>

          <h2 class="mt-4 font-display text-2xl font-bold text-content">
            ${passed ? '🎉 Chúc mừng! Bạn đã ĐẠT' : '⚠️ Bạn CHƯA ĐẠT! Cần ôn luyện thêm'}
          </h2>
          <p class="mt-1 text-sm text-content-muted">
            Đúng <strong>${correct}/${totalQ}</strong> câu hỏi (${Math.round((correct / totalQ) * 100)}%)
          </p>

          <div class="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button onclick="app.startExam()" class="rounded-full bg-primary-solid px-6 py-2.5 text-sm font-semibold text-primary-on-solid hover:brightness-95">
              Thi lại đề khác
            </button>
            <button onclick="app.exam.submitted = false; app.setTab('batch');" class="rounded-full border border-subtle px-6 py-2.5 text-sm font-semibold text-content hover:bg-surface-sunken">
              Về chia phần ôn tập
            </button>
          </div>
        </div>

        <!-- Wrong Answers Review -->
        <div class="mt-8 space-y-4">
          <h3 class="font-display text-base font-bold text-content">Chi tiết bài thi (${totalQ} câu)</h3>
          
          <div class="space-y-3">
            ${this.exam.questions.map((q, idx) => {
              const userAns = this.exam.userAnswers[q.id] || [];
              const isCorrect = q.correctArr.length > 0 && q.correctArr.every(a => userAns.includes(a)) && userAns.length === q.correctArr.length;

              return `
                <div class="rounded-xl bg-surface-raised p-4 sm:p-5 shadow-sm ring-1 ${
                  isCorrect ? 'ring-primary/30 border-l-4 border-l-primary' : 'ring-danger/30 border-l-4 border-l-danger'
                }">
                  <div class="flex items-center justify-between text-xs font-semibold mb-2">
                    <span class="text-content-muted">Câu ${idx + 1}</span>
                    <span class="${isCorrect ? 'text-primary' : 'text-danger'} font-bold">
                      ${isCorrect ? '✓ Đúng' : `✗ Sai (Bạn chọn: ${userAns.join(', ') || 'Chưa chọn'})`}
                    </span>
                  </div>

                  <p class="text-sm font-medium text-content mb-3">${q.questionText}</p>
                  
                  <div class="rounded-lg bg-surface-sunken p-2.5 text-xs space-y-1">
                    <span class="font-bold text-primary">Đáp án đúng: ${q.correctAnswer || q.correctArr.join(', ')}</span>
                    ${q.explanation ? `<p class="text-content-muted">${q.explanation}</p>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>
    `;
  }

  // ==========================================
  // VIEW 3: INSTANT SEARCH (TRA CỨU NHANH)
  // ==========================================
  renderSearchView() {
    if (!this.isUnlocked) {
      return `
        <div class="mx-auto max-w-xl px-4 py-12 text-center animate-in fade-in">
          <div class="rounded-2xl bg-surface-raised p-8 shadow-card ring-1 ring-subtle border border-amber-500/30">
            <div class="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-500/15 text-amber-500 mb-4 border border-amber-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h2 class="font-display text-xl font-bold text-content">Tính năng Tra Cứu Đang Bị Khóa</h2>
            <p class="mt-2 text-sm text-content-muted leading-relaxed">
              Vui lòng mở khóa thiết bị tại Bảng quản trị admin để tra cứu siêu tốc trong toàn bộ kho 1.317 câu hỏi.
            </p>
            <button onclick="app.openAdminModal()" class="mt-5 inline-flex items-center gap-2 rounded-full bg-primary-solid px-6 py-2.5 text-sm font-bold text-primary-on-solid hover:brightness-110 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              Bấm vào Bảng quản trị admin để mở khóa
            </button>
          </div>
        </div>
      `;
    }
    const questions = this.getSubjectQuestions();
    let filtered = questions;

    if (this.searchQuery.trim().length > 0) {
      const qLower = this.searchQuery.toLowerCase().trim();
      filtered = questions.filter(item => {
        return (
          (item.questionText && item.questionText.toLowerCase().includes(qLower)) ||
          String(item.questionNo) === qLower ||
          item.answers.some(a => a.content && a.content.toLowerCase().includes(qLower))
        );
      });
    }

    return `
      <div class="mx-auto max-w-4xl px-4 py-6 animate-in fade-in">
        
        <!-- Search Bar Header -->
        <div class="rounded-2xl bg-surface-raised p-5 shadow-card ring-1 ring-subtle">
          <div class="flex items-center gap-3">
            <div class="relative flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-subtle"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input type="text" id="search-input" placeholder="Tìm kiếm câu hỏi theo từ khóa trong môn ${this.currentSubjectId}..." 
                value="${this.searchQuery}"
                oninput="app.searchQuery = this.value; app.render();"
                class="w-full rounded-xl bg-surface pl-10 pr-10 py-3 text-sm text-content ring-1 ring-subtle focus:outline-none focus:ring-2 focus:ring-primary font-medium" />
              ${this.searchQuery ? `
                <button onclick="app.searchQuery = ''; app.render();" class="absolute right-3 top-1/2 -translate-y-1/2 grid size-6 place-items-center rounded-full hover:bg-surface-sunken text-content-muted">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              ` : ''}
            </div>
          </div>
          <div class="mt-2.5 flex items-center justify-between text-xs text-content-subtle px-1">
            <span>Tìm thấy <strong>${filtered.length}</strong> câu hỏi phù hợp</span>
            <span>Gõ từ khóa để tra cứu đáp án lập tức</span>
          </div>
        </div>

        <!-- Search Results List -->
        <div class="mt-5 space-y-3">
          ${filtered.slice(0, 80).map((q, idx) => `
            <div class="rounded-xl bg-surface-raised p-5 shadow-sm ring-1 ring-subtle hover:ring-primary/40 transition">
              <div class="flex items-center justify-between border-b border-subtle pb-2 text-xs font-semibold">
                <span class="rounded-full bg-primary-soft px-2 py-0.5 text-primary">Câu ${q.questionNo || (idx + 1)}</span>
                <span class="font-bold text-primary flex items-center gap-1.5">
                  <span class="text-content-muted">Đáp án đúng:</span>
                  <span class="rounded-md bg-primary-solid text-primary-on-solid px-2 py-0.5 text-xs font-mono font-bold">${q.correctAnswer || q.correctArr.join(', ')}</span>
                </span>
              </div>

              <p class="mt-3 text-sm font-medium leading-relaxed text-content whitespace-pre-wrap">${this.highlightSearch(q.questionText)}</p>

              <div class="mt-4 grid gap-2">
                ${q.answers.map(ans => {
                  const isCorrect = q.correctArr.includes(ans.label);
                  return `
                    <div class="flex items-start gap-2.5 rounded-lg p-2.5 text-xs ${
                      isCorrect ? 'bg-primary-soft text-primary font-bold ring-1 ring-primary' : 'bg-surface text-content-muted'
                    }">
                      <span class="font-bold shrink-0">${ans.label}.</span>
                      <span class="leading-relaxed">${this.highlightSearch(ans.content)}</span>
                      ${isCorrect ? `<span class="ml-auto shrink-0 font-bold text-primary">✓ ĐÚNG</span>` : ''}
                    </div>
                  `;
                }).join('')}
              </div>

              ${q.explanation ? `
                <div class="mt-3 rounded-lg bg-surface-sunken p-2.5 text-xs text-content-muted">
                  <strong>Giải thích:</strong> ${q.explanation}
                </div>
              ` : ''}
            </div>
          `).join('')}

          ${filtered.length > 80 ? `
            <p class="text-center text-xs text-content-subtle py-4">Đang hiển thị 80 kết quả đầu tiên. Hãy gõ từ khóa chi tiết hơn nếu cần.</p>
          ` : ''}
        </div>

      </div>
    `;
  }

  highlightSearch(text) {
    if (!text || !this.searchQuery.trim()) return text || '';
    try {
      const q = this.searchQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${q})`, 'gi');
      return text.replace(regex, '<mark class="search-highlight">$1</mark>');
    } catch (e) {
      return text;
    }
  }

  // --- KEYBOARD HANDLER ---
  handleKeyDown(e) {
    // If active in an input, don't trigger game shortcuts
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      return;
    }

    if (e.key === '?') {
      this.toggleHelpModal();
      return;
    }

    if (e.key === 'Escape') {
      this.toggleMatrixDrawer(false);
      this.toggleHelpModal(false);
      this.openDataModal(false);
      return;
    }

    // Only handle if in active batch session
    if (this.currentBatchIndex === null && !this.isReviewMode) return;

    const questions = this.getSubjectQuestions();
    const progress = this.getSubjectProgress();
    const batchSize = progress.batchSize || 20;

    let activeQuestions = [];
    if (this.isReviewMode) {
      activeQuestions = questions.filter(q => this.reviewQuestionIds.includes(q.id));
    } else {
      const start = this.currentBatchIndex * batchSize;
      const end = start + batchSize;
      activeQuestions = questions.slice(start, end);
    }

    const currentQ = activeQuestions[this.currentQuestionIndex];
    if (!currentQ) return;

    if (this.currentBatchMode === 'learn') {
      if (['a', 'b', 'c', 'd', 'A', 'B', 'C', 'D'].includes(e.key)) {
        this.pickAnswer(e.key.toUpperCase(), currentQ.questionType === 'MULTI' || currentQ.correctArr.length > 1);
        return;
      }

      if (e.key === 'Enter') {
        if (!this.isChecked) {
          this.checkAnswer();
        } else {
          this.navigateQuestion(1);
        }
        return;
      }

      if (this.isChecked) {
        if (e.key === '1') {
          this.markStatus(currentQ.id, 'still');
          return;
        }
        if (e.key === '2') {
          this.markStatus(currentQ.id, 'know');
          return;
        }
      }

      if (e.key === 'ArrowLeft') {
        this.navigateQuestion(-1);
        return;
      }
      if (e.key === 'ArrowRight') {
        this.navigateQuestion(1);
        return;
      }
    } else if (this.currentBatchMode === 'flashcard') {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this.flipCard();
        return;
      }

      if (e.key === '1') {
        this.markStatus(currentQ.id, 'still');
        return;
      }
      if (e.key === '2') {
        this.markStatus(currentQ.id, 'know');
        return;
      }

      if (e.key === 'ArrowLeft') {
        this.navigateQuestion(-1);
        return;
      }
      if (e.key === 'ArrowRight') {
        this.navigateQuestion(1);
        return;
      }
    }
  }

  // --- DATA EXPORT / IMPORT ---
  exportProgress() {
    const backup = {
      app: 'DiemGay_Sources',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      progress: {
        ACC101: this.getSubjectProgress('ACC101'),
        MGT103: this.getSubjectProgress('MGT103'),
        ECO102: this.getSubjectProgress('ECO102')
      }
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diemgay_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast('Đã xuất file tiến độ thành công!', 'success');
  }

  importProgress(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        if (json.progress) {
          ['ACC101', 'MGT103', 'ECO102'].forEach(subId => {
            if (json.progress[subId]) {
              this.saveSubjectProgress(json.progress[subId], subId);
            }
          });
          this.showToast('Khôi phục tiến độ thành công!', 'success');
          this.openDataModal(false);
          this.renderSubjectTabs();
          this.render();
        } else {
          alert('File sao lưu không hợp lệ!');
        }
      } catch (err) {
        alert('Lỗi đọc file: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  resetCurrentSubjectProgress() {
    if (confirm(`Bạn có chắc chắn muốn xóa toàn bộ tiến độ của môn ${this.currentSubjectId}? Dữ liệu sẽ được làm lại từ đầu.`)) {
      localStorage.removeItem(`diemgay_progress_${this.currentSubjectId}`);
      this.openDataModal(false);
      this.showToast(`Đã reset tiến độ môn ${this.currentSubjectId}!`, 'info');
      this.renderSubjectTabs();
      this.render();
    }
  }


  // --- SECURITY & ACTIVATION SYSTEM ---
  checkUnlockStatus() {
    const stored = localStorage.getItem('diemgay_license');
    if (!stored) return false;
    try {
      const lic = JSON.parse(stored);
      const myDevId = getDeviceId();

      if (lic.key === ADMIN_MASTER_KEY) return true;

      if (lic.key && lic.key.startsWith('DG-KEY-')) {
        const expected = generateKeyForDevice(myDevId);
        return lic.key === expected && lic.deviceId === myDevId;
      }

      if (lic.key && VIP_KEYS.includes(lic.key)) {
        return lic.deviceId === myDevId;
      }

      return false;
    } catch (e) {
      return false;
    }
  }

  getLicenseInfo() {
    try {
      const stored = localStorage.getItem('diemgay_license');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  updateHeaderLockState() {
    const subjectTabs = document.getElementById('subject-tabs');
    const headerLockBar = document.getElementById('header-lock-bar');
    const navBtnGroup = document.getElementById('nav-btn-group');
    const mobileNavBar = document.getElementById('mobile-nav-bar');
    const licenseBadge = document.getElementById('license-header-badge');

    if (this.isUnlocked) {
      if (subjectTabs) subjectTabs.classList.remove('hidden');
      if (headerLockBar) headerLockBar.classList.add('hidden');
      if (navBtnGroup) navBtnGroup.classList.remove('hidden');
      if (mobileNavBar) mobileNavBar.classList.remove('hidden');

      if (licenseBadge) {
        licenseBadge.innerHTML = `
          <button onclick="app.showLicenseDetails()" title="Thiết bị đã kích hoạt hợp lệ. Nhấp để xem hoặc khóa lại" class="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary/30 hover:bg-primary hover:text-white transition shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            <span class="hidden sm:inline">Đã kích hoạt</span>
          </button>
        `;
      }
    } else {
      if (subjectTabs) subjectTabs.classList.add('hidden');
      if (headerLockBar) headerLockBar.classList.remove('hidden');
      if (navBtnGroup) navBtnGroup.classList.add('hidden');
      if (mobileNavBar) mobileNavBar.classList.add('hidden');

      if (licenseBadge) {
        licenseBadge.innerHTML = `
          <button onclick="app.openAdminModal()" title="Thiết bị đang bị khóa. Nhấp để mở Admin duyệt mã" class="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-3 py-1 text-xs font-bold text-danger ring-1 ring-danger/30 hover:bg-danger hover:text-white transition shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span class="hidden sm:inline">Chưa mở khóa</span>
          </button>
        `;
      }
    }
  }

  renderLockScreen() {
    return `
      <div class="mx-auto max-w-xl px-4 py-8 sm:py-12 animate-in fade-in duration-300">
        <div class="rounded-3xl bg-surface-raised p-6 sm:p-9 shadow-2xl ring-1 ring-subtle border border-subtle text-center">
          
          <!-- Glowing Shield Lock Icon -->
          <div class="relative mx-auto size-20">
            <div class="absolute inset-0 rounded-2xl bg-primary-solid/20 blur-xl animate-pulse-soft"></div>
            <div class="relative grid size-20 place-items-center rounded-2xl bg-primary-soft border border-primary/30 text-primary shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
          </div>

          <!-- Titles -->
          <h1 class="mt-6 font-display text-2xl sm:text-3xl font-extrabold text-content tracking-tight">
            Hệ Thống Ôn Thi Diễm Gay
          </h1>
          <p class="mt-1.5 text-xs sm:text-sm text-content-muted leading-relaxed">
            Hệ thống bảo vệ nội bộ · Mỗi thành viên được cấp mã riêng gắn chặt với 1 thiết bị
          </p>

          <!-- Device ID Box -->
          <div class="mt-6 rounded-2xl bg-surface-sunken p-4 text-left border border-subtle">
            <div class="flex items-center justify-between text-xs text-content-muted mb-1.5 font-medium">
              <span>Mã thiết bị của bạn (Device ID):</span>
              <span class="rounded-full bg-danger-soft text-danger px-2 py-0.5 text-[11px] font-bold">Chưa kích hoạt</span>
            </div>
            <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
              <code class="font-mono text-sm sm:text-base font-extrabold text-primary tracking-wider" id="lock-screen-device-id">${this.deviceId}</code>
              <button onclick="app.copyDeviceId()" class="inline-flex items-center gap-1.5 rounded-full bg-surface-raised px-3.5 py-1.5 text-xs font-bold text-content border border-strong hover:bg-surface-sunken shadow-sm transition active:scale-95">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                Sao chép gửi Admin
              </button>
            </div>
            <p class="mt-2 text-[11px] text-content-subtle leading-normal">
              👉 Hãy sao chép mã trên và gửi cho <strong>Admin Vũ Thế Đan</strong> để được cấp mã mở khóa dành riêng cho máy của bạn.
            </p>
          </div>

          <!-- Activation Code Input Form -->
          <div class="mt-6 text-left space-y-3">
            <label class="block text-xs font-bold text-content">
              Nhập mã mở khóa (Activation Key):
            </label>
            <div class="flex flex-col sm:flex-row gap-2">
              <input type="text" id="main-unlock-input" placeholder="Ví dụ: DG-KEY-... hoặc DG-VIP-..." 
                onkeydown="if(event.key==='Enter') app.submitActivationCode('main')"
                class="flex-1 rounded-xl bg-surface px-4 py-3 text-sm font-mono font-bold text-content uppercase ring-1 ring-subtle focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" />
              <button onclick="app.submitActivationCode('main')" class="rounded-xl bg-primary-solid px-6 py-3 text-sm font-bold text-white hover:brightness-110 shadow-md shadow-primary/25 transition active:scale-95">
                Mở khóa thiết bị
              </button>
            </div>
            <div id="lock-error-msg" class="hidden rounded-xl bg-danger-soft p-3 text-xs font-semibold text-danger border border-danger/30 leading-relaxed"></div>
          </div>

          <!-- Bottom Notice -->
          <div class="mt-8 border-t border-subtle pt-4 flex flex-wrap items-center justify-between text-xs text-content-subtle">
            <span>🔒 Bảo mật chống rò rỉ đề thi</span>
            <button onclick="app.openAdminModal()" class="font-semibold text-primary hover:underline">
              Quản trị viên (Admin)
            </button>
          </div>

        </div>
      </div>
    `;
  }

  submitActivationCode(source = 'modal') {
    let inputEl = null;
    let errorEl = null;
    if (source === 'modal') {
      inputEl = document.getElementById('modal-unlock-input');
      errorEl = document.getElementById('modal-unlock-msg');
    } else if (source === 'header') {
      inputEl = document.getElementById('header-unlock-input');
      errorEl = document.getElementById('lock-error-msg');
    } else {
      inputEl = document.getElementById('main-unlock-input');
      errorEl = document.getElementById('lock-error-msg');
    }

    if (!inputEl) return;
    const code = (inputEl.value || '').trim().toUpperCase();

    if (!code) {
      if (errorEl) {
        errorEl.className = 'mt-2 rounded-lg p-2.5 text-xs font-semibold bg-danger-soft text-danger border border-danger/30';
        errorEl.innerText = 'Vui lòng nhập mã mở khóa!';
        errorEl.classList.remove('hidden');
      }
      this.showToast('Vui lòng nhập mã mở khóa!', 'warning');
      return;
    }

    const myDevId = this.deviceId;

    const onSuccess = (role, toastMsg) => {
      this.isUnlocked = true;
      if (errorEl) {
        errorEl.className = 'mt-2 rounded-lg p-2.5 text-xs font-semibold bg-primary-soft text-primary border border-primary/30';
        errorEl.innerText = '✓ Kích hoạt thành công!';
        errorEl.classList.remove('hidden');
      }
      this.showToast(toastMsg, 'success');
      this.renderSubjectTabs();
      this.render();
      setTimeout(() => {
        this.openAdminModal(false);
      }, 1000);
    };

    // 1. Check Master Admin Key
    if (code === ADMIN_MASTER_KEY) {
      localStorage.setItem('diemgay_license', JSON.stringify({
        key: code,
        deviceId: myDevId,
        role: 'ADMIN',
        activatedAt: new Date().toISOString()
      }));
      onSuccess('ADMIN', '🎉 Đã mở khóa với quyền Quản Trị Viên (Admin)!');
      return;
    }

    // 2. Check VIP Keys
    if (VIP_KEYS.includes(code)) {
      localStorage.setItem('diemgay_license', JSON.stringify({
        key: code,
        deviceId: myDevId,
        role: 'VIP',
        activatedAt: new Date().toISOString()
      }));
      onSuccess('VIP', '🎉 Kích hoạt mã VIP thành công cho thiết bị này!');
      return;
    }

    // 3. Check Device-Bound Key
    const expectedKey = generateKeyForDevice(myDevId);
    if (code === expectedKey) {
      localStorage.setItem('diemgay_license', JSON.stringify({
        key: code,
        deviceId: myDevId,
        role: 'STUDENT',
        activatedAt: new Date().toISOString()
      }));
      onSuccess('STUDENT', '🎉 Kích hoạt thiết bị thành công! Chúc bạn ôn thi tốt!');
      return;
    }

    // If invalid
    const errMsg = '❌ Mã mở khóa không hợp lệ hoặc không thuộc về thiết bị này! Vui lòng sao chép mã thiết bị gửi Admin duyệt.';
    if (errorEl) {
      errorEl.className = 'mt-2 rounded-lg p-2.5 text-xs font-semibold bg-danger-soft text-danger border border-danger/30';
      errorEl.innerText = errMsg;
      errorEl.classList.remove('hidden');
    }
    this.showToast(errMsg, 'error');
  }

  copyDeviceId() {
    navigator.clipboard.writeText(this.deviceId).then(() => {
      this.showToast('Đã sao chép mã thiết bị: ' + this.deviceId, 'success');
    }).catch(() => {
      const el = document.getElementById('modal-student-dev-id') || document.getElementById('lock-screen-device-id');
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        this.showToast('Hãy nhấn Ctrl + C để sao chép mã!', 'info');
      }
    });
  }

  openAdminModal(show = true) {
    const modal = document.getElementById('admin-modal');
    if (!modal) return;

    if (show) {
      // 1. Populate Device ID for student
      const devEl = document.getElementById('modal-student-dev-id');
      if (devEl) devEl.innerText = this.deviceId;

      // 2. Clear previous error/input
      const inputEl = document.getElementById('modal-unlock-input');
      if (inputEl) inputEl.value = '';
      const msgEl = document.getElementById('modal-unlock-msg');
      if (msgEl) msgEl.classList.add('hidden');

      // 3. Update status badge in modal
      const statusBadge = document.getElementById('modal-license-status-badge');
      if (statusBadge) {
        if (this.isUnlocked) {
          const lic = this.getLicenseInfo();
          const roleLabel = lic ? (lic.role === 'ADMIN' ? 'Admin Master' : lic.role === 'VIP' ? 'Mã VIP' : 'Đã kích hoạt') : 'Đã mở khóa';
          statusBadge.innerHTML = `<span class="rounded-full bg-primary-soft text-primary border border-primary/30 px-2.5 py-0.5 text-xs font-bold">✓ ${roleLabel}</span>`;
        } else {
          statusBadge.innerHTML = `<span class="rounded-full bg-danger-soft text-danger border border-danger/30 px-2.5 py-0.5 text-xs font-bold">🔒 Chưa mở khóa</span>`;
        }
      }

      // 4. Render 10 VIP keys
      this.renderAdminVipKeys();

      modal.classList.remove('hidden');
    } else {
      modal.classList.add('hidden');
    }
  }

  renderAdminVipKeys() {
    const container = document.getElementById('admin-vip-keys-list');
    if (!container) return;

    container.innerHTML = VIP_KEYS.map((k, idx) => `
      <div class="flex items-center justify-between gap-2 rounded-lg bg-surface p-2 border border-subtle text-xs">
        <div class="flex items-center gap-1.5">
          <span class="rounded bg-surface-sunken px-1.5 py-0.5 font-bold text-[10px] text-content-muted">#${idx + 1}</span>
          <code class="font-mono font-bold text-content select-all">${k}</code>
        </div>
        <button onclick="app.copyVipKey('${k}')" class="rounded px-2.5 py-1 bg-surface-raised border border-subtle hover:bg-primary hover:text-white font-semibold text-[11px] transition">
          Copy
        </button>
      </div>
    `).join('');
  }

  adminGenerateKey() {
    const input = document.getElementById('admin-input-dev-id');
    const outBox = document.getElementById('admin-gen-result');
    const outCode = document.getElementById('admin-out-code');

    if (!input || !outBox || !outCode) return;
    const devId = (input.value || '').trim().toUpperCase();

    if (!devId.startsWith('DG-DEV-') || devId.length < 10) {
      alert('Vui lòng nhập đúng định dạng Mã Thiết Bị (Ví dụ: DG-DEV-A1B2-3456)');
      return;
    }

    const key = generateKeyForDevice(devId);
    outCode.innerText = key;
    outBox.classList.remove('hidden');
    this.generatedKeyForStudent = key;
    this.showToast('Đã tạo mã thành công cho ' + devId, 'success');
  }

  copyGeneratedKey() {
    if (this.generatedKeyForStudent) {
      navigator.clipboard.writeText(this.generatedKeyForStudent).then(() => {
        this.showToast('Đã sao chép mã mở khóa: ' + this.generatedKeyForStudent, 'success');
      });
    }
  }

  copyVipKey(key) {
    navigator.clipboard.writeText(key).then(() => {
      this.showToast('Đã sao chép mã VIP: ' + key, 'success');
    });
  }

  copyAllVipKeys() {
    const text = VIP_KEYS.map((k, i) => `Mã #${i + 1}: ${k}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Đã sao chép toàn bộ 10 mã VIP!', 'success');
    });
  }

  showLicenseDetails() {
    const lic = this.getLicenseInfo();
    if (!lic) return;
    if (confirm(`Thông tin thiết bị của bạn:\n• Mã thiết bị: ${this.deviceId}\n• Khóa kích hoạt: ${lic.key}\n• Loại quyền: ${lic.role || 'THÀNH VIÊN'}\n\nBạn có muốn KHÓA LẠI thiết bị này không?`)) {
      this.lockDevice();
    }
  }

  lockDevice() {
    localStorage.removeItem('diemgay_license');
    this.isUnlocked = false;
    this.openAdminModal(false);
    this.showToast('Đã khóa lại thiết bị! Tiến trình học tập vẫn được lưu an toàn 100%.', 'info');
    this.render();
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const colorClass = type === 'success' ? 'bg-primary-solid text-primary-on-solid' : 'bg-surface-raised text-content ring-1 ring-subtle';
    toast.className = `flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-lg transition-all transform duration-200 pointer-events-auto ${colorClass} animate-in slide-in-from-bottom`;
    toast.innerText = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'scale-95');
      setTimeout(() => toast.remove(), 200);
    }, 2500);
  }
}

// Start Application on Load
window.addEventListener('DOMContentLoaded', () => {
  window.app = new DiemGayApp();
});

