import { getOrRequestAccessToken } from './firebase';

export interface ExportDocOptions {
  contentChoice: 'full' | 'soal_only' | 'kunci_only' | 'kisikisi_only';
  includeKop: boolean;
  includeSignatures: boolean;
  includePetunjuk: boolean;
  documentTitle: string;
}

export interface QuestionItem {
  nomor: number | string;
  tipe: string;
  pertanyaan: string;
  opsi?: any;
  stimulus?: string;
  kunci?: string;
  pembahasan?: string;
  poin?: number | string;
  kognitif?: string;
  tingkat?: string;
  materi?: string;
  indikator?: string;
  cp?: string;
  gambarData?: string;
}

export interface AssessmentMetadata {
  mapel: string;
  jenjang: string;
  kelas: string;
  topik: string;
  sekolah: string;
  guru: string;
  asesmen: string;
  kurikulum: string;
  instansi?: string;
  alamat?: string;
  telp?: string;
  tahun?: string;
  semester?: string;
  alokasiWaktu?: string;
}

/**
 * Builds HTML tailored for Google Docs import with styles, tables, and page breaks.
 */
export function buildAssessmentHtml(
  meta: AssessmentMetadata,
  soalList: QuestionItem[],
  options: ExportDocOptions
): string {
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const nowStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${meta.asesmen.toUpperCase()} - ${meta.mapel}</title>
<style>
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #111111;
    margin: 0;
    padding: 0;
  }
  h1, h2, h3, h4 {
    font-family: Arial, Helvetica, sans-serif;
    color: #111111;
    margin-top: 14pt;
    margin-bottom: 6pt;
  }
  .kop-table {
    width: 100%;
    border-collapse: collapse;
    border: none;
    margin-bottom: 12pt;
  }
  .kop-table td {
    border: none;
    padding: 2pt;
  }
  .kop-text-center {
    text-align: center;
  }
  .kop-instansi {
    font-size: 13pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5pt;
  }
  .kop-sekolah {
    font-size: 16pt;
    font-weight: bold;
    text-transform: uppercase;
  }
  .kop-alamat {
    font-size: 9.5pt;
    font-style: italic;
    color: #333333;
  }
  .kop-line {
    border-top: 2.5pt solid #000000;
    border-bottom: 0.75pt solid #000000;
    height: 3pt;
    margin: 4pt 0 14pt 0;
  }
  .doc-title {
    text-align: center;
    font-size: 14pt;
    font-weight: bold;
    text-transform: uppercase;
    margin-bottom: 4pt;
  }
  .doc-subtitle {
    text-align: center;
    font-size: 11pt;
    margin-bottom: 12pt;
    font-weight: normal;
  }
  .meta-table {
    width: 100%;
    border-collapse: collapse;
    border: 1pt solid #444444;
    margin-bottom: 14pt;
    font-size: 10.5pt;
  }
  .meta-table td {
    padding: 4pt 8pt;
    border: 1pt solid #cccccc;
    vertical-align: top;
  }
  .meta-label {
    width: 18%;
    font-weight: bold;
    background-color: #f8f9fa;
  }
  .meta-val {
    width: 32%;
  }
  .petunjuk-box {
    border: 1pt solid #999999;
    background-color: #fdfdfd;
    padding: 8pt 12pt;
    margin-bottom: 16pt;
    font-size: 10pt;
  }
  .petunjuk-title {
    font-weight: bold;
    margin-bottom: 4pt;
    text-transform: uppercase;
    font-size: 10pt;
  }
  .petunjuk-ol {
    margin: 0;
    padding-left: 16pt;
  }
  .petunjuk-ol li {
    margin-bottom: 2pt;
  }
  .section-header {
    background-color: #f1f3f5;
    padding: 6pt 10pt;
    font-size: 11.5pt;
    font-weight: bold;
    border-left: 4pt solid #2563eb;
    margin-top: 16pt;
    margin-bottom: 10pt;
  }
  .soal-item {
    margin-bottom: 14pt;
    page-break-inside: avoid;
  }
  .stimulus-box {
    background-color: #f8fafc;
    border-left: 3pt solid #3b82f6;
    padding: 6pt 10pt;
    margin: 4pt 0 8pt 0;
    font-style: italic;
    font-size: 10.5pt;
  }
  .soal-text {
    margin-bottom: 4pt;
  }
  .opsi-list {
    margin-left: 18pt;
    margin-top: 4pt;
    margin-bottom: 6pt;
  }
  .opsi-row {
    margin-bottom: 2pt;
  }
  .grid-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 8pt;
    margin-bottom: 8pt;
    font-size: 10pt;
  }
  .grid-table th, .grid-table td {
    border: 1pt solid #333333;
    padding: 5pt 7pt;
    text-align: left;
  }
  .grid-table th {
    background-color: #e2e8f0;
    font-weight: bold;
    text-align: center;
  }
  .page-break {
    page-break-before: always;
    margin-top: 20pt;
  }
  .signature-table {
    width: 100%;
    border: none;
    border-collapse: collapse;
    margin-top: 24pt;
    page-break-inside: avoid;
  }
  .signature-table td {
    border: none;
    vertical-align: top;
    width: 50%;
    padding: 6pt;
  }
</style>
</head>
<body>
`;

  // 1. KOP SURAT (Optional)
  if (options.includeKop) {
    const instansi = meta.instansi || 'PEMERINTAH KABUPATEN / KOTA';
    const sekolah = meta.sekolah || 'SEKOLAH INDONESIA';
    const alamat = meta.alamat || 'Jalan Pendidikan No. 1';
    const telp = meta.telp ? ` | Telp: ${meta.telp}` : '';

    html += `
  <table class="kop-table">
    <tr>
      <td class="kop-text-center">
        <div class="kop-instansi">${instansi}</div>
        <div class="kop-sekolah">${sekolah}</div>
        <div class="kop-alamat">${alamat}${telp}</div>
      </td>
    </tr>
  </table>
  <div class="kop-line"></div>
`;
  }

  // 2. DOCUMENT TITLE & META TABLE
  html += `
  <div class="doc-title">${meta.asesmen.toUpperCase()}</div>
  <div class="doc-subtitle">Tahun Ajaran ${meta.tahun || '2024/2025'} &bull; Semester ${meta.semester || 'Ganjil'}</div>

  <table class="meta-table">
    <tr>
      <td class="meta-label">Mata Pelajaran</td>
      <td class="meta-val">${meta.mapel}</td>
      <td class="meta-label">Kelas / Jenjang</td>
      <td class="meta-val">Kelas ${meta.kelas} (${meta.jenjang})</td>
    </tr>
    <tr>
      <td class="meta-label">Topik / Materi</td>
      <td class="meta-val">${meta.topik}</td>
      <td class="meta-label">Kurikulum</td>
      <td class="meta-val">${meta.kurikulum}</td>
    </tr>
    <tr>
      <td class="meta-label">Guru Pengampu</td>
      <td class="meta-val">${meta.guru}</td>
      <td class="meta-label">Alokasi Waktu</td>
      <td class="meta-val">${meta.alokasiWaktu || '60 - 90 Menit'}</td>
    </tr>
  </table>
`;

  // 3. PETUNJUK PENGERJAAN
  if (options.includePetunjuk && options.contentChoice !== 'kunci_only' && options.contentChoice !== 'kisikisi_only') {
    html += `
  <div class="petunjuk-box">
    <div class="petunjuk-title">Petunjuk Umum Pengerjaan:</div>
    <ol class="petunjuk-ol">
      <li>Tulislah nama, nomor peserta, dan identitas Anda secara lengkap pada lembar jawaban.</li>
      <li>Periksa dan bacalah setiap butir soal dengan saksama sebelum Anda menjawabnya.</li>
      <li>Dahulukan menjawab soal-soal yang Anda anggap mudah.</li>
      <li>Periksa kembali lembar jawaban Anda sebelum diserahkan kepada pengawas ujian.</li>
    </ol>
  </div>
`;
  }

  // Helper render question options
  function renderOpsiHtml(s: QuestionItem): string {
    if (!s.opsi) return '';
    if (Array.isArray(s.opsi) && s.opsi.length > 0) {
      return `
      <div class="opsi-list">
        ${s.opsi.map((o: string, idx: number) => {
          const hasPrefix = /^[A-H][\.\)]\s?/.test(o);
          const displayText = hasPrefix ? o : `<strong>${letters[idx]}.</strong> ${o}`;
          return `<div class="opsi-row">${displayText}</div>`;
        }).join('')}
      </div>`;
    }

    // Jodoh (Matching)
    if (s.tipe === 'jodoh' && s.opsi.kiri && s.opsi.kanan) {
      const kiri = s.opsi.kiri as string[];
      const kanan = s.opsi.kanan as string[];
      const maxRows = Math.max(kiri.length, kanan.length);
      let rowsHtml = '';
      for (let r = 0; r < maxRows; r++) {
        const itemKiri = kiri[r] ? `${r + 1}. ${kiri[r]}` : '';
        const itemKanan = kanan[r] ? `${letters[r]}. ${kanan[r]}` : '';
        rowsHtml += `<tr><td style="width: 50%;">${itemKiri}</td><td style="width: 50%;">${itemKanan}</td></tr>`;
      }
      return `
      <table class="grid-table" style="max-width: 600px; margin-left: 18pt;">
        <thead>
          <tr><th>Pernyataan / Konsep</th><th>Pasangan / Definisi</th></tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>`;
    }

    // Tabel (Table fill)
    if (s.tipe === 'tabel' && s.opsi.headers && s.opsi.rows) {
      const headers = s.opsi.headers as string[];
      const rows = s.opsi.rows as string[][];
      return `
      <table class="grid-table" style="margin-left: 18pt;">
        <thead>
          <tr>${headers.map((h: string) => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows.map((row: string[]) => `<tr>${row.map((cell: string) => `<td>${cell}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>`;
    }

    return '';
  }

  // 4. NASKAH SOAL (If included)
  const shouldRenderSoal = options.contentChoice === 'full' || options.contentChoice === 'soal_only';
  if (shouldRenderSoal) {
    const tipePG = ['pg', 'pg-kompleks', 'bs', 'jodoh', 'urutan', 'tabel', 'sebab-akibat'];
    const soalPG = soalList.filter(s => tipePG.includes(s.tipe));
    const soalIsian = soalList.filter(s => s.tipe === 'isian');
    const soalEssay = soalList.filter(s => s.tipe === 'essay' || s.tipe === 'uraian');

    let bagianNum = 1;

    // Bagian Pilihan Ganda
    if (soalPG.length > 0) {
      html += `<div class="section-header">BAGIAN ${bagianNum}: SOAL PILIHAN GANDA & OBJEKTIF (${soalPG.length} Butir Soal)</div>`;
      soalPG.forEach(s => {
        html += `
        <div class="soal-item">
          <div class="soal-text"><strong>${s.nomor}.</strong> ${s.pertanyaan}</div>
          ${s.stimulus ? `<div class="stimulus-box">${s.stimulus}</div>` : ''}
          ${renderOpsiHtml(s)}
        </div>`;
      });
      bagianNum++;
    }

    // Bagian Isian Singkat
    if (soalIsian.length > 0) {
      html += `<div class="section-header">BAGIAN ${bagianNum}: SOAL ISIAN SINGKAT (${soalIsian.length} Butir Soal)</div>`;
      soalIsian.forEach(s => {
        html += `
        <div class="soal-item">
          <div class="soal-text"><strong>${s.nomor}.</strong> ${s.pertanyaan}</div>
          ${s.stimulus ? `<div class="stimulus-box">${s.stimulus}</div>` : ''}
          <div style="margin-left: 18pt; color: #666; font-style: italic; margin-top: 4pt;">Jawaban: ____________________________________________________</div>
        </div>`;
      });
      bagianNum++;
    }

    // Bagian Uraian / Essay
    if (soalEssay.length > 0) {
      html += `<div class="section-header">BAGIAN ${bagianNum}: SOAL URAIAN / ESSAY (${soalEssay.length} Butir Soal)</div>`;
      soalEssay.forEach(s => {
        html += `
        <div class="soal-item">
          <div class="soal-text"><strong>${s.nomor}.</strong> ${s.pertanyaan}</div>
          ${s.stimulus ? `<div class="stimulus-box">${s.stimulus}</div>` : ''}
          <div style="height: 48pt; border-bottom: 1pt dashed #cccccc; margin-top: 6pt;"></div>
        </div>`;
      });
    }

    // Signatures for Soal
    if (options.includeSignatures && options.contentChoice === 'soal_only') {
      html += `
      <table class="signature-table">
        <tr>
          <td>
            Mengetahui,<br>
            Kepala Sekolah<br><br><br><br>
            <strong>__________________________</strong><br>
            NIP.
          </td>
          <td style="text-align: right;">
            ${meta.sekolah ? meta.sekolah.split(' ')[0] : ''}, ${nowStr}<br>
            Guru Mata Pelajaran<br><br><br><br>
            <strong>${meta.guru || '__________________________'}</strong><br>
            NIP.
          </td>
        </tr>
      </table>`;
    }
  }

  // 5. KUNCI JAWABAN & PEMBAHASAN (If included)
  const shouldRenderKunci = options.contentChoice === 'full' || options.contentChoice === 'kunci_only';
  if (shouldRenderKunci) {
    if (shouldRenderSoal) {
      html += `<div class="page-break"></div>`;
    }
    html += `
    <div class="section-header" style="border-left-color: #10b981;">LEMBAR KUNCI JAWABAN, PEMBAHASAN & PEDOMAN PENSKORAN</div>
    <p style="font-size: 10.5pt; color: #555555; margin-bottom: 12pt;">Dokumen acuan penilaian dan pembahasan bagi guru mata pelajaran ${meta.mapel} Kelas ${meta.kelas}.</p>
    `;

    soalList.forEach(s => {
      const kunciText = s.kunci || '-';
      const pembahasanText = s.pembahasan || 'Pembahasan belum tersedia.';
      const poinText = s.poin ? `(Bobot: ${s.poin} Poin)` : '';

      html += `
      <div class="soal-item" style="border-bottom: 0.5pt solid #e5e7eb; padding-bottom: 8pt;">
        <div style="display: flex; justify-content: space-between;">
          <strong>Nomor ${s.nomor}</strong> <span style="font-size: 10pt; color: #4b5563;">${poinText}</span>
        </div>
        <div style="margin-top: 2pt;">
          <strong>Kunci Jawaban:</strong>
          <span style="color: #047857; font-weight: bold; background-color: #ecfdf5; padding: 1pt 6pt; border-radius: 3pt;">${kunciText}</span>
        </div>
        <div style="margin-top: 4pt; font-size: 10.5pt; color: #374151;">
          <strong>Pembahasan & Rubrik:</strong><br>
          ${pembahasanText}
        </div>
      </div>`;
    });
  }

  // 6. KISI-KISI SOAL (If included)
  const shouldRenderKisikisi = options.contentChoice === 'full' || options.contentChoice === 'kisikisi_only';
  if (shouldRenderKisikisi) {
    if (shouldRenderSoal || shouldRenderKunci) {
      html += `<div class="page-break"></div>`;
    }
    html += `
    <div class="section-header" style="border-left-color: #f59e0b;">KISI-KISI PENULISAN SOAL ASESMEN</div>
    <table class="grid-table">
      <thead>
        <tr>
          <th style="width: 5%;">No</th>
          <th style="width: 25%;">Capaian Pembelajaran / KD</th>
          <th style="width: 20%;">Materi Pokok</th>
          <th style="width: 25%;">Indikator Soal</th>
          <th style="width: 10%;">Level Kognitif</th>
          <th style="width: 15%;">Bentuk Soal</th>
        </tr>
      </thead>
      <tbody>
        ${soalList.map(s => `
          <tr>
            <td style="text-align: center;">${s.nomor}</td>
            <td>${s.cp || meta.topik}</td>
            <td>${s.materi || meta.topik}</td>
            <td>${s.indikator || `Peserta didik mampu menyelesaikan permasalahan terkait ${meta.topik}`}</td>
            <td style="text-align: center;">${s.kognitif || 'C3'}</td>
            <td style="text-align: center; text-transform: uppercase;">${s.tipe}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
`;
  }

  // 7. FINAL SIGNATURES (For full / kunci / kisikisi)
  if (options.includeSignatures && options.contentChoice !== 'soal_only') {
    html += `
  <table class="signature-table">
    <tr>
      <td>
        Mengetahui,<br>
        Kepala Sekolah<br><br><br><br>
        <strong>__________________________</strong><br>
        NIP.
      </td>
      <td style="text-align: right;">
        ${meta.sekolah ? meta.sekolah.split(' ')[0] : ''}, ${nowStr}<br>
        Guru Mata Pelajaran<br><br><br><br>
        <strong>${meta.guru || '__________________________'}</strong><br>
        NIP.
      </td>
    </tr>
  </table>`;
  }

  html += `
</body>
</html>`;

  return html;
}

/**
 * Uploads formatted HTML into Google Drive as a native, fully editable Google Doc.
 */
export async function createGoogleDocFromHtml(
  accessToken: string,
  docTitle: string,
  htmlContent: string
): Promise<{ id: string; url: string; title: string }> {
  const boundary = 'google_docs_export_boundary_' + Math.random().toString(36).substring(2);

  const metadata = JSON.stringify({
    name: docTitle,
    mimeType: 'application/vnd.google-apps.document'
  });

  const multipartRequestBody =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    metadata +
    '\r\n' +
    `--${boundary}\r\n` +
    'Content-Type: text/html; charset=UTF-8\r\n\r\n' +
    htmlContent +
    '\r\n' +
    `--${boundary}--`;

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || response.statusText || 'Gagal membuat dokumen Google Docs.';
    console.error('Google Drive API Error:', errorData);
    throw new Error(`Google Drive API error (${response.status}): ${message}`);
  }

  const result = await response.json();
  const fileId = result.id;
  const editUrl = `https://docs.google.com/document/d/${fileId}/edit`;

  return {
    id: fileId,
    url: editUrl,
    title: result.name || docTitle
  };
}

/**
 * Handles the complete export flow with confirmation dialog and success state.
 */
export async function triggerGoogleDocsExport(
  formData: any,
  generatedData: { soal: QuestionItem[] },
  curriculumName: string
) {
  if (!generatedData || !generatedData.soal || generatedData.soal.length === 0) {
    if ((window as any).showError) {
      (window as any).showError('Belum ada butir soal yang dibuat untuk diekspor!');
    }
    return;
  }

  // Collect metadata from form
  const mapel = (document.getElementById('mapel') as HTMLSelectElement)?.value || formData?.mapel || 'Mata Pelajaran';
  const topik = (document.getElementById('topik') as HTMLInputElement)?.value || formData?.topik || 'Topik Soal';
  const jenjang = (document.getElementById('jenjang') as HTMLSelectElement)?.value || formData?.jenjang || 'SD';
  const kelas = (document.getElementById('kelas') as HTMLSelectElement)?.value || formData?.kelas || '1';
  const sekolah = (document.getElementById('nama-sekolah') as HTMLInputElement)?.value || 'Sekolah Indonesia';
  const guru = (document.getElementById('nama-guru') as HTMLInputElement)?.value || 'Guru Pengampu';
  const asesmen = (document.getElementById('jenis-asesmen') as HTMLSelectElement)?.value || 'Asesmen Sumatif';

  const instansi = (document.getElementById('setting-instansi') as HTMLInputElement)?.value;
  const alamat = (document.getElementById('setting-alamat') as HTMLInputElement)?.value;
  const telp = (document.getElementById('setting-telp') as HTMLInputElement)?.value;
  const tahun = (document.getElementById('setting-tahun') as HTMLInputElement)?.value;
  const semester = (document.getElementById('setting-semester') as HTMLInputElement)?.value;

  const assessmentMeta: AssessmentMetadata = {
    mapel,
    jenjang,
    kelas,
    topik,
    sekolah,
    guru,
    asesmen,
    kurikulum: curriculumName,
    instansi,
    alamat,
    telp,
    tahun,
    semester
  };

  const defaultTitle = `${asesmen.toUpperCase()} ${mapel} Kelas ${kelas} - ${topik}`;

  // Show Confirmation Modal (MANDATORY per Workspace skill guidelines)
  showExportConfirmationModal(assessmentMeta, defaultTitle, async (chosenOptions) => {
    try {
      showExportLoadingModal('Menghubungkan ke Google Drive & menyiapkan dokumen...');

      // Get or prompt for access token
      const accessToken = await getOrRequestAccessToken();

      updateExportLoadingText('Mengonversi format naskah soal ke Google Docs...');

      const docHtml = buildAssessmentHtml(assessmentMeta, generatedData.soal, chosenOptions);

      const result = await createGoogleDocFromHtml(accessToken, chosenOptions.documentTitle, docHtml);

      hideExportLoadingModal();

      // Show Success Modal with direct link
      showExportSuccessModal(result.title, result.url);

      if ((window as any).showSuccess) {
        (window as any).showSuccess(`Berhasil mengekspor ke Google Docs: "${result.title}"`);
      }
    } catch (err: any) {
      hideExportLoadingModal();
      console.error('Export to Google Docs failed:', err);
      if ((window as any).showError) {
        (window as any).showError(`Gagal mengekspor ke Google Docs: ${err.message || err}`);
      }
    }
  });
}

// ============================================
// UI MODALS: CONFIRMATION, LOADING, SUCCESS
// ============================================

function showExportConfirmationModal(
  meta: AssessmentMetadata,
  defaultTitle: string,
  onConfirm: (options: ExportDocOptions) => void
) {
  const existing = document.getElementById('gdocs-confirm-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'gdocs-confirm-modal';
  modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in';
  modal.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 transform transition-all">
      <!-- Modal Header -->
      <div class="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
            <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
          </div>
          <div>
            <h3 class="font-bold text-lg leading-tight">Ekspor ke Google Docs</h3>
            <p class="text-xs text-blue-100">Simpan dan edit format naskah soal langsung di Google Drive Anda</p>
          </div>
        </div>
        <button type="button" id="gdocs-modal-close-btn" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-6 space-y-4 text-sm text-gray-700">
        <!-- Notice description -->
        <div class="p-3.5 bg-blue-50 border border-blue-100 rounded-2xl text-xs text-blue-800 flex items-start gap-2.5">
          <i class="fa-solid fa-circle-info text-blue-500 mt-0.5 text-sm"></i>
          <div>
            <strong>Konfirmasi Tindakan:</strong> Aplikasi akan membuat dokumen Google Docs baru di Google Drive Anda agar Anda dapat mengedit tata letak, font, tabel, dan butir soal secara fleksibel.
          </div>
        </div>

        <!-- Document Title Input -->
        <div>
          <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">Nama Dokumen Google Docs</label>
          <input type="text" id="gdocs-title-input" value="${defaultTitle}"
            class="w-full px-3.5 py-2.5 border-2 border-gray-200 focus:border-blue-500 focus:outline-none rounded-xl text-sm transition font-medium">
        </div>

        <!-- Content Choice -->
        <div>
          <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Pilihan Konten yang Diekspor</label>
          <div class="space-y-2">
            <label class="flex items-start gap-3 p-3 border-2 border-indigo-200 bg-indigo-50/50 rounded-xl cursor-pointer hover:bg-indigo-50 transition">
              <input type="radio" name="gdocs-content-choice" value="full" checked class="mt-1 text-blue-600 focus:ring-blue-500">
              <div>
                <span class="font-bold text-gray-800 block text-xs">Paket Lengkap (Rekomendasi)</span>
                <span class="text-[11px] text-gray-500">Naskah Soal Siswa + Kunci Jawaban & Pembahasan + Kisi-kisi Penulisan Soal</span>
              </div>
            </label>

            <label class="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
              <input type="radio" name="gdocs-content-choice" value="soal_only" class="mt-1 text-blue-600 focus:ring-blue-500">
              <div>
                <span class="font-semibold text-gray-800 block text-xs">Hanya Naskah Soal Siswa</span>
                <span class="text-[11px] text-gray-500">Format bersih siap dibagikan atau dicetak langsung untuk siswa</span>
              </div>
            </label>

            <label class="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
              <input type="radio" name="gdocs-content-choice" value="kunci_only" class="mt-1 text-blue-600 focus:ring-blue-500">
              <div>
                <span class="font-semibold text-gray-800 block text-xs">Hanya Kunci Jawaban & Pembahasan</span>
                <span class="text-[11px] text-gray-500">Pedoman penskoran, kunci jawaban, dan pembahasan lengkap</span>
              </div>
            </label>

            <label class="flex items-start gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition">
              <input type="radio" name="gdocs-content-choice" value="kisikisi_only" class="mt-1 text-blue-600 focus:ring-blue-500">
              <div>
                <span class="font-semibold text-gray-800 block text-xs">Hanya Kisi-kisi Soal</span>
                <span class="text-[11px] text-gray-500">Tabel CP, materi pokok, indikator, level kognitif & bentuk soal</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Format Options -->
        <div class="pt-2 border-t border-gray-100">
          <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Kelengkapan Dokumen</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="gdocs-opt-kop" checked class="rounded text-blue-600">
              <span>Sertakan Kop Sekolah Resmi</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="gdocs-opt-petunjuk" checked class="rounded text-blue-600">
              <span>Sertakan Petunjuk Pengerjaan</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="gdocs-opt-ttd" checked class="rounded text-blue-600">
              <span>Sertakan Kolom Tanda Tangan</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
        <button type="button" id="gdocs-modal-cancel-btn"
          class="px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-semibold transition">
          Batal
        </button>
        <button type="button" id="gdocs-modal-proceed-btn"
          class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-md transition flex items-center gap-2">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
          <span>Ekspor ke Google Docs</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => modal.remove();
  document.getElementById('gdocs-modal-close-btn')?.addEventListener('click', closeModal);
  document.getElementById('gdocs-modal-cancel-btn')?.addEventListener('click', closeModal);

  document.getElementById('gdocs-modal-proceed-btn')?.addEventListener('click', () => {
    const titleInput = document.getElementById('gdocs-title-input') as HTMLInputElement;
    const choiceEl = document.querySelector('input[name="gdocs-content-choice"]:checked') as HTMLInputElement;
    const kopEl = document.getElementById('gdocs-opt-kop') as HTMLInputElement;
    const petunjukEl = document.getElementById('gdocs-opt-petunjuk') as HTMLInputElement;
    const ttdEl = document.getElementById('gdocs-opt-ttd') as HTMLInputElement;

    const options: ExportDocOptions = {
      documentTitle: titleInput?.value.trim() || defaultTitle,
      contentChoice: (choiceEl?.value || 'full') as any,
      includeKop: kopEl ? kopEl.checked : true,
      includePetunjuk: petunjukEl ? petunjukEl.checked : true,
      includeSignatures: ttdEl ? ttdEl.checked : true
    };

    closeModal();
    onConfirm(options);
  });
}

function showExportLoadingModal(initialText: string) {
  let modal = document.getElementById('gdocs-loading-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'gdocs-loading-modal';
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-gray-100 space-y-4">
        <div class="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
          <i class="fa-solid fa-spinner fa-spin text-3xl"></i>
        </div>
        <h4 class="font-bold text-gray-800 text-base">Membuat Dokumen Google Docs</h4>
        <p id="gdocs-loading-text" class="text-xs text-gray-500">${initialText}</p>
      </div>
    `;
    document.body.appendChild(modal);
  } else {
    updateExportLoadingText(initialText);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function updateExportLoadingText(text: string) {
  const el = document.getElementById('gdocs-loading-text');
  if (el) el.textContent = text;
}

function hideExportLoadingModal() {
  const modal = document.getElementById('gdocs-loading-modal');
  if (modal) modal.remove();
}

function showExportSuccessModal(docTitle: string, docUrl: string) {
  const existing = document.getElementById('gdocs-success-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'gdocs-success-modal';
  modal.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in';
  modal.innerHTML = `
    <div class="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 text-center p-6 space-y-5">
      <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
        <i class="fa-solid fa-check text-2xl"></i>
      </div>

      <div>
        <h3 class="font-black text-gray-800 text-xl">Dokumen Berhasil Dibuat!</h3>
        <p class="text-xs text-gray-500 mt-1">Soal telah diekspor dan tersimpan aman di Google Drive Anda.</p>
      </div>

      <div class="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-left">
        <div class="flex items-center gap-2 text-xs text-blue-700 font-bold mb-1">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
          </svg>
          <span class="truncate">${docTitle}</span>
        </div>
        <p class="text-[11px] text-gray-500">Anda dapat mengubah format huruf, margin, menambah gambar, atau mencetak langsung di Google Docs.</p>
      </div>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        <a href="${docUrl}" target="_blank" rel="noopener noreferrer"
          class="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition">
          <i class="fa-solid fa-arrow-up-right-from-square"></i>
          <span>Buka di Google Docs</span>
        </a>
        <button type="button" id="gdocs-copy-link-btn"
          class="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition">
          <i class="fa-solid fa-copy mr-1"></i> Salin Tautan
        </button>
      </div>

      <div>
        <button type="button" id="gdocs-success-close-btn" class="text-xs text-gray-400 hover:text-gray-600 font-medium transition">
          Tutup
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeModal = () => modal.remove();
  document.getElementById('gdocs-success-close-btn')?.addEventListener('click', closeModal);

  document.getElementById('gdocs-copy-link-btn')?.addEventListener('click', () => {
    navigator.clipboard.writeText(docUrl).then(() => {
      const btn = document.getElementById('gdocs-copy-link-btn');
      if (btn) btn.innerHTML = '<i class="fa-solid fa-check text-emerald-600 mr-1"></i> Tersalin!';
      setTimeout(() => {
        if (btn) btn.innerHTML = '<i class="fa-solid fa-copy mr-1"></i> Salin Tautan';
      }, 2000);
    });
  });
}
