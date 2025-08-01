// Content script for Your DSA Buddy Chrome Extension
(function() {
    'use strict';

    // Create and inject the buddy icon
    function createBuddyIcon() {
        // Check if buddy icon already exists
        if (document.getElementById('dsa-buddy-icon')) {
            return;
        }

        const buddyIcon = document.createElement('div');
        buddyIcon.id = 'dsa-buddy-icon';
        buddyIcon.innerHTML = `
            <div class="buddy-icon-container">
                <div class="buddy-icon">🤖</div>
                <div class="buddy-tooltip">Your DSA Buddy</div>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #dsa-buddy-icon {
                position: fixed;
                top: 100px;
                right: 20px;
                z-index: 10000;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .buddy-icon-container {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .buddy-icon {
                width: 60px;
                height: 60px;
                background: linear-gradient(45deg, #667eea, #764ba2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                color: white;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                transition: all 0.3s ease;
            }
            
            .buddy-icon:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
            }
            
            .buddy-tooltip {
                position: absolute;
                top: 70px;
                background: #333;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                white-space: nowrap;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                pointer-events: none;
            }
            
            .buddy-tooltip::before {
                content: '';
                position: absolute;
                top: -5px;
                left: 50%;
                transform: translateX(-50%);
                border-left: 5px solid transparent;
                border-right: 5px solid transparent;
                border-bottom: 5px solid #333;
            }
            
            .buddy-icon-container:hover .buddy-tooltip {
                opacity: 1;
                visibility: visible;
            }
            
            .buddy-pulse {
                animation: buddyPulse 2s infinite;
            }
            
            @keyframes buddyPulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(buddyIcon);
        
        // Add click event
        buddyIcon.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openBuddyPopup();
        });
        
        // Add pulse animation after a delay
        setTimeout(() => {
            buddyIcon.querySelector('.buddy-icon').classList.add('buddy-pulse');
        }, 2000);
    }

    // Open the buddy popup
    function openBuddyPopup() {
        try {
            // Check if extension is available
            if (typeof chrome === 'undefined' || !chrome.runtime) {
                throw new Error('Extension not available');
            }
            
            // Try to open popup directly
            chrome.runtime.sendMessage({ action: 'openBuddyPopup' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log('Extension popup error:', chrome.runtime.lastError);
                    showFallbackMessage();
                }
            });
        } catch (error) {
            console.log('Extension context error:', error);
            showFallbackMessage();
        }
    }
    
    // Show fallback message
    function showFallbackMessage() {
        const message = `
🤖 Your DSA Buddy

The extension popup couldn't be opened automatically.

To use Your DSA Buddy:
1. Click the extension icon in your browser toolbar
2. Or press Ctrl+Shift+Y (if you have a keyboard shortcut set)

If the extension isn't working:
1. Go to chrome://extensions/
2. Find "Your DSA Buddy"
3. Make sure it's enabled
4. Click "Reload" if needed
        `;
        alert(message);
    }

    // Extract question information from LeetCode page
    function extractQuestionInfo() {
        const questionInfo = {
            title: '',
            description: '',
            difficulty: '',
            url: window.location.href
        };

        // Get title
        const titleElement = document.querySelector('[data-cy="question-title"]') || 
                           document.querySelector('.mr-2.text-label-1') ||
                           document.querySelector('h1');
        if (titleElement) {
            questionInfo.title = titleElement.textContent.trim();
        }

        // Get difficulty
        const difficultyElement = document.querySelector('[data-difficulty]') ||
                                document.querySelector('.difficulty-label');
        if (difficultyElement) {
            questionInfo.difficulty = difficultyElement.textContent.trim();
        }

        // Get description (first few sentences)
        const descriptionElement = document.querySelector('[data-cy="question-content"]') ||
                                 document.querySelector('.content__1YWB');
        if (descriptionElement) {
            const text = descriptionElement.textContent.trim();
            questionInfo.description = text.substring(0, 200) + (text.length > 200 ? '...' : '');
        }

        return questionInfo;
    }

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        try {
            if (request.action === 'getQuestionInfo') {
                const questionInfo = extractQuestionInfo();
                sendResponse(questionInfo);
            }
        } catch (error) {
            console.log('Message listener error:', error);
            sendResponse({ error: error.message });
        }
        return true; // Keep the message channel open for async response
    });

    // Initialize buddy icon when page loads
    function initBuddy() {
        try {
            // Wait for page to be fully loaded
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', createBuddyIcon);
            } else {
                createBuddyIcon();
            }
        } catch (error) {
            console.log('Extension initialization error:', error);
        }
    }

    // Start initialization with error handling
    try {
        initBuddy();
    } catch (error) {
        console.log('Extension startup error:', error);
    }

    // Re-initialize when navigating to different problems
    let currentUrl = window.location.href;
    setInterval(() => {
        try {
            if (window.location.href !== currentUrl) {
                currentUrl = window.location.href;
                setTimeout(createBuddyIcon, 1000); // Wait for page to load
            }
        } catch (error) {
            console.log('Navigation check error:', error);
        }
    }, 1000);

})(); 