/**
 * @fileoverview Popup interface controller for the Article Summarizer Extension
 * Manages user interactions, theme switching, and summary generation
 * @version 1.0.0
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const elements = {
        sentenceInput: document.getElementById('sentenceCount'),
        autoSummarize: document.getElementById('autoSummarize'),
        copyButton: document.getElementById('copyButton'),
        summaryButton: document.getElementById('getSummary'),
        summaryText: document.getElementById('summaryText'),
        loading: document.getElementById('loading'),
        themeToggle: document.getElementById('themeToggle')
    };

    /**
     * Updates icon themes throughout the interface
     * @param {string} theme - The theme to apply ('light' or 'dark')
     */
    function updateIcons(theme) {
        const icons = document.querySelectorAll('img[data-icon]');
        icons.forEach(icon => {
            const iconName = icon.getAttribute('data-icon');
            icon.src = `/icons/${iconName}16-${theme}.png`;
        });
    }

    /**
     * Initializes the popup with stored user preferences
     */
    chrome.storage.sync.get(['autoSummarize', 'sentenceCount', 'theme'], (result) => {
        elements.autoSummarize.checked = result.autoSummarize || false;
        elements.sentenceInput.value = result.sentenceCount || 3;
        
        if (result.theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            updateIcons('dark');
        }
    });

    /**
     * Theme toggle handler
     */
    elements.themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        chrome.storage.sync.set({ theme: newTheme });
        updateIcons(newTheme);
    });

    /**
     * Settings change handlers
     */
    elements.sentenceInput.addEventListener('change', () => {
        chrome.storage.sync.set({sentenceCount: elements.sentenceInput.value});
    });

    elements.autoSummarize.addEventListener('change', () => {
        chrome.storage.sync.set({autoSummarize: elements.autoSummarize.checked});
    });

    /**
     * Summary update message handler
     */
    chrome.runtime.onMessage.addListener((request) => {
        if (request.action === "updateSummary") {
            elements.loading.classList.add('hidden');
            elements.summaryText.textContent = request.summary;
        }
    });

    /**
     * Copy button handler with visual feedback
     */
    elements.copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(elements.summaryText.textContent)
            .then(() => {
                elements.copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    const theme = document.documentElement.getAttribute('data-theme');
                    elements.copyButton.innerHTML = `<img src="/icons/copy16-${theme}.png" data-icon="copy" alt="Copy" width="16" height="16"> Copy Summary`;
                }, 2000);
            });
    });

    /**
     * Summary generation handler
     */
    elements.summaryButton.addEventListener('click', () => {
        elements.loading.classList.remove('hidden');
        elements.summaryText.textContent = '';
        
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const tab = tabs[0];
            
            // Inject content script and request summary
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['/scripts/content.js']
            }).then(() => {
                chrome.tabs.sendMessage(tab.id, {action: "getContent"}, (response) => {
                    if (chrome.runtime.lastError) {
                        elements.summaryText.textContent = "Please refresh the page and try again.";
                        elements.loading.classList.add('hidden');
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
