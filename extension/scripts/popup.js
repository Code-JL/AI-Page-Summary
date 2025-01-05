document.addEventListener('DOMContentLoaded', () => {
    const sentenceInput = document.getElementById('sentenceCount');
    const autoSummarize = document.getElementById('autoSummarize');
    const summaryButton = document.getElementById('getSummary');
    const summaryText = document.getElementById('summaryText');
    const loading = document.getElementById('loading');

    // Load saved settings
    chrome.storage.sync.get(['autoSummarize', 'sentenceCount'], (result) => {
        autoSummarize.checked = result.autoSummarize || false;
        sentenceInput.value = result.sentenceCount || 3;
    });

    // Save settings changes
    sentenceInput.addEventListener('change', () => {
        chrome.storage.sync.set({sentenceCount: sentenceInput.value});
    });

    autoSummarize.addEventListener('change', () => {
        chrome.storage.sync.set({autoSummarize: autoSummarize.checked});
    });

    summaryButton.addEventListener('click', async () => {
        loading.classList.remove('hidden');
        summaryText.textContent = '';
        
        const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
        chrome.tabs.sendMessage(tab.id, {action: "getContent"}, async (response) => {
            const summary = await getSummary(response.content);
            loading.classList.add('hidden');
            summaryText.textContent = summary;
        });
    });
});
