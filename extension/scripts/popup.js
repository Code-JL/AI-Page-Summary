document.addEventListener('DOMContentLoaded', () => {
    const sentenceInput = document.getElementById('sentenceCount');
    const autoSummarize = document.getElementById('autoSummarize');
    const summaryButton = document.getElementById('getSummary');
    const summaryText = document.getElementById('summaryText');
    const loading = document.getElementById('loading');

    chrome.storage.sync.get(['autoSummarize', 'sentenceCount'], (result) => {
        autoSummarize.checked = result.autoSummarize || false;
        sentenceInput.value = result.sentenceCount || 3;
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

    summaryButton.addEventListener('click', async () => {
        loading.classList.remove('hidden');
        summaryText.textContent = '';
        
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        chrome.tabs.sendMessage(tab.id, {action: "getContent"}, async (response) => {
            if (response && response.content) {
                chrome.runtime.sendMessage({
                    action: "summarize",
                    content: response.content
                });
            }
        });
    });
});
