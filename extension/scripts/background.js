/**
 * @fileoverview Background script for the Article Summarizer Chrome Extension
 * Handles content summarization using the Hugging Face API and manages browser events
 * @author Code-JL
 * @version 1.0.0
 */

// API Configuration Constants
const HF_API_KEY = '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';
const MODEL_URL = 'https://api-inference.huggingface.co/models/facebook/bart-large-cnn';
const MAX_HISTORY_ITEMS = 10;

// Default Extension Settings
let settings = {
    autoSummarize: false,
    sentenceCount: 3
};

// Initialize settings from storage
chrome.storage.sync.get(['autoSummarize', 'sentenceCount'], (result) => {
    settings = {...settings, ...result};
});

/**
 * Adds a summary to the extension's history
 * @param {string} url - The URL of the summarized page
 * @param {string} summary - The generated summary text
 * @returns {Promise<void>}
 */
async function addToHistory(url, summary) {
    const { summaryHistory = [] } = await chrome.storage.local.get('summaryHistory');
    const newHistory = [{
        url,
        summary,
        timestamp: Date.now()
    }, ...summaryHistory].slice(0, MAX_HISTORY_ITEMS);
    
    await chrome.storage.local.set({ summaryHistory: newHistory });
}

/**
 * Checks if a URL is allowed for summarization
 * @param {string} url - The URL to check
 * @returns {boolean} - Whether the URL is allowed
 */
function isAllowedUrl(url) {
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

// Tab update event listener
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && isAllowedUrl(tab.url)) {
        chrome.windows.getCurrent().then(window => {
            if (window && window.focused) {
                // Inject content script and handle auto-summarization
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

// Message listener for summarization requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "summarize") {
        summarizeContent(request.content);
    }
});

/**
 * Retrieves page content from a specific tab
 * @param {number} tabId - The ID of the tab to get content from
 * @returns {Promise<string>} - The page content
 * @throws {Error} - If content retrieval fails
 */
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

/**
 * Summarizes the provided content using the Hugging Face API
 * @param {string} content - The content to summarize
 * @returns {Promise<void>}
 */
async function summarizeContent(content) {
    try {
        const storageData = await chrome.storage.sync.get(['sentenceCount']);
        const targetSentences = storageData.sentenceCount || 3;
        
        // Make API request to Hugging Face
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

        // Process and format the summary
        const apiResult = await response.json();
        const sentences = apiResult[0].summary_text.match(/[^.!?]+[.!?]+/g) || [];
        const limitedSummary = sentences.slice(0, targetSentences).join(' ');
        
        // Save to history and update UI
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await addToHistory(tab.url, limitedSummary);

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

/**
 * Initiates the summarization process for a specific tab
 * @param {number} tabId - The ID of the tab to summarize
 * @returns {Promise<void>}
 */
async function summarizePage(tabId) {
    const content = await getPageContent(tabId);
    await summarizeContent(content);
}
