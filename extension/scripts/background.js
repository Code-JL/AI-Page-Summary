const HF_API_KEY = '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';
const MODEL_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';

let settings = {
    autoSummarize: false,
    sentenceCount: 3
};

chrome.storage.sync.get(['autoSummarize', 'sentenceCount'], (result) => {
    settings = {...settings, ...result};
});

function isAllowedUrl(url) {
    // List of common protected URL schemes
    const protectedSchemes = [
        'chrome://',
        'chrome-extension://',
        'brave://',
        'edge://',
        'about:',
        'data:',
        'file:',
        'view-source:',
        'chrome-search://'
    ];
    
    return url && !protectedSchemes.some(scheme => url.startsWith(scheme));
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && isAllowedUrl(tab.url)) {
        chrome.windows.getCurrent().then(window => {
            if (window && window.focused) {
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['/scripts/content.js']
                }).then(() => {
                    chrome.storage.sync.get(['autoSummarize'], (result) => {
                        if (result.autoSummarize) {
                            setTimeout(() => {
                                chrome.tabs.sendMessage(tabId, {action: "getContent"}, (response) => {
                                    if (response && response.content) {
                                        summarizeContent(response.content);
                                    }
                                });
                            }, 3000);
                        }
                    });
                });
            }
        });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "summarize") {
        summarizeContent(request.content);
    }
});

async function getPageContent(tabId) {
    try {
        console.log('Requesting content from tab:', tabId);
        const response = await chrome.tabs.sendMessage(tabId, {action: "getContent"});
        console.log('Content received, length:', response.content.length);
        return response.content;
    } catch (error) {
        console.error('Error getting page content:', error);
        throw error;
    }
}

async function summarizeContent(content) {
    try {
        const storageData = await chrome.storage.sync.get(['sentenceCount']);
        const targetSentences = storageData.sentenceCount || 3;
        
        const response = await fetch(MODEL_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: content,
                parameters: {
                    max_length: targetSentences * 25,
                    min_length: targetSentences * 15,
                    length_penalty: 2.0,
                    num_beams: 4,
                    num_return_sequences: 1
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const apiResult = await response.json();
        
        // Split into sentences and limit to target count
        const sentences = apiResult[0].summary_text.match(/[^.!?]+[.!?]+/g) || [];
        const limitedSummary = sentences.slice(0, targetSentences).join(' ');
        
        chrome.runtime.sendMessage({
            action: "updateSummary", 
            summary: limitedSummary
        });
    } catch (error) {
        console.error('Summarization error:', error);
        chrome.runtime.sendMessage({
            action: "updateSummary",
            summary: "Error generating summary. Please try again."
        });
    }
}


async function summarizePage(tabId) {
    const content = await getPageContent(tabId);
    await summarizeContent(content);
}
