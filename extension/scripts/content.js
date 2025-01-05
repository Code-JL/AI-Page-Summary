function getPageContent() {
    // Target multiple content containers for better coverage
    const mainContent = 
        document.querySelector('article') || 
        document.querySelector('main') ||
        document.querySelector('.post-text') || 
        document.querySelector('#content') ||
        document.querySelector('.content') ||
        document.querySelector('.question') || // Stack Overflow specific
        document.querySelector('#answers') || // Stack Overflow specific
        document.body;
    
    // Get clean text content with logging
    const text = mainContent.innerText;
    console.log('Extracted content length:', text.length);
    
    // Return trimmed and limited content
    const processedText = text.trim().substring(0, 5000);
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
