
console.log('[CUCHD Extension] Background script started.');

let isCookieProcessing = false;

chrome.cookies.onChanged.addListener((changeInfo) => {
    if (changeInfo.cookie.name === 'UIMSLoginCookie' && !changeInfo.removed) {
        console.log('[CUCHD] Detected valid UIMSLoginCookie');
        if (changeInfo.cookie.domain === 'students.cuchd.in' &&
            changeInfo.cookie.path === '/') {
            chrome.storage.local.get(['latestCookie'], (result) => {
                const existingCookie = result.latestCookie;

                if (!existingCookie ||
                    new Date(changeInfo.cookie.expirationDate * 1000) >
                    new Date(existingCookie.expirationDate * 1000)) {

                    const cookieData = {
                        value: changeInfo.cookie.value,
                        expirationDate: changeInfo.cookie.expirationDate,
                        secure: changeInfo.cookie.secure,
                        httpOnly: changeInfo.cookie.httpOnly
                    };

                    chrome.storage.local.set({ latestCookie: cookieData }, () => {
                        console.log('[CUCHD] Stored latest cookie:', {
                            value: cookieData.value.substr(0, 10) + '...',
                            expires: new Date(cookieData.expirationDate * 1000).toISOString()
                        });
                    });
                }
            });
        }
    }
});
async function injectSessionCookies() {
    const { latestCookie } = await chrome.storage.local.get(['latestCookie']);

    if (!latestCookie) return;

    try {
        await chrome.cookies.remove({
            url: 'https://students.cuchd.in/',
            name: 'UIMSLoginCookie'
        });

        await chrome.cookies.set({
            url: 'https://students.cuchd.in/',
            name: 'UIMSLoginCookie',
            value: latestCookie.value,
            expirationDate: latestCookie.expirationDate,
            secure: latestCookie.secure,
            httpOnly: latestCookie.httpOnly,
            path: '/'
        });

        console.log('[CUCHD] Successfully injected latest cookie');
    } catch (error) {
        console.error('[CUCHD] Cookie injection failed:', error);
    }
}

chrome.webNavigation.onCompleted.addListener((details) => {
    if (details.url.startsWith('https://students.cuchd.in/')) {
        injectSessionCookies();
    }
});

chrome.alarms.create('sessionMaintenance', { periodInMinutes: 4.5 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'sessionMaintenance') {
        try {
            const response = await fetch('https://students.cuchd.in/api/heartbeat', {
                credentials: 'include',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                console.warn('[CUCHD] Session refresh needed');
                await injectSessionCookies();
            }
        } catch (error) {
            console.error('[CUCHD] Maintenance error:', error);
        }
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.url?.startsWith('https://students.cuchd.in/') &&
        changeInfo.status === 'complete') {
        chrome.scripting.executeScript({
            target: { tabId },
            files: ['sessionMonitor.js']
        });
    }
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SESSION_STATE_UPDATE') {
        console.log('[CUCHD] Session state:', message.state);
    }
});