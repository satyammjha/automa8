document.addEventListener('DOMContentLoaded', async () => {
  const uidInput = document.getElementById('uid');
  const passwordInput = document.getElementById('password');
  const saveButton = document.getElementById('save');
  const deleteButton = document.getElementById('delete');
  const messageBox = document.getElementById('message');
  const homeBtn = document.getElementById('homeBtn');

  if (!uidInput || !passwordInput || !saveButton || !deleteButton || !messageBox) {
    console.error('❌ One or more elements are missing from the popup.');
    return;
  }
  chrome.storage.local.get(['uid', 'password'], (data) => {
    if (data.uid) {
      messageBox.innerHTML = `✅ Credentials stored for <strong>${data.uid}</strong>`;
      uidInput.value = data.uid;
      passwordInput.value = data.password;
    } else {
      messageBox.innerHTML = '❌ No credentials saved.';
    }
  });


  homeBtn.addEventListener("click", async () => {
    const url = "https://students.cuchd.in/Login.aspx";

    let [tab] = await chrome.tabs.query({ url });

    if (tab) {
      await chrome.tabs.update(tab.id, { active: true });
    } else {
      tab = await chrome.tabs.create({ url });
    }

    setTimeout(() => {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content-script.js"]
      }).catch(err => console.error("❌ Error injecting script:", err));
    }, 3000);
  });


  saveButton.addEventListener('click', async () => {
    const uid = uidInput.value;
    const password = passwordInput.value;

    if (!uid || !password) {
      alert('⚠️ Please enter both User ID and Password.');
      return;
    }

    chrome.storage.local.set({ uid, password }, async () => {
      console.log('✅ Credentials saved!');

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.tabs.sendMessage(tab.id, {
        action: 'AUTO_FILL_CREDENTIALS',
        uid,
        password
      });

      messageBox.innerHTML = `✅ Credentials stored for <strong>${uid}</strong>`;
    });
  });

  deleteButton.addEventListener('click', () => {
    chrome.storage.local.remove(['uid', 'password'], () => {
      console.log('🗑️ Credentials deleted.');
      messageBox.innerHTML = '❌ No credentials saved.';
      uidInput.value = '';
      passwordInput.value = '';
    });
  });
});