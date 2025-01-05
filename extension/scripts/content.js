/**
 * @fileoverview Content script for extracting and processing webpage content
 * Implements intelligent content selection and text processing algorithms
 * @version 1.0.0
 */

/**
 * Extracts and processes the main content from the current webpage
 * @returns {string} Cleaned and processed text content
 */
function getPageContent() {
    /**
     * Evaluates the quality of text content using multiple metrics
     * @param {string} text - The text content to evaluate
     * @returns {number} A quality score for the content
     */
    function scoreContent(text) {
        const wordCount = text.split(/\s+/).length;
        const avgWordLength = text.length / wordCount;
        const hasPunctuation = /[.,!?]/.test(text);
        
        // Calculate weighted score based on multiple factors
        return wordCount * 
               (hasPunctuation ? 1.5 : 1) * // Bonus for proper punctuation
               (avgWordLength > 4 ? 1.2 : 1); // Bonus for complex words
    }

    // Priority-ordered content container selectors
    const contentSelectors = [
        'article',
        'main',
        '.post-text',
        '#content',
        '.content'
    ];

    // Attempt to find main content using predefined selectors
    let mainContent = contentSelectors
        .map(selector => document.querySelector(selector))
        .find(element => element);

    // Fallback: Use content scoring algorithm if specific containers aren't found
    if (!mainContent) {
        const blocks = [];
        const elements = document.body.getElementsByTagName('*');
        
        // Analyze all elements for potential content blocks
        for (let element of elements) {
            const text = element.innerText;
            if (text && text.length > 100) { // Filter out small text blocks
                blocks.push({
                    element: element,
                    score: scoreContent(text)
                });
            }
        }

        // Select highest-scoring content block
        blocks.sort((a, b) => b.score - a.score);
        mainContent = blocks[0]?.element || document.body;
    }

    // Extract raw text content
    const text = mainContent.innerText;
    console.log('Extracted content length:', text.length);

    // Process and clean the content
    const processedText = text.trim()
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/\[[0-9]*\]/g, '') // Remove reference numbers
        .substring(0, 3000); // Limit content length
    
    console.log('Processed content length:', processedText.length);

    return processedText;
}

// Message listener for content extraction requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getContent") {
        const content = getPageContent();
        console.log('Sending content to background script');
        sendResponse({content: content});
    }
    return true; // Keep message channel open for async response
});
