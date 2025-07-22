// sidebar.js

(function() {
    let sidebarOpen = false;
    let sidebar;
    let iframe;
    let popupReady = false;
    let urlQueue = [];

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

    function sendMessageToPopup(message) {
        if (popupReady && iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage(message, '*');
        } else {
            urlQueue.push(message);
        }
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'toggleSidebar') {
            toggleSidebar();
        }
    });

    window.addEventListener('message', async (event) => {
        if (event.data.action === 'extractUrls') {
            await extractUrlsInBatches();
        } else if (event.data.action === 'popupReady') {
            popupReady = true;
            // Send any queued messages
            while(urlQueue.length > 0) {
                sendMessageToPopup(urlQueue.shift());
            }
        }
    });

    async function extractUrlsInBatches() {
        try {
            const anchors = document.querySelectorAll('a[href]');
            const chunkSize = 100;
            let currentChunk = [];

            for (let i = 0; i < anchors.length; i++) {
                // Safety check to prevent errors on extension reload
                if (!chrome.runtime?.id) {
                    console.log("Context invalidated. Halting extraction.");
                    return;
                }

                const anchor = anchors[i];
                if (anchor.href && anchor.href.startsWith('http')) {
                    currentChunk.push(anchor.href);
                }

                if (currentChunk.length >= chunkSize || (i === anchors.length - 1 && currentChunk.length > 0)) {
                    sendMessageToPopup({ action: 'urlUpdate', urls: currentChunk });
                    currentChunk = [];
                    // Yield to the main thread
                    await new Promise(resolve => setTimeout(resolve, 50)); 
                }
            }

            if (currentChunk.length > 0) {
                sendMessageToPopup({ action: 'urlUpdate', urls: currentChunk });
            }

            sendMessageToPopup({ action: 'extractionComplete' });
        } catch (error) {
            console.error('Pinocchio extraction error:', error);
        }
    }
})(); 