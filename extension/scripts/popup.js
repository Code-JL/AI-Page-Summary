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

    summaryButton.addEventListener('click', () => {
        loading.classList.remove('hidden');
        summaryText.textContent = '';
        
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const tab = tabs[0];
            // First inject the content script to ensure it's there
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['/scripts/content.js']
            }).then(() => {
                // Now send the message after ensuring content script is loaded
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
