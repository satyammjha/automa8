
document.getElementById('save').addEventListener('click', async () => {
    const uid = document.getElementById('uid').value;
    const password = document.getElementById('password').value;
  
    chrome.storage.local.set({ uid, password: password }, async () => {
      console.log('Credentials saved!');
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, { 
        action: 'AUTO_FILL_CREDENTIALS',
        uid,
        password:password
      });
  
      window.close();
    });
  });