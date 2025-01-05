function getPageContent() {
    // Score function to evaluate content quality
    function scoreContent(text) {
        const wordCount = text.split(/\s+/).length;
        const avgWordLength = text.length / wordCount;
        const hasPunctuation = /[.,!?]/.test(text);
        return wordCount * (hasPunctuation ? 1.5 : 1) * (avgWordLength > 4 ? 1.2 : 1);
    }

    // First try specific content containers
    let mainContent = 
        document.querySelector('article') || 
        document.querySelector('main') ||
        document.querySelector('.post-text') || 
        document.querySelector('#content') ||
        document.querySelector('.content');

    // If specific containers fail, find the best content using scoring
    if (!mainContent) {
        const blocks = [];
        const elements = document.body.getElementsByTagName('*');
        
        for (let element of elements) {
            const text = element.innerText;
            if (text && text.length > 100) {
                blocks.push({
                    element: element,
                    score: scoreContent(text)
                });
            }
        }

        blocks.sort((a, b) => b.score - a.score);
        mainContent = blocks[0]?.element || document.body;
    }

    // Get clean text content with logging
    const text = mainContent.innerText;
    console.log('Extracted content length:', text.length);

    // Return trimmed and enhanced content
    const processedText = text.trim()
        .replace(/\s+/g, ' ')
        .replace(/\[[0-9]*\]/g, '')
        .substring(0, 3000);
    console.log('Processed content length:', processedText.length);

    return processedText;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getContent") {
        const content = getPageContent();
        console.log('Sending content to background script');
        sendResponse({content: content});
    }
    return true;
});
