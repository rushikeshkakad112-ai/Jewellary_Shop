// ...existing code...
// Simple Try-On script: start/stop camera, overlay drag and scale, capture

(() => {
  const tryOnBtn = document.getElementById('tryOnBtn');
  if (!tryOnBtn) return;

  const modal = document.getElementById('tryOnModal');
  const video = document.getElementById('tryonVideo');
  const overlay = document.getElementById('tryonOverlay');
  const startBtn = document.getElementById('tryonStart');
  const stopBtn = document.getElementById('tryonStop');
  const captureBtn = document.getElementById('tryonCapture');
  const downloadLink = document.getElementById('tryonDownload');
  const closeBtn = document.getElementById('tryOnClose');
  const canvas = document.getElementById('tryonCanvas');

  let stream = null;
  let isDragging = false;
  let startX = 0, startY = 0;
  let offsetX = 0, offsetY = 0;
  let scale = 1;

  function openModal() {
    const imgUrl = tryOnBtn.dataset.imageUrl;
    overlay.src = imgUrl;
    overlay.style.transform = 'translate(0px,0px) scale(1)';
    offsetX = 0; offsetY = 0; scale = 1;
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
  }
  function closeModal() {
    stopCamera();
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    downloadLink.style.display = 'none';
  }

  function startCamera() {
    if (stream) return;
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(s => {
        stream = s;
        video.srcObject = s;
        video.play();
      }).catch(err => {
        alert('Camera access denied or not available: ' + err.message);
      });
  }

  function stopCamera() {
    if (!stream) return;
    stream.getTracks().forEach(t => t.stop());
    stream = null;
    video.pause();
    video.srcObject = null;
  }

  // Drag handlers
  overlay.addEventListener('pointerdown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    overlay.setPointerCapture(e.pointerId);
  });
  overlay.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    startX = e.clientX;
    startY = e.clientY;
    offsetX += dx;
    offsetY += dy;
    overlay.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  });
  overlay.addEventListener('pointerup', (e) => {
    isDragging = false;
    try { overlay.releasePointerCapture(e.pointerId); } catch (ex) {}
  });
  overlay.addEventListener('pointercancel', () => isDragging = false);

  // Wheel to resize overlay
  overlay.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = -e.deltaY;
    const factor = delta > 0 ? 1.05 : 0.95;
    scale = Math.max(0.1, Math.min(5, scale * factor));
    overlay.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
  });

  captureBtn.addEventListener('click', () => {
    if (!video.videoWidth) return alert('Start the camera first.');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    // draw video
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // compute overlay position on canvas
    const videoRect = video.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();
    const sx = (overlayRect.left - videoRect.left) / videoRect.width * canvas.width;
    const sy = (overlayRect.top - videoRect.top) / videoRect.height * canvas.height;
    const sWidth = overlayRect.width / videoRect.width * canvas.width;
    const sHeight = overlayRect.height / videoRect.height * canvas.height;

    // draw overlay respecting its current opacity and transform
    const tempImg = new Image();
    tempImg.crossOrigin = 'anonymous';
    tempImg.onload = () => {
      ctx.drawImage(tempImg, sx, sy, sWidth, sHeight);
      const dataURL = canvas.toDataURL('image/png');
      downloadLink.href = dataURL;
      downloadLink.style.display = 'inline-block';
      // open in new tab for quick preview
      window.open(dataURL);
    };
    tempImg.src = overlay.src;
  });

  startBtn.addEventListener('click', startCamera);
  stopBtn.addEventListener('click', stopCamera);
  tryOnBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);

  // cleanup on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display !== 'none') closeModal();
  });
})();