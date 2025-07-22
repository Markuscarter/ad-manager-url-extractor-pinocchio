// sidebar.js

(function() {
    let sidebarOpen = false;
    let sidebar;
    let iframe;

    function createSidebar() {
        sidebar = document.createElement('div');
        sidebar.id = 'pinocchio-sidebar';
        sidebar.style.position = 'fixed';
        sidebar.style.top = '0';
        sidebar.style.right = '-450px';
        sidebar.style.width = '400px';
        sidebar.style.height = '100%';
        sidebar.style.backgroundColor = '#1a1a1a';
        sidebar.style.borderLeft = '1px solid #333';
        sidebar.style.boxShadow = '-2px 0 5px rgba(0,0,0,0.5)';
        sidebar.style.zIndex = '2147483647';
        sidebar.style.transition = 'right 0.3s ease';
        
        iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.src = chrome.runtime.getURL('popup.html');
        
        sidebar.appendChild(iframe);
        document.body.appendChild(sidebar);
    }

    function toggleSidebar() {
        if (!sidebar) {
            createSidebar();
        }
        
        sidebarOpen = !sidebarOpen;
        sidebar.style.right = sidebarOpen ? '0' : '-450px';
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'toggleSidebar') {
            toggleSidebar();
        }
    });

    window.addEventListener('message', (event) => {
        console.log('[sidebar.js] Received message:', event.data);
        if (event.data.action === 'extractUrls') {
            const urls = extractUrlsFromPage();
            console.log(`[sidebar.js] Extracted ${urls.length} URLs`);
            if (iframe && iframe.contentWindow) {
                console.log('[sidebar.js] Sending urlUpdate message to iframe');
                iframe.contentWindow.postMessage({ action: 'urlUpdate', urls: urls }, '*');
            }
        }
    });

    function extractUrlsFromPage() {
        const urls = new Set();
        try {
            document.querySelectorAll('a[href]').forEach(el => {
                if (el.href.startsWith('http')) {
                    urls.add(el.href);
                }
            });
            const textContent = document.body.innerText;
            const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/g;
            const matches = textContent.match(urlRegex);
            if (matches) {
                matches.forEach(url => urls.add(url));
            }
        } catch (error) {
            console.error('[sidebar.js] Extraction error:', error);
        }
        return Array.from(urls);
    }
})(); 