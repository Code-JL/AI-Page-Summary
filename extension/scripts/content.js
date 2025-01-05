function getPageContent() {
    // Target multiple content containers for better coverage
    const mainContent = 
        document.querySelector('article') || 
        document.querySelector('main') ||
        document.querySelector('.post-text') || 
        document.querySelector('#content') ||
        document.querySelector('.content') ||
        document.body;
    
    // Get clean text content
    const text = mainContent.innerText;
    
    // Return trimmed and limited content
    return text.trim().substring(0, 5000);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getContent") {
        sendResponse({content: getPageContent()});
    }
    return true;
});
