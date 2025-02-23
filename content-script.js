chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'AUTO_FILL_CREDENTIALS') {
        showOverlay('🔐 Auto-filling credentials...');
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
        showOverlay('🔄 Processing CAPTCHA...');
        handleCaptcha();
    }
}

async function handleCaptcha() {
    const captchaImage = document.getElementById('imgCaptcha');
    if (!captchaImage || !captchaImage.complete || captchaImage.naturalWidth === 0) {
        showOverlay('⚠️ CAPTCHA not found or not fully loaded!');
        return;
    }

    try {
        const blob = await imageToBlob(captchaImage);
        const formData = new FormData();
        formData.append('image', blob, 'captcha.png');
        const response = await fetch('https://captcha-zygk.onrender.com/solve-captcha', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

        const result = await response.json();
        const captchaField = document.getElementById('txtcaptcha');
        if (captchaField && result.captcha) {
            captchaField.value = result.captcha;
            showOverlay('✅ CAPTCHA solved! Logging in...');
            document.getElementById('btnLogin').click();
        } else {
            showOverlay('❌ CAPTCHA solution failed!');
        }
    } catch (error) {
        showOverlay(`🚨 Error: ${error.message}`);
    }
}

function imageToBlob(imgElement) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = imgElement.naturalWidth;
        canvas.height = imgElement.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imgElement, 0, 0);
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Failed to convert image to Blob')), 'image/png');
    });
}

chrome.storage.local.get(['uid', 'password'], (data) => {
    if (data.uid && data.password) {
        showOverlay('🔄 Auto-login in progress...');
        autoFillCredentials(data.uid, data.password);
    } else {
        showOverlay('⚠️ No credentials found!');
    }
});

function showOverlay(message) {
    let overlay = document.getElementById('auto-login-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'auto-login-overlay';
        overlay.innerHTML = `
            <div id="auto-login-box">
                <div class="loader"></div>
                <p id="auto-login-message">${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);

        const style = document.createElement('style');
        style.innerHTML = `
            #auto-login-overlay {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                padding: 20px;
                border-radius: 10px;
                color: white;
                text-align: center;
                font-size: 18px;
                z-index: 99999;
                min-width: 250px;
            }
            #auto-login-box {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }
            .loader {
                border: 4px solid rgba(255, 255, 255, 0.3);
                border-top: 4px solid #fff;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                animation: spin 1s linear infinite;
                margin-bottom: 10px;
            }
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    document.getElementById('auto-login-message').innerText = message;
    setTimeout(() => {
        if (overlay) overlay.remove();
    }, 5000);
}
