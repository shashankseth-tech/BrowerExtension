// Universal AI Explainer - Microphone Permission Handler
document.addEventListener('DOMContentLoaded', () => {
  const enableBtn = document.getElementById('enableMicBtn');
  const statusBox = document.getElementById('statusBox');

  enableBtn.addEventListener('click', async () => {
    enableBtn.disabled = true;
    enableBtn.textContent = 'Requesting permission...';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Successfully granted! Stop the stream tracks immediately.
      stream.getTracks().forEach(track => track.stop());

      await chrome.storage.local.set({ micPermissionGranted: true }).catch(() => {});

      statusBox.className = 'status-box success';
      statusBox.textContent = '✅ Microphone access granted! Returning to extension...';
      enableBtn.textContent = 'Permission Granted';

      setTimeout(() => {
        window.close();
      }, 1500);
    } catch (err) {
      console.warn('[Microphone Permission Error]', err);
      enableBtn.disabled = false;
      enableBtn.textContent = '🎙️ Allow Microphone Access';
      statusBox.className = 'status-box error';
      statusBox.textContent = 'Microphone access was denied or cancelled. Please click the lock or site settings icon in your address bar and set Microphone to "Allow".';
    }
  });
});
