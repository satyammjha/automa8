const observer = new MutationObserver(() => {
    const sessionIndicator = document.querySelector('#sessionStatus');
    chrome.runtime.sendMessage({
      type: 'SESSION_STATE_UPDATE',
      state: sessionIndicator?.innerText || 'active'
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true
  });