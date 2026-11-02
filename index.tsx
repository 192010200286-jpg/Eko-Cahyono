import {
  auth,
  loginWithGoogle,
  logoutUser,
  saveUserProfile,
  loadUserProfile,
  saveQuestionSet,
  getUserSavedQuestions,
  deleteSavedQuestion,
  type SavedQuestionSet,
  type UserProfileData
} from './src/firebase';
import { triggerGoogleDocsExport } from './src/googleDocs';
import { onAuthStateChanged, type User } from 'firebase/auth';

declare global {
  interface Window {
    firebaseAuth: {
      login: () => Promise<void>;
      logout: () => Promise<void>;
      saveCurrentQuestionsToCloud: () => Promise<void>;
      openCloudBankModal: () => Promise<void>;
      closeCloudBankModal: () => void;
      loadSavedQuestionSet: (id: string) => Promise<void>;
      deleteSavedQuestionSet: (id: string) => Promise<void>;
      syncTeacherSettingsToCloud: () => Promise<void>;
      exportToGoogleDocs: () => Promise<void>;
      exportSavedSetToGoogleDocs: (id: string) => Promise<void>;
      currentUser: User | null;
    };
    exportToGoogleDocs?: () => Promise<void>;
    generatedData?: { soal: any[] };
    getGeneratedData?: () => { soal: any[] } | null;
    setGeneratedData?: (d: { soal: any[] } | null) => void;
    currentFormData?: any;
    getCurrentFormData?: () => any;
    setCurrentFormData?: (d: any) => void;
    currentCurriculum?: string;
    getCurrentCurriculum?: () => string;
    setCurrentCurriculum?: (c: string) => void;
    curriculumData?: any;
    selectCurriculum?: (c: string) => void;
    updateKelas?: () => void;
    renderResults?: (formData: any) => void;
    showSuccess?: (msg: string) => void;
    showError?: (msg: string) => void;
    outputSettings?: any;
    getOutputSettings?: () => any;
    setOutputSettings?: (s: any) => void;
  }
}

let currentUser: User | null = null;
let savedQuestionsCache: SavedQuestionSet[] = [];

function setupFirebaseIntegration() {
  injectHeaderAuthWidget();
  injectCloudBankModal();
  injectCloudActionButtons();

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (window.firebaseAuth) {
      window.firebaseAuth.currentUser = user;
    }
    updateAuthUI(user);

    if (user) {
      try {
        const profile = await loadUserProfile(user.uid);
        if (profile) {
          applyProfileToUI(profile);
        }
      } catch (err) {
        console.warn('Could not load user profile from Firestore:', err);
      }
    }
  });
}

function injectHeaderAuthWidget() {
  const headerContainer = document.querySelector('header');
  if (!headerContainer) {
    setTimeout(injectHeaderAuthWidget, 100);
    return;
  }

  if (document.getElementById('firebase-auth-container')) return;

  const authWrapper = document.createElement('div');
  authWrapper.id = 'firebase-auth-container';
  authWrapper.className = 'mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3';
  authWrapper.innerHTML = `
    <div class="flex items-center gap-2">
      <div class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold rounded-lg">
        <i class="fa-solid fa-cloud text-amber-600"></i>
        <span>Firebase Cloud Sync</span>
      </div>
      <span class="text-xs text-gray-500 hidden sm:inline">Simpan bank soal dan identitas guru online secara otomatis</span>
    </div>

    <div>
      <div id="auth-logged-out" class="flex items-center gap-2">
        <button type="button" onclick="window.firebaseAuth.login()"
          class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 text-xs font-semibold rounded-xl border border-gray-200 hover:border-indigo-300 shadow-sm transition">
          <svg class="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Masuk dengan Google</span>
        </button>
      </div>

      <div id="auth-logged-in" class="hidden items-center gap-2">
        <div class="flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">
          <div class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold overflow-hidden" id="user-avatar-wrap">
            <span id="user-avatar-initial">G</span>
          </div>
          <div class="text-left">
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span id="user-display-name" class="font-bold text-gray-800 text-xs max-w-[130px] truncate">Guru</span>
            </div>
          </div>
        </div>

        <button type="button" onclick="window.firebaseAuth.openCloudBankModal()"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition">
          <i class="fa-solid fa-cloud text-xs"></i>
          <span>Bank Soal Cloud</span>
        </button>

        <button type="button" onclick="window.firebaseAuth.logout()"
          class="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-red-600 text-xs rounded-xl transition"
          title="Keluar dari akun">
          <i class="fa-solid fa-right-from-bracket"></i>
        </button>
      </div>
    </div>
  `;

  headerContainer.appendChild(authWrapper);
}

function injectCloudActionButtons() {
  const actionBtns = document.getElementById('action-btns');
  if (!actionBtns) {
    setTimeout(injectCloudActionButtons, 150);
    return;
  }

  if (document.getElementById('cloud-save-btn')) return;

  const saveBtn = document.createElement('button');
  saveBtn.id = 'cloud-save-btn';
  saveBtn.type = 'button';
  saveBtn.className = 'px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm transition flex items-center gap-1.5';
  saveBtn.title = 'Simpan Soal Ini ke Database Cloud Firebase';
  saveBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Simpan ke Cloud';
  saveBtn.onclick = () => window.firebaseAuth.saveCurrentQuestionsToCloud();

  const bankBtn = document.createElement('button');
  bankBtn.id = 'cloud-bank-btn';
  bankBtn.type = 'button';
  bankBtn.className = 'px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition flex items-center gap-1.5';
  bankBtn.title = 'Buka Bank Soal Tersimpan di Cloud';
  bankBtn.innerHTML = '<i class="fa-solid fa-cloud"></i> Bank Soal';
  bankBtn.onclick = () => window.firebaseAuth.openCloudBankModal();

  const gdocsBtn = document.createElement('button');
  gdocsBtn.id = 'cloud-gdocs-btn';
  gdocsBtn.type = 'button';
  gdocsBtn.className = 'px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition flex items-center gap-1.5';
  gdocsBtn.title = 'Ekspor Naskah Soal & Format Lengkap ke Google Docs';
  gdocsBtn.innerHTML = `
    <svg class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
    </svg>
    <span>Ekspor ke Docs</span>
  `;
  gdocsBtn.onclick = () => window.firebaseAuth.exportToGoogleDocs();

  actionBtns.prepend(gdocsBtn);
  actionBtns.prepend(bankBtn);
  actionBtns.prepend(saveBtn);
}

function injectCloudBankModal() {
  if (document.getElementById('cloud-bank-modal')) return;

  const modal = document.createElement('div');
  modal.id = 'cloud-bank-modal';
  modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 hidden items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
      <!-- Modal Header -->
      <div class="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md">
            <i class="fa-solid fa-cloud text-lg"></i>
          </div>
          <div>
            <h3 class="font-bold text-gray-800 text-lg">Bank Soal Cloud Firebase</h3>
            <p class="text-xs text-gray-500">Koleksi soal tersimpan aman di database Firestore Anda</p>
          </div>
        </div>
        <button type="button" onclick="window.firebaseAuth.closeCloudBankModal()"
          class="w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 transition shadow-sm">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-5 overflow-y-auto flex-1">
        <div id="cloud-bank-loading" class="text-center py-12">
          <i class="fa-solid fa-spinner fa-spin text-3xl text-indigo-600 mb-3"></i>
          <p class="text-sm text-gray-500 font-medium">Memuat bank soal dari cloud Firestore...</p>
        </div>

        <div id="cloud-bank-empty" class="hidden text-center py-12">
          <div class="w-16 h-16 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <i class="fa-solid fa-cloud-arrow-up text-2xl"></i>
          </div>
          <h4 class="font-bold text-gray-700 text-base mb-1">Belum Ada Soal Tersimpan di Cloud</h4>
          <p class="text-xs text-gray-500 max-w-sm mx-auto mb-4">
            Buat soal menggunakan AI lalu tekan tombol <strong>"Simpan ke Cloud"</strong> untuk menyimpan bank soal Anda di sini.
          </p>
        </div>

        <div id="cloud-bank-list" class="hidden space-y-3">
          <!-- Dynamically populated -->
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
        <span id="cloud-bank-count">0 paket soal tersimpan</span>
        <button type="button" onclick="window.firebaseAuth.closeCloudBankModal()"
          class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition">
          Tutup
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
}

function updateAuthUI(user: User | null) {
  const loggedOutEl = document.getElementById('auth-logged-out');
  const loggedInEl = document.getElementById('auth-logged-in');
  const nameEl = document.getElementById('user-display-name');
  const initialEl = document.getElementById('user-avatar-initial');
  const avatarWrap = document.getElementById('user-avatar-wrap');

  if (user) {
    if (loggedOutEl) loggedOutEl.classList.add('hidden');
    if (loggedInEl) {
      loggedInEl.classList.remove('hidden');
      loggedInEl.classList.add('flex');
    }
    if (nameEl) {
      nameEl.textContent = user.displayName || user.email?.split('@')[0] || 'Guru';
      nameEl.title = `${user.displayName || ''} (${user.email || ''})`;
    }
    if (user.photoURL && avatarWrap) {
      avatarWrap.innerHTML = `<img src="${user.photoURL}" class="w-full h-full object-cover" alt="avatar" />`;
    } else if (initialEl) {
      const char = (user.displayName || user.email || 'G').charAt(0).toUpperCase();
      initialEl.textContent = char;
    }
  } else {
    if (loggedOutEl) loggedOutEl.classList.remove('hidden');
    if (loggedInEl) {
      loggedInEl.classList.add('hidden');
      loggedInEl.classList.remove('flex');
    }
  }
}

function applyProfileToUI(profile: UserProfileData) {
  if (profile.namaGuru) {
    const el = document.getElementById('nama-guru') as HTMLInputElement | null;
    if (el && !el.value) el.value = profile.namaGuru;
  }
  if (profile.namaSekolah) {
    const el = document.getElementById('nama-sekolah') as HTMLInputElement | null;
    if (el && !el.value) el.value = profile.namaSekolah;
  }
  const currentOutputSettings = window.getOutputSettings ? window.getOutputSettings() : window.outputSettings;
  if (currentOutputSettings) {
    if (profile.instansi) currentOutputSettings.instansi = profile.instansi;
    if (profile.namaSekolah) currentOutputSettings.sekolah = profile.namaSekolah;
    if (profile.alamat) currentOutputSettings.alamat = profile.alamat;
    if (profile.telp) currentOutputSettings.telp = profile.telp;
    if (profile.tahun) currentOutputSettings.tahun = profile.tahun;
    if (profile.semester) currentOutputSettings.semester = profile.semester;
    if (profile.watermarkText) currentOutputSettings.watermarkText = profile.watermarkText;
    if (profile.watermarkEnabled !== undefined) currentOutputSettings.watermarkEnabled = profile.watermarkEnabled;
    if (window.setOutputSettings) window.setOutputSettings(currentOutputSettings);
  }
}

window.firebaseAuth = {
  currentUser: null,

  login: async () => {
    try {
      const user = await loginWithGoogle();
      if (window.showSuccess) {
        window.showSuccess(`Selamat datang, ${user.displayName || user.email}! Akun terhubung ke Firebase Cloud.`);
      }
    } catch (err: any) {
      console.error('Firebase Login Error:', err);
      if (window.showError) {
        window.showError(`Gagal masuk: ${err.message || err}`);
      }
    }
  },

  logout: async () => {
    try {
      await logoutUser();
      if (window.showSuccess) {
        window.showSuccess('Berhasil keluar dari akun.');
      }
    } catch (err: any) {
      console.error('Firebase Logout Error:', err);
    }
  },

  saveCurrentQuestionsToCloud: async () => {
    if (!currentUser) {
      if (window.showError) {
        window.showError('Silakan masuk dengan akun Google terlebih dahulu untuk menyimpan ke Cloud!');
      }
      try {
        await window.firebaseAuth.login();
      } catch {
        return;
      }
      if (!auth.currentUser) return;
    }

    const currentData = window.getGeneratedData ? window.getGeneratedData() : window.generatedData;
    if (!currentData || !currentData.soal || currentData.soal.length === 0) {
      if (window.showError) window.showError('Belum ada soal yang dibuat untuk disimpan!');
      return;
    }

    const mapel = (document.getElementById('mapel') as HTMLSelectElement)?.value || 'Mata Pelajaran';
    const topik = (document.getElementById('topik') as HTMLInputElement)?.value || 'Topik Soal';
    const jenjang = (document.getElementById('jenjang') as HTMLSelectElement)?.value || 'SD';
    const kelas = (document.getElementById('kelas') as HTMLSelectElement)?.value || '1';
    const curriculum = window.getCurrentCurriculum ? window.getCurrentCurriculum() : (window.currentCurriculum || 'merdeka');

    try {
      const saveBtn = document.getElementById('cloud-save-btn');
      if (saveBtn) {
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';
      }

      await saveQuestionSet({
        title: `${mapel} Kelas ${kelas} - ${topik}`,
        mapel,
        topik,
        jenjang,
        kelas,
        curriculum,
        soalCount: currentData.soal.length,
        soalData: currentData.soal,
        formData: (window.getCurrentFormData ? window.getCurrentFormData() : window.currentFormData) || { mapel, topik, jenjang, kelas }
      });

      if (saveBtn) {
        saveBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Simpan ke Cloud';
      }

      if (window.showSuccess) {
        window.showSuccess(`Berhasil menyimpan ${currentData.soal.length} soal ke Bank Soal Cloud Firebase!`);
      }
    } catch (err: any) {
      console.error('Cloud Save Error:', err);
      const saveBtn = document.getElementById('cloud-save-btn');
      if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Simpan ke Cloud';
      if (window.showError) {
        window.showError(`Gagal menyimpan ke cloud: ${err.message || err}`);
      }
    }
  },

  openCloudBankModal: async () => {
    if (!currentUser) {
      if (window.showError) {
        window.showError('Silakan masuk dengan akun Google terlebih dahulu untuk melihat Bank Soal Cloud.');
      }
      try {
        await window.firebaseAuth.login();
      } catch {
        return;
      }
      if (!auth.currentUser) return;
    }

    const modal = document.getElementById('cloud-bank-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    const loadingEl = document.getElementById('cloud-bank-loading');
    const emptyEl = document.getElementById('cloud-bank-empty');
    const listEl = document.getElementById('cloud-bank-list');
    const countEl = document.getElementById('cloud-bank-count');

    if (loadingEl) loadingEl.classList.remove('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
    if (listEl) {
      listEl.classList.add('hidden');
      listEl.innerHTML = '';
    }

    try {
      savedQuestionsCache = await getUserSavedQuestions();
      if (loadingEl) loadingEl.classList.add('hidden');

      if (countEl) countEl.textContent = `${savedQuestionsCache.length} paket soal tersimpan`;

      if (savedQuestionsCache.length === 0) {
        if (emptyEl) emptyEl.classList.remove('hidden');
      } else {
        if (listEl) {
          listEl.classList.remove('hidden');
          listEl.innerHTML = savedQuestionsCache.map((item) => {
            const formattedDate = new Date(item.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return `
              <div class="p-4 border border-gray-200 hover:border-indigo-300 rounded-xl bg-white shadow-sm hover:shadow transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex-1">
                  <div class="flex flex-wrap items-center gap-2 mb-1">
                    <span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-md">${item.jenjang} Kelas ${item.kelas}</span>
                    <span class="px-2 py-0.5 bg-purple-50 text-purple-700 text-[11px] font-bold rounded-md uppercase">${item.curriculum || 'Merdeka'}</span>
                    <span class="text-xs text-gray-400"><i class="fa-regular fa-clock mr-1"></i>${formattedDate}</span>
                  </div>
                  <h4 class="font-bold text-gray-800 text-sm">${item.title}</h4>
                  <p class="text-xs text-gray-500 mt-0.5">Mata Pelajaran: <span class="font-medium text-gray-700">${item.mapel}</span> &bull; Topik: <span class="font-medium text-gray-700">${item.topik}</span> &bull; <strong class="text-indigo-600">${item.soalCount} Soal</strong></p>
                </div>
                <div class="flex items-center gap-2 self-end sm:self-center">
                  <button type="button" onclick="window.firebaseAuth.exportSavedSetToGoogleDocs('${item.id}')"
                    class="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition flex items-center gap-1"
                    title="Ekspor paket ini langsung ke Google Docs">
                    <svg class="w-3.5 h-3.5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                    </svg>
                    <span>Docs</span>
                  </button>
                  <button type="button" onclick="window.firebaseAuth.loadSavedQuestionSet('${item.id}')"
                    class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1">
                    <i class="fa-solid fa-folder-open"></i> Buka Soal
                  </button>
                  <button type="button" onclick="window.firebaseAuth.deleteSavedQuestionSet('${item.id}')"
                    class="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition"
                    title="Hapus dari Cloud">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
            `;
          }).join('');
        }
      }
    } catch (err: any) {
      console.error('Failed to load saved questions:', err);
      if (loadingEl) loadingEl.classList.add('hidden');
      if (window.showError) {
        window.showError(`Gagal memuat bank soal: ${err.message || err}`);
      }
    }
  },

  closeCloudBankModal: () => {
    const modal = document.getElementById('cloud-bank-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  loadSavedQuestionSet: async (id: string) => {
    const item = savedQuestionsCache.find(q => q.id === id);
    if (!item) return;

    try {
      const parsed = JSON.parse(item.soalJson);
      if (!parsed.soal || !Array.isArray(parsed.soal)) {
        throw new Error('Format data soal cloud tidak valid.');
      }

      const generatedObj = { soal: parsed.soal };
      if (window.setGeneratedData) {
        window.setGeneratedData(generatedObj);
      }
      window.generatedData = generatedObj;

      const formDataObj = parsed.formData || {
        mapel: item.mapel,
        jenjang: item.jenjang,
        kelas: item.kelas,
        topik: item.topik
      };
      if (window.setCurrentFormData) {
        window.setCurrentFormData(formDataObj);
      }
      window.currentFormData = formDataObj;

      if (item.curriculum) {
        if (window.setCurrentCurriculum) window.setCurrentCurriculum(item.curriculum);
        if (window.selectCurriculum) window.selectCurriculum(item.curriculum);
      }

      const mapelEl = document.getElementById('mapel') as HTMLSelectElement | null;
      if (mapelEl) mapelEl.value = item.mapel;
      const topikEl = document.getElementById('topik') as HTMLInputElement | null;
      if (topikEl) topikEl.value = item.topik;
      const jenjangEl = document.getElementById('jenjang') as HTMLSelectElement | null;
      if (jenjangEl) {
        jenjangEl.value = item.jenjang;
        if (window.updateKelas) window.updateKelas();
      }
      const kelasEl = document.getElementById('kelas') as HTMLSelectElement | null;
      if (kelasEl) kelasEl.value = item.kelas;

      if (window.renderResults) {
        window.renderResults(formDataObj);
      }

      window.firebaseAuth.closeCloudBankModal();

      if (window.showSuccess) {
        window.showSuccess(`Berhasil memuat "${item.title}" (${parsed.soal.length} soal) dari Cloud!`);
      }
    } catch (err: any) {
      console.error('Failed to parse question set:', err);
      if (window.showError) {
        window.showError(`Gagal membuka soal: ${err.message || err}`);
      }
    }
  },

  deleteSavedQuestionSet: async (id: string) => {
    const item = savedQuestionsCache.find(q => q.id === id);
    const title = item ? item.title : 'soal ini';
    if (!confirm(`Apakah Anda yakin ingin menghapus "${title}" dari Bank Soal Cloud?`)) {
      return;
    }

    try {
      await deleteSavedQuestion(id);
      savedQuestionsCache = savedQuestionsCache.filter(q => q.id !== id);
      if (window.showSuccess) {
        window.showSuccess('Berhasil menghapus soal dari cloud.');
      }
      window.firebaseAuth.openCloudBankModal();
    } catch (err: any) {
      console.error('Failed to delete question set:', err);
      if (window.showError) {
        window.showError(`Gagal menghapus soal: ${err.message || err}`);
      }
    }
  },

  syncTeacherSettingsToCloud: async () => {
    if (!currentUser) return;
    try {
      const namaGuru = (document.getElementById('nama-guru') as HTMLInputElement)?.value;
      const namaSekolah = (document.getElementById('nama-sekolah') as HTMLInputElement)?.value;
      const instansi = (document.getElementById('setting-instansi') as HTMLInputElement)?.value;
      const alamat = (document.getElementById('setting-alamat') as HTMLInputElement)?.value;
      const telp = (document.getElementById('setting-telp') as HTMLInputElement)?.value;
      const tahun = (document.getElementById('setting-tahun') as HTMLInputElement)?.value;
      const semester = (document.getElementById('setting-semester') as HTMLInputElement)?.value;
      const watermarkText = (document.getElementById('setting-watermark-text') as HTMLInputElement)?.value;
      const watermarkEnabled = (document.getElementById('setting-watermark-enabled') as HTMLInputElement)?.checked;

      await saveUserProfile({
        namaGuru,
        namaSekolah,
        instansi,
        alamat,
        telp,
        tahun,
        semester,
        watermarkText,
        watermarkEnabled
      });
      if (window.showSuccess) {
        window.showSuccess('Pengaturan dan profil tersinkron ke cloud!');
      }
    } catch (err: any) {
      console.warn('Failed to sync profile settings to cloud:', err);
    }
  },

  exportToGoogleDocs: async () => {
    const currentData = window.getGeneratedData ? window.getGeneratedData() : window.generatedData;
    if (!currentData || !currentData.soal || currentData.soal.length === 0) {
      if (window.showError) {
        window.showError('Belum ada butir soal yang dibuat untuk diekspor!');
      }
      return;
    }

    const currentForm = (window.getCurrentFormData ? window.getCurrentFormData() : window.currentFormData) || {};
    const curriculum = window.getCurrentCurriculum ? window.getCurrentCurriculum() : (window.currentCurriculum || 'merdeka');
    const curriculumName = (window.curriculumData && window.curriculumData[curriculum]?.name) || 'Kurikulum Merdeka';

    await triggerGoogleDocsExport(currentForm, currentData, curriculumName);
  },

  exportSavedSetToGoogleDocs: async (id: string) => {
    const item = savedQuestionsCache.find(q => q.id === id);
    if (!item) return;

    try {
      const parsed = JSON.parse(item.soalJson);
      if (!parsed.soal || !Array.isArray(parsed.soal)) {
        throw new Error('Format data soal tidak valid.');
      }
      const curriculumName = (window.curriculumData && window.curriculumData[item.curriculum]?.name) || item.curriculum || 'Kurikulum Merdeka';
      await triggerGoogleDocsExport(item.formData || parsed.formData, { soal: parsed.soal }, curriculumName);
    } catch (err: any) {
      if (window.showError) {
        window.showError(`Gagal mengekspor bank soal: ${err.message || err}`);
      }
    }
  }
};

window.exportToGoogleDocs = () => window.firebaseAuth.exportToGoogleDocs();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupFirebaseIntegration);
} else {
  setupFirebaseIntegration();
}