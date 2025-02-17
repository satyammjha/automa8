
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'AUTO_FILL_CREDENTIALS') {
        console.log('Received credentials from popup. Auto-filling...');
        autoFillCredentials(message.uid, message.password);
    }
});

function autoFillCredentials(uid, password) {
    const uidField = document.getElementById('txtUserId');
    if (uidField) {
        uidField.value = uid;
        document.getElementById('btnNext').click();
    }

    const passwordField = document.getElementById('txtLoginPassword');
    if (passwordField) {
        passwordField.value = password;
        console.log('Password auto-filled from popup!');
    }
}
chrome.storage.local.get(['uid', 'password'], (data) => {
    if (data.uid && data.password) {
        autoFillCredentials(data.uid, data.password);
    }
});