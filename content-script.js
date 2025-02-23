chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'AUTO_FILL_CREDENTIALS') {
        console.log('Received credentials. Auto-filling...');
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
        console.log('Password filled. Processing captcha...');
        handleCaptcha();
    }
}

async function handleCaptcha() {
    const captchaImage = document.getElementById('imgCaptcha');
    if (!captchaImage) {
        console.error('Captcha image not found');
        return;
    }
    if (!captchaImage.complete || captchaImage.naturalWidth === 0) {
        console.error('CAPTCHA image is not fully loaded');
        return;
    }

    try {
        const blob = await imageToBlob(captchaImage);
        const formData = new FormData();
        formData.append('image', blob, 'captcha.png');
        console.log([...formData.entries()]);

        const response = await fetch('https://captcha-zygk.onrender.com/solve-captcha', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const result = await response.json();
        console.log("Result:", result);
        const captchaField = document.getElementById('txtcaptcha');
        if (captchaField) {
            if (!result.captcha) {
                throw new Error('Invalid API response: captcha not found');
            }
            console.log('Captcha solved:', result.captcha);
            captchaField.value = result.captcha;
            document.getElementById('btnLogin').click();
        }
    } catch (error) {
        console.error('Captcha processing failed:', error);
    }
}

function imageToBlob(imgElement) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = imgElement.naturalWidth;
        canvas.height = imgElement.naturalHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(imgElement, 0, 0);
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to convert image to Blob'));
            }
        }, 'image/png'); 
    });
}

chrome.storage.local.get(['uid', 'password'], (data) => {
    if (data.uid && data.password) {
        autoFillCredentials(data.uid, data.password);
    } else {
        console.error('No credentials found in storage');
    }
});