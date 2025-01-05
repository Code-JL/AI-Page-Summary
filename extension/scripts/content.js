function getPageContent() {
    // First try specific content containers
    const mainContent = 
        document.querySelector('article') || 
        document.querySelector('main') ||
        document.querySelector('.post-text') || 
        document.querySelector('#content') ||
        document.querySelector('.content');

    // If specific containers fail, find the most content-rich element
    if (!mainContent) {
        const elements = document.body.getElementsByTagName('*');
        let maxLength = 0;
        let richestContent = document.body;
        
        for (let element of elements) {
            const text = element.innerText;
            if (text && text.length > maxLength) {
                maxLength = text.length;
                richestContent = element;
            }
        }
        mainContent = richestContent;
    }

    // Get clean text content with logging
    const text = mainContent.innerText;
    console.log('Extracted content length:', text.length);

    // Return trimmed and limited content
    const processedText = text.trim()
        .replace(/\s+/g, ' ')
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
