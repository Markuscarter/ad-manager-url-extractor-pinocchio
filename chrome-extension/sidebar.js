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
        if (event.data.action === 'extractUrls') {
            const urls = extractUrlsFromPage();
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({ action: 'urlUpdate', urls: urls }, '*');
            }
        }
    });

    function extractUrlsFromPage() {
        // Optimized and safer URL extraction
        const urls = new Set();
        try {
            const anchors = document.querySelectorAll('a[href]');
            for (let i = 0; i < anchors.length; i++) {
                const url = anchors[i].href;
                if (url.startsWith('http')) {
                    urls.add(url);
                }
            }
        } catch (error) {
            console.error('Pinocchio extraction error:', error);
        }
        return Array.from(urls);
    }
})(); 