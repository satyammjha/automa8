console.log('[CUCHD Extension] Background script started.');
setInterval(() => {
  console.log('[CUCHD Extension] Sending keep-alive request...');
  fetch('https://students.cuchd.in/dashboard.aspx', {
    credentials: 'include'
  }).then(response => {
    if (response.ok) {
      console.log('[CUCHD Extension] Keep-alive request successful.');
    } else {
      console.error('[CUCHD Extension] Keep-alive request failed:', response.status);
    }
  }).catch((error) => {
    console.error('[CUCHD Extension] Keep-alive error:', error);
  });
}, 300000);

chrome.cookies.onChanged.addListener((changeInfo) => {
  if (changeInfo.cookie.name === 'UIMSLoginCookie' && !changeInfo.removed) {
    console.log('[CUCHD Extension] Detected UIMSLoginCookie update.');
    chrome.storage.local.set({ UIMSLoginCookie: changeInfo.cookie.value }, () => {
      console.log('[CUCHD Extension] Saved UIMSLoginCookie to storage.');
    });
  }
});
chrome.storage.local.get(['UIMSLoginCookie'], (data) => {
  if (data.UIMSLoginCookie) {
    console.log('[CUCHD Extension] Found stored UIMSLoginCookie. Injecting...');
    chrome.cookies.set({
      url: 'https://students.cuchd.in/',
      name: 'UIMSLoginCookie',
      value: data.UIMSLoginCookie,
      expirationDate: new Date('2025-02-20').getTime() / 1000
    }, (cookie) => {
      if (cookie) {
        console.log('[CUCHD Extension] Cookie injected successfully.');
      } else {
        console.error('[CUCHD Extension] Failed to inject cookie.');
      }
    });
  } else {
    console.log('[CUCHD Extension] No stored UIMSLoginCookie found.');
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    chrome.tabs.query({ url: 'https://students.cuchd.in/*' }, (tabs) => {
      if (tabs.length === 0) {
        chrome.tabs.create({ url: 'https://students.cuchd.in/', active: false });
      }
    });
  });