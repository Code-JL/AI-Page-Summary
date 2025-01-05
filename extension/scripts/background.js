const HF_API_KEY = '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';
const MODEL_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';

let settings = {
    autoSummarize: false,
    sentenceCount: 3
};

chrome.storage.sync.get(['autoSummarize', 'sentenceCount'], (result) => {
    settings = {...settings, ...result};
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && settings.autoSummarize) {
        setTimeout(() => {
            summarizePage(tabId);
        }, 3000);
    }
});

async function getPageContent(tabId) {
    const response = await chrome.tabs.sendMessage(tabId, {action: "getContent"});
    return response.content;
}

async function summarizePage(tabId) {
    const content = await getPageContent(tabId);
    const response = await fetch(MODEL_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${HF_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            inputs: content,
            parameters: {
                max_length: settings.sentenceCount * 30,
                min_length: settings.sentenceCount * 15,
                num_return_sequences: 1
            }
        })
    });
    const result = await response.json();
    chrome.runtime.sendMessage({
        action: "updateSummary", 
        summary: result[0].summary_text
    });
}
