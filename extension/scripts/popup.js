document.addEventListener('DOMContentLoaded', () => {
    const sentenceInput = document.getElementById('sentenceCount');
    const autoSummarize = document.getElementById('autoSummarize');
    const copyButton = document.getElementById('copyButton');
    const summaryButton = document.getElementById('getSummary');
    const summaryText = document.getElementById('summaryText');
    const loading = document.getElementById('loading');
    const themeToggle = document.getElementById('themeToggle');

    function updateIcons(theme) {
        const icons = document.querySelectorAll('img[data-icon]');
        icons.forEach(icon => {
            const iconName = icon.getAttribute('data-icon');
            icon.src = `/icons/${iconName}16-${theme}.png`;
        });
    }
    

    chrome.storage.sync.get(['autoSummarize', 'sentenceCount', 'theme'], (result) => {
        autoSummarize.checked = result.autoSummarize || false;
        sentenceInput.value = result.sentenceCount || 3;
        if (result.theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            updateIcons('dark');
        }
    });

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        chrome.storage.sync.set({ theme: newTheme });
        updateIcons(newTheme);
    });

    sentenceInput.addEventListener('change', () => {
        chrome.storage.sync.set({sentenceCount: sentenceInput.value});
    });

    autoSummarize.addEventListener('change', () => {
        chrome.storage.sync.set({autoSummarize: autoSummarize.checked});
    });

    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === "updateSummary") {
            loading.classList.add('hidden');
            summaryText.textContent = request.summary;
        }
    });

    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(summaryText.textContent)
            .then(() => {
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.innerHTML = `<img src="/icons/copy16-${document.documentElement.getAttribute('data-theme')}.png" data-icon="copy" alt="Copy" width="16" height="16"> Copy Summary`;
                }, 2000);
            });
    });

    summaryButton.addEventListener('click', () => {
        loading.classList.remove('hidden');
        summaryText.textContent = '';
        
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const tab = tabs[0];
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['/scripts/content.js']
            }).then(() => {
                chrome.tabs.sendMessage(tab.id, {action: "getContent"}, (response) => {
                    if (chrome.runtime.lastError) {
                        summaryText.textContent = "Please refresh the page and try again.";
                        loading.classList.add('hidden');
                        return;
                    }
                    if (response && response.content) {
                        chrome.runtime.sendMessage({
                            action: "summarize",
                            content: response.content
                        });
                    }
                });
            });
        });
    });    
});
