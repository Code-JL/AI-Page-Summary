function getPageContent() {
    const article = document.querySelector('article') || document.body;
    const text = article.innerText;
    return text.substring(0, 5000);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getContent") {
        sendResponse({content: getPageContent()});
    }
    return true;
});
