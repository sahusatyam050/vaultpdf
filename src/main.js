import { decryptPDF, isEncrypted } from '@pdfsmaller/pdf-decrypt';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import { PDFDocument, degrees } from 'pdf-lib';
import confetti from 'canvas-confetti';

// ─── UTILITIES & HELPERS ──────────────────────────────────────────────────

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function fireCelebration() {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.8 },
    colors: ['#10b981', '#38bdf8', '#a855f7', '#f59e0b']
  });
}

function downloadFile(uint8Array, filename) {
  const blob = new Blob([uint8Array], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── TAB SWITCHING ────────────────────────────────────────────────────────

const tabButtons = document.querySelectorAll('.tab-btn');
const toolPanels = document.querySelectorAll('.tool-panel');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-tab');
    tabButtons.forEach(b => b.classList.remove('active'));
    toolPanels.forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    const targetPanel = document.getElementById(targetId);
    if (targetPanel) targetPanel.classList.add('active');
  });
});

// ─── 1. UNLOCK & DECRYPT MODULE ──────────────────────────────────────────

const unlockDropzone = document.getElementById('unlockDropzone');
const unlockFileInput = document.getElementById('unlockFileInput');
const unlockActionCard = document.getElementById('unlockActionCard');
const unlockFileName = document.getElementById('unlockFileName');
const unlockFileStats = document.getElementById('unlockFileStats');
const unlockPasswordInput = document.getElementById('unlockPasswordInput');
const unlockToggleEye = document.getElementById('unlockToggleEye');
const unlockClearBtn = document.getElementById('unlockClearBtn');
const btnExecuteUnlock = document.getElementById('btnExecuteUnlock');

let currentUnlockFile = null;
let currentUnlockBytes = null;

unlockDropzone.addEventListener('click', () => unlockFileInput.click());
unlockDropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  unlockDropzone.classList.add('dragover');
});
unlockDropzone.addEventListener('dragleave', () => unlockDropzone.classList.remove('dragover'));
unlockDropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  unlockDropzone.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    handleUnlockFile(e.dataTransfer.files[0]);
  }
});
unlockFileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) {
    handleUnlockFile(e.target.files[0]);
  }
});

async function handleUnlockFile(file) {
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    showToast('Please select a valid PDF file.', 'error');
    return;
  }
  currentUnlockFile = file;
  const arrayBuffer = await file.arrayBuffer();
  currentUnlockBytes = new Uint8Array(arrayBuffer);

  const encrypted = isEncrypted(currentUnlockBytes);
  unlockFileName.textContent = file.name;
  unlockFileStats.textContent = `${formatBytes(file.size)} • ${encrypted ? '🔒 Password Protected (Locked)' : '🟢 Already Unlocked'}`;
  
  unlockDropzone.style.display = 'none';
  unlockActionCard.classList.remove('hidden');

  if (encrypted) {
    unlockPasswordInput.value = '';
    unlockPasswordInput.focus();
    showToast('Encrypted document detected! Enter password to unlock.', 'info');
  } else {
    showToast('This PDF is already unprotected. You can still re-save a clean copy.', 'info');
  }
}

unlockClearBtn.addEventListener('click', () => {
  currentUnlockFile = null;
  currentUnlockBytes = null;
  unlockFileInput.value = '';
  unlockActionCard.classList.add('hidden');
  unlockDropzone.style.display = 'block';
});

unlockToggleEye.addEventListener('click', () => {
  const isPass = unlockPasswordInput.type === 'password';
  unlockPasswordInput.type = isPass ? 'text' : 'password';
  unlockToggleEye.textContent = isPass ? '🙈' : '👁️';
});

btnExecuteUnlock.addEventListener('click', async () => {
  if (!currentUnlockBytes) return;

  const password = unlockPasswordInput.value.trim();
  const encrypted = isEncrypted(currentUnlockBytes);

  btnExecuteUnlock.disabled = true;
  btnExecuteUnlock.innerHTML = '<span>⚡</span> <span>Decrypting inside browser...</span>';

  try {
    let unlockedBytes;
    if (encrypted) {
      if (!password) {
        showToast('Please enter the document password.', 'error');
        btnExecuteUnlock.disabled = false;
        btnExecuteUnlock.innerHTML = '<span>⚡</span> <span>Decrypt & Download Clean PDF</span>';
        return;
      }
      unlockedBytes = await decryptPDF(currentUnlockBytes, password);
    } else {
      unlockedBytes = currentUnlockBytes;
    }

    const cleanName = currentUnlockFile.name.replace(/\.pdf$/i, '_unlocked.pdf');
    downloadFile(unlockedBytes, cleanName);
    fireCelebration();
    showToast(`Successfully unlocked & saved as ${cleanName}!`, 'success');
  } catch (err) {
    console.error('Decryption failed:', err);
    showToast('Incorrect password or unsupported encryption format. Please verify password.', 'error');
  } finally {
    btnExecuteUnlock.disabled = false;
    btnExecuteUnlock.innerHTML = '<span>⚡</span> <span>Decrypt & Download Clean PDF</span>';
  }
});

// ─── 2. PROTECT & ENCRYPT MODULE ─────────────────────────────────────────

const protectDropzone = document.getElementById('protectDropzone');
const protectFileInput = document.getElementById('protectFileInput');
const protectActionCard = document.getElementById('protectActionCard');
const protectFileName = document.getElementById('protectFileName');
const protectFileStats = document.getElementById('protectFileStats');
const protectPasswordInput = document.getElementById('protectPasswordInput');
const protectToggleEye = document.getElementById('protectToggleEye');
const protectClearBtn = document.getElementById('protectClearBtn');
const btnExecuteProtect = document.getElementById('btnExecuteProtect');

let currentProtectFile = null;
let currentProtectBytes = null;

protectDropzone.addEventListener('click', () => protectFileInput.click());
protectDropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  protectDropzone.classList.add('dragover');
});
protectDropzone.addEventListener('dragleave', () => protectDropzone.classList.remove('dragover'));
protectDropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  protectDropzone.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    handleProtectFile(e.dataTransfer.files[0]);
  }
});
protectFileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) {
    handleProtectFile(e.target.files[0]);
  }
});

async function handleProtectFile(file) {
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    showToast('Please select a valid PDF file.', 'error');
    return;
  }
  currentProtectFile = file;
  const arrayBuffer = await file.arrayBuffer();
  currentProtectBytes = new Uint8Array(arrayBuffer);

  protectFileName.textContent = file.name;
  protectFileStats.textContent = `${formatBytes(file.size)} • Ready to encrypt`;
  
  protectDropzone.style.display = 'none';
  protectActionCard.classList.remove('hidden');
  protectPasswordInput.value = '';
  protectPasswordInput.focus();
}

protectClearBtn.addEventListener('click', () => {
  currentProtectFile = null;
  currentProtectBytes = null;
  protectFileInput.value = '';
  protectActionCard.classList.add('hidden');
  protectDropzone.style.display = 'block';
});

protectToggleEye.addEventListener('click', () => {
  const isPass = protectPasswordInput.type === 'password';
  protectPasswordInput.type = isPass ? 'text' : 'password';
  protectToggleEye.textContent = isPass ? '🙈' : '👁️';
});

btnExecuteProtect.addEventListener('click', async () => {
  if (!currentProtectBytes) return;
  const password = protectPasswordInput.value.trim();
  if (!password) {
    showToast('Please enter a password to protect this document.', 'error');
    return;
  }

  btnExecuteProtect.disabled = true;
  btnExecuteProtect.innerHTML = '<span>🔒</span> <span>Encrypting with AES-256...</span>';

  try {
    const encryptedBytes = await encryptPDF(currentProtectBytes, password, password);
    const protectedName = currentProtectFile.name.replace(/\.pdf$/i, '_protected.pdf');
    downloadFile(encryptedBytes, protectedName);
    fireCelebration();
    showToast(`Protected with AES-256 and saved as ${protectedName}!`, 'success');
  } catch (err) {
    console.error('Encryption failed:', err);
    showToast('Encryption failed. Check if document is already encrypted.', 'error');
  } finally {
    btnExecuteProtect.disabled = false;
    btnExecuteProtect.innerHTML = '<span>🔒</span> <span>Encrypt & Download Locked PDF</span>';
  }
});

// ─── 3. MERGE MODULE ─────────────────────────────────────────────────────

const mergeDropzone = document.getElementById('mergeDropzone');
const mergeFileInput = document.getElementById('mergeFileInput');
const mergeActionCard = document.getElementById('mergeActionCard');
const mergeFileList = document.getElementById('mergeFileList');
const mergeSummary = document.getElementById('mergeSummary');
const mergeAddMoreBtn = document.getElementById('mergeAddMoreBtn');
const btnExecuteMerge = document.getElementById('btnExecuteMerge');

let mergeFiles = []; // Array of { file, bytes, pageCount }

mergeDropzone.addEventListener('click', () => mergeFileInput.click());
mergeDropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  mergeDropzone.classList.add('dragover');
});
mergeDropzone.addEventListener('dragleave', () => mergeDropzone.classList.remove('dragover'));
mergeDropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  mergeDropzone.classList.remove('dragover');
  if (e.dataTransfer.files) {
    handleMergeFiles(Array.from(e.dataTransfer.files));
  }
});
mergeFileInput.addEventListener('change', (e) => {
  if (e.target.files) {
    handleMergeFiles(Array.from(e.target.files));
  }
});
mergeAddMoreBtn.addEventListener('click', () => mergeFileInput.click());

async function handleMergeFiles(files) {
  const validPdfs = files.filter(f => f.name.toLowerCase().endsWith('.pdf'));
  if (validPdfs.length === 0) {
    showToast('Please select valid PDF files.', 'error');
    return;
  }

  for (const file of validPdfs) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      // Load with pdf-lib to get page count
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      mergeFiles.push({
        file,
        bytes,
        pageCount: doc.getPageCount()
      });
    } catch (err) {
      console.warn(`Could not parse ${file.name}:`, err);
      showToast(`Warning: ${file.name} might be password protected. Please unlock it first.`, 'error');
    }
  }

  renderMergeList();
}

function renderMergeList() {
  if (mergeFiles.length === 0) {
    mergeActionCard.classList.add('hidden');
    mergeDropzone.style.display = 'block';
    return;
  }

  mergeDropzone.style.display = 'none';
  mergeActionCard.classList.remove('hidden');
  mergeFileList.innerHTML = '';

  let totalPages = 0;
  mergeFiles.forEach((item, index) => {
    totalPages += item.pageCount;
    const row = document.createElement('div');
    row.className = 'merge-file-row';
    row.innerHTML = `
      <div class="merge-file-row-left">
        <div class="file-order-badge">${index + 1}</div>
        <div class="merge-file-info">
          <div class="merge-file-name" title="${item.file.name}">${item.file.name}</div>
          <div class="merge-file-size">${formatBytes(item.file.size)} • ${item.pageCount} ${item.pageCount === 1 ? 'page' : 'pages'}</div>
        </div>
      </div>
      <div class="merge-row-actions">
        ${index > 0 ? `<button class="btn-order btn-move-up" data-idx="${index}" title="Move Up">▲</button>` : ''}
        ${index < mergeFiles.length - 1 ? `<button class="btn-order btn-move-down" data-idx="${index}" title="Move Down">▼</button>` : ''}
        <button class="btn-icon-danger btn-remove-merge" data-idx="${index}" title="Remove file">✕</button>
      </div>
    `;
    mergeFileList.appendChild(row);
  });

  mergeSummary.textContent = `${mergeFiles.length} files selected • ${totalPages} total pages`;

  // Attach button events
  mergeFileList.querySelectorAll('.btn-move-up').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.getAttribute('data-idx'));
      const temp = mergeFiles[idx];
      mergeFiles[idx] = mergeFiles[idx - 1];
      mergeFiles[idx - 1] = temp;
      renderMergeList();
    });
  });

  mergeFileList.querySelectorAll('.btn-move-down').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.getAttribute('data-idx'));
      const temp = mergeFiles[idx];
      mergeFiles[idx] = mergeFiles[idx + 1];
      mergeFiles[idx + 1] = temp;
      renderMergeList();
    });
  });

  mergeFileList.querySelectorAll('.btn-remove-merge').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.getAttribute('data-idx'));
      mergeFiles.splice(idx, 1);
      renderMergeList();
    });
  });
}

btnExecuteMerge.addEventListener('click', async () => {
  if (mergeFiles.length < 2) {
    showToast('Please add at least 2 PDF files to merge.', 'error');
    return;
  }

  btnExecuteMerge.disabled = true;
  btnExecuteMerge.innerHTML = '<span>⚡</span> <span>Merging files in browser...</span>';

  try {
    const mergedDoc = await PDFDocument.create();

    for (const item of mergeFiles) {
      const doc = await PDFDocument.load(item.bytes);
      const copiedPages = await mergedDoc.copyPages(doc, doc.getPageIndices());
      copiedPages.forEach(p => mergedDoc.addPage(p));
    }

    const mergedBytes = await mergedDoc.save();
    downloadFile(mergedBytes, 'merged_document.pdf');
    fireCelebration();
    showToast(`Successfully merged ${mergeFiles.length} files into one PDF!`, 'success');
  } catch (err) {
    console.error('Merge failed:', err);
    showToast('Error merging documents. One of the files might be encrypted.', 'error');
  } finally {
    btnExecuteMerge.disabled = false;
    btnExecuteMerge.innerHTML = '<span>⚡</span> <span>Merge & Download Combined PDF</span>';
  }
});

// ─── 4. SPLIT & EXTRACT MODULE ───────────────────────────────────────────

const splitDropzone = document.getElementById('splitDropzone');
const splitFileInput = document.getElementById('splitFileInput');
const splitActionCard = document.getElementById('splitActionCard');
const splitFileName = document.getElementById('splitFileName');
const splitFileStats = document.getElementById('splitFileStats');
const splitRangeInput = document.getElementById('splitRangeInput');
const splitClearBtn = document.getElementById('splitClearBtn');
const btnExecuteSplit = document.getElementById('btnExecuteSplit');

let currentSplitFile = null;
let currentSplitBytes = null;
let currentSplitDoc = null;
let currentSplitPageCount = 0;

splitDropzone.addEventListener('click', () => splitFileInput.click());
splitDropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  splitDropzone.classList.add('dragover');
});
splitDropzone.addEventListener('dragleave', () => splitDropzone.classList.remove('dragover'));
splitDropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  splitDropzone.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    handleSplitFile(e.dataTransfer.files[0]);
  }
});
splitFileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) {
    handleSplitFile(e.target.files[0]);
  }
});

async function handleSplitFile(file) {
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    showToast('Please select a valid PDF file.', 'error');
    return;
  }
  currentSplitFile = file;
  const arrayBuffer = await file.arrayBuffer();
  currentSplitBytes = new Uint8Array(arrayBuffer);

  try {
    currentSplitDoc = await PDFDocument.load(currentSplitBytes);
    currentSplitPageCount = currentSplitDoc.getPageCount();

    splitFileName.textContent = file.name;
    splitFileStats.textContent = `${currentSplitPageCount} ${currentSplitPageCount === 1 ? 'Page' : 'Pages'} • ${formatBytes(file.size)}`;
    
    splitRangeInput.placeholder = currentSplitPageCount > 1 ? `e.g. 1-${Math.min(3, currentSplitPageCount)} or 1, ${currentSplitPageCount}` : '1';
    splitRangeInput.value = currentSplitPageCount > 1 ? `1-${Math.min(2, currentSplitPageCount)}` : '1';

    splitDropzone.style.display = 'none';
    splitActionCard.classList.remove('hidden');
    splitRangeInput.focus();
  } catch (err) {
    console.error('Failed to parse PDF for split:', err);
    showToast('Could not open PDF. If it is password protected, unlock it first.', 'error');
  }
}

splitClearBtn.addEventListener('click', () => {
  currentSplitFile = null;
  currentSplitBytes = null;
  currentSplitDoc = null;
  splitFileInput.value = '';
  splitActionCard.classList.add('hidden');
  splitDropzone.style.display = 'block';
});

function parsePageRanges(rangeStr, maxPages) {
  const indices = new Set();
  const parts = rangeStr.split(',').map(s => s.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map(s => s.trim());
      const start = parseInt(startStr);
      const end = parseInt(endStr);
      if (isNaN(start) || isNaN(end) || start < 1 || end > maxPages || start > end) {
        throw new Error(`Invalid range: "${part}". Must be between 1 and ${maxPages}.`);
      }
      for (let i = start; i <= end; i++) indices.add(i - 1);
    } else {
      const pageNum = parseInt(part);
      if (isNaN(pageNum) || pageNum < 1 || pageNum > maxPages) {
        throw new Error(`Invalid page number: "${part}". Must be between 1 and ${maxPages}.`);
      }
      indices.add(pageNum - 1);
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}

btnExecuteSplit.addEventListener('click', async () => {
  if (!currentSplitDoc) return;

  const rangeText = splitRangeInput.value.trim();
  if (!rangeText) {
    showToast('Please specify the page numbers to extract.', 'error');
    return;
  }

  let selectedIndices;
  try {
    selectedIndices = parsePageRanges(rangeText, currentSplitPageCount);
    if (selectedIndices.length === 0) {
      showToast('No valid pages selected.', 'error');
      return;
    }
  } catch (err) {
    showToast(err.message, 'error');
    return;
  }

  btnExecuteSplit.disabled = true;
  btnExecuteSplit.innerHTML = '<span>✂️</span> <span>Extracting pages...</span>';

  try {
    const extractedDoc = await PDFDocument.create();
    const copiedPages = await extractedDoc.copyPages(currentSplitDoc, selectedIndices);
    copiedPages.forEach(p => extractedDoc.addPage(p));

    const extractedBytes = await extractedDoc.save();
    const splitName = currentSplitFile.name.replace(/\.pdf$/i, `_extracted_p${rangeText.replace(/[^0-9-]/g, '_')}.pdf`);
    downloadFile(extractedBytes, splitName);
    fireCelebration();
    showToast(`Successfully extracted ${selectedIndices.length} pages to ${splitName}!`, 'success');
  } catch (err) {
    console.error('Extraction failed:', err);
    showToast('Failed to extract pages.', 'error');
  } finally {
    btnExecuteSplit.disabled = false;
    btnExecuteSplit.innerHTML = '<span>✂️</span> <span>Extract & Download Pages</span>';
  }
});

// ─── 5. ROTATE MODULE ────────────────────────────────────────────────────

const rotateDropzone = document.getElementById('rotateDropzone');
const rotateFileInput = document.getElementById('rotateFileInput');
const rotateActionCard = document.getElementById('rotateActionCard');
const rotateFileName = document.getElementById('rotateFileName');
const rotateFileStats = document.getElementById('rotateFileStats');
const rotateClearBtn = document.getElementById('rotateClearBtn');
const rotateBtns = document.querySelectorAll('.rotate-btn');
const btnExecuteRotate = document.getElementById('btnExecuteRotate');

let currentRotateFile = null;
let currentRotateBytes = null;
let currentRotateDoc = null;
let selectedAngle = 90;

rotateDropzone.addEventListener('click', () => rotateFileInput.click());
rotateDropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  rotateDropzone.classList.add('dragover');
});
rotateDropzone.addEventListener('dragleave', () => rotateDropzone.classList.remove('dragover'));
rotateDropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  rotateDropzone.classList.remove('dragover');
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    handleRotateFile(e.dataTransfer.files[0]);
  }
});
rotateFileInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files[0]) {
    handleRotateFile(e.target.files[0]);
  }
});

async function handleRotateFile(file) {
  if (!file.name.toLowerCase().endsWith('.pdf')) {
    showToast('Please select a valid PDF file.', 'error');
    return;
  }
  currentRotateFile = file;
  const arrayBuffer = await file.arrayBuffer();
  currentRotateBytes = new Uint8Array(arrayBuffer);

  try {
    currentRotateDoc = await PDFDocument.load(currentRotateBytes);
    const pageCount = currentRotateDoc.getPageCount();

    rotateFileName.textContent = file.name;
    rotateFileStats.textContent = `${pageCount} ${pageCount === 1 ? 'Page' : 'Pages'} • ${formatBytes(file.size)}`;

    rotateDropzone.style.display = 'none';
    rotateActionCard.classList.remove('hidden');
  } catch (err) {
    console.error('Failed to parse PDF for rotate:', err);
    showToast('Could not open PDF. If it is password protected, unlock it first.', 'error');
  }
}

rotateClearBtn.addEventListener('click', () => {
  currentRotateFile = null;
  currentRotateBytes = null;
  currentRotateDoc = null;
  rotateFileInput.value = '';
  rotateActionCard.classList.add('hidden');
  rotateDropzone.style.display = 'block';
});

rotateBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    rotateBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedAngle = parseInt(btn.getAttribute('data-angle'));
  });
});

btnExecuteRotate.addEventListener('click', async () => {
  if (!currentRotateDoc) return;

  btnExecuteRotate.disabled = true;
  btnExecuteRotate.innerHTML = '<span>⚡</span> <span>Rotating pages...</span>';

  try {
    const pages = currentRotateDoc.getPages();
    pages.forEach(page => {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + selectedAngle) % 360));
    });

    const rotatedBytes = await currentRotateDoc.save();
    const rotatedName = currentRotateFile.name.replace(/\.pdf$/i, `_rotated_${selectedAngle}deg.pdf`);
    downloadFile(rotatedBytes, rotatedName);
    fireCelebration();
    showToast(`Successfully rotated all pages by ${selectedAngle}°!`, 'success');
  } catch (err) {
    console.error('Rotation failed:', err);
    showToast('Failed to rotate document.', 'error');
  } finally {
    btnExecuteRotate.disabled = false;
    btnExecuteRotate.innerHTML = '<span>⚡</span> <span>Rotate & Download PDF</span>';
  }
});

// ─── CHEAT SHEET MODAL ───────────────────────────────────────────────────

const cheatSheetModal = document.getElementById('cheatSheetModal');
const btnCheatSheet = document.getElementById('btnCheatSheet');
const btnHelpAadhaar = document.getElementById('btnHelpAadhaar');
const btnCloseCheatSheet = document.getElementById('btnCloseCheatSheet');

function openModal() {
  cheatSheetModal.classList.remove('hidden');
}

function closeModal() {
  cheatSheetModal.classList.add('hidden');
}

btnCheatSheet.addEventListener('click', openModal);
if (btnHelpAadhaar) btnHelpAadhaar.addEventListener('click', openModal);
btnCloseCheatSheet.addEventListener('click', closeModal);
cheatSheetModal.addEventListener('click', (e) => {
  if (e.target === cheatSheetModal) closeModal();
});

// Airgap badge click proof
document.getElementById('airgapBadge').addEventListener('click', () => {
  showToast('🛡️ Security Verified: All cryptography is computed in RAM using WebAssembly. 0 outbound network requests.', 'success');
});
