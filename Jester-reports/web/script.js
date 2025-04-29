window.addEventListener('message', function(event) {
    const data = event.data;
    
    if (data.type === 'toggleMenu') {
        const reportMenu = document.getElementById('report-menu');
        const reportsList = document.getElementById('reports-list');
        
        if (data.show) {
            reportMenu.classList.remove('hidden');
            document.getElementById('report-type').value = 'player';
            document.getElementById('report-subject').value = '';
            document.getElementById('report-text').value = '';
            reportsList.classList.add('hidden');
            
            // Update UI text from config
            if (data.config) {
                document.getElementById('menu-title').textContent = data.config.title;
                document.getElementById('reporting-label').textContent = data.config.reportingUserLabel;
                if (data.playerName) {
                    document.getElementById('player-name').textContent = data.config.welcomeMessage.replace('%s', data.playerName);
                }
            }
        } else {
            reportMenu.classList.add('hidden');
        }
    }
    
    if (data.type === 'toggleReportsList') {
        const reportsList = document.getElementById('reports-list');
        const reportMenu = document.getElementById('report-menu');
        
        if (data.show) {
            reportsList.classList.remove('hidden');
            reportMenu.classList.add('hidden');
            
            // Update title from config
            if (data.config) {
                document.getElementById('reports-title').textContent = data.config.title;
            }
        } else {
            reportsList.classList.add('hidden');
        }
    }
    
    if (data.type === 'updateReports') {
        const reportsList = document.getElementById('reports-list');
        const reportsContainer = document.getElementById('reports-container');
        reportsList.classList.remove('hidden');
        
        // Update title from config
        if (data.config) {
            document.getElementById('reports-title').textContent = data.config.title;
        }
        
        reportsContainer.innerHTML = '';
        data.reports.forEach(report => {
            const reportElement = createReportElement(report);
            reportsContainer.appendChild(reportElement);
        });
    }

    if (data.type === 'reportDeleted') {
        handleReportDeleted(data.reportId);
        // Close any open chat for this report
        closeChat(data.reportId);
    }

    if (data.type === 'openExistingReport') {
        const reportMenu = document.getElementById('report-menu');
        const reportsList = document.getElementById('reports-list');
        reportMenu.classList.add('hidden');
        reportsList.classList.add('hidden');
        
        // Create chat container if it doesn't exist
        let chatContainer = document.getElementById(`chat-container-${data.report.id}`);
        if (!chatContainer) {
            chatContainer = document.createElement('div');
            chatContainer.id = `chat-container-${data.report.id}`;
            chatContainer.className = 'chat-container';
            
            // Create chat header
            const chatHeader = document.createElement('div');
            chatHeader.className = 'chat-header';
            
            const headerContent = document.createElement('div');
            headerContent.className = 'header-content';
            headerContent.innerHTML = `
                <span class="report-icon ${getReportTypeIcon(data.report.type)}"></span>
                <h3>${getReportTypeName(data.report.type)}: ${data.report.subject}</h3>
            `;
            
            const closeBtn = document.createElement('button');
            closeBtn.className = 'close-btn';
            closeBtn.textContent = '×';
            closeBtn.onclick = function() {
                closeChat(data.report.id);
            };
            
            chatHeader.appendChild(headerContent);
            chatHeader.appendChild(closeBtn);
            
            // Create messages container
            const messagesContainer = document.createElement('div');
            messagesContainer.className = 'chat-messages';
            messagesContainer.id = `chat-messages-${data.report.id}`;
            
            // Add initial report message
            const initialMessage = document.createElement('div');
            initialMessage.className = 'initial-report';
            initialMessage.textContent = data.report.text;
            messagesContainer.appendChild(initialMessage);
            
            // Add existing messages
            if (data.report.messages && data.report.messages.length > 0) {
                data.reports.messages.forEach(message => {
                    const messageElement = createMessageElement(message);
                    messagesContainer.appendChild(messageElement);
                });
            }
            
            // Create chat input
            const chatInputContainer = document.createElement('div');
            chatInputContainer.className = 'chat-input';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.id = `chat-input-${data.report.id}`;
            input.placeholder = 'Type your message...';
            
            const sendBtn = document.createElement('button');
            sendBtn.className = 'send-btn';
            sendBtn.textContent = 'Send';
            sendBtn.onclick = function() {
                sendChatMessage(data.report.id);
            };
            
            chatInputContainer.appendChild(input);
            chatInputContainer.appendChild(sendBtn);
            
            // Assemble chat container
            chatContainer.appendChild(chatHeader);
            chatContainer.appendChild(messagesContainer);
            chatContainer.appendChild(chatInputContainer);
            
            document.body.appendChild(chatContainer);
            
            // Setup Enter key listener for the input
            setupChatInputListeners(data.report.id);
            
            // Scroll to bottom of messages
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    if (data.type === 'newMessage') {
        const messagesContainer = document.getElementById(`chat-messages-${data.reportId}`);
        if (messagesContainer) {
            const messageElement = createMessageElement(data.message);
            messagesContainer.appendChild(messageElement);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            // Focus the input field after receiving a message
            const chatInput = document.getElementById(`chat-input-${data.reportId}`);
            if (chatInput) {
                chatInput.focus();
            }
        }
    }

    if (data.type === 'showReportChat') {
        const reportsList = document.getElementById('reports-list');
        reportsList.classList.add('hidden');
        
        // Create chat container if it doesn't exist
        let chatContainer = document.getElementById(`chat-container-${data.report.id}`);
        if (!chatContainer) {
            chatContainer = document.createElement('div');
            chatContainer.id = `chat-container-${data.report.id}`;
            chatContainer.className = 'chat-container';
            
            // Create chat header with actions
            const chatHeader = document.createElement('div');
            chatHeader.className = 'chat-header';
            
            const headerContent = document.createElement('div');
            headerContent.className = 'header-content';
            headerContent.innerHTML = `
                <span class="report-icon ${getReportTypeIcon(data.report.type)}"></span>
                <h3>${getReportTypeName(data.report.type)}: ${data.report.subject}</h3>
            `;
            
            const chatActions = document.createElement('div');
            chatActions.className = 'chat-actions';
            
            const helpBtn = document.createElement('button');
            helpBtn.className = 'action-btn help-btn';
            helpBtn.textContent = 'Help';
            helpBtn.onclick = function() {
                teleportToPlayer(data.report.id);
            };
            
            const closeBtn = document.createElement('button');
            closeBtn.className = 'action-btn close-btn';
            closeBtn.textContent = 'Close';
            closeBtn.onclick = function() {
                updateReportStatus(data.report.id, 'rejected');
            };
            
            const closeChatBtn = document.createElement('button');
            closeChatBtn.className = 'close-btn';
            closeChatBtn.textContent = '×';
            closeChatBtn.onclick = function() {
                closeChat(data.report.id);
            };
            
            chatActions.appendChild(helpBtn);
            chatActions.appendChild(closeBtn);
            
            chatHeader.appendChild(headerContent);
            chatHeader.appendChild(chatActions);
            chatHeader.appendChild(closeChatBtn);
            
            // Create messages container
            const messagesContainer = document.createElement('div');
            messagesContainer.className = 'chat-messages';
            messagesContainer.id = `chat-messages-${data.report.id}`;
            
            // Add initial report message
            const initialMessage = document.createElement('div');
            initialMessage.className = 'initial-report';
            initialMessage.textContent = data.report.report_text;
            messagesContainer.appendChild(initialMessage);
            
            // Add existing messages
            if (data.report.messages && data.report.messages.length > 0) {
                data.report.messages.forEach(message => {
                    const messageElement = createMessageElement(message);
                    messagesContainer.appendChild(messageElement);
                });
            }
            
            // Create chat input
            const chatInputContainer = document.createElement('div');
            chatInputContainer.className = 'chat-input';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.id = `chat-input-${data.report.id}`;
            input.placeholder = 'Type your message...';
            
            const sendBtn = document.createElement('button');
            sendBtn.className = 'send-btn';
            sendBtn.textContent = 'Send';
            sendBtn.onclick = function() {
                sendChatMessage(data.report.id);
            };
            
            chatInputContainer.appendChild(input);
            chatInputContainer.appendChild(sendBtn);
            
            // Assemble chat container
            chatContainer.appendChild(chatHeader);
            chatContainer.appendChild(messagesContainer);
            chatContainer.appendChild(chatInputContainer);
            
            document.body.appendChild(chatContainer);
            
            // Setup Enter key listener for the input
            setupChatInputListeners(data.report.id);
            
            // Scroll to bottom of messages
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    if (data.type === 'showReports') {
        const reportsList = document.getElementById('reports-list');
        const reportMenu = document.getElementById('report-menu');
        if (reportsList) {
            reportsList.classList.remove('hidden');
            reportMenu.classList.add('hidden');
        }
    }
});

function createReportElement(report) {
    const reportItem = document.createElement('div');
    reportItem.className = 'report-item';
    reportItem.id = `report-${report.id}`;
    
    const reportHeader = document.createElement('div');
    reportHeader.className = 'report-header';
    reportHeader.onclick = function() {
        openReportChat(report.id);
    };
    
    const reportType = document.createElement('div');
    reportType.className = 'report-type';
    reportType.innerHTML = `
        <span class="report-icon ${getReportTypeIcon(report.type)}"></span>
        <span class="report-type-badge ${report.type}">${getReportTypeName(report.type)}</span>
        <span class="report-id">#${report.id}</span>
    `;
    
    const reportInfo = document.createElement('div');
    reportInfo.className = 'report-info';
    
    // Format date
    let date = new Date(report.created_at);
    let formattedDate = `${date.getMonth()+1}/${date.getDate()}/${date.getFullYear()}, ${formatTime(date)}`;
    
    reportInfo.textContent = `By: ${report.player_name} | ${formattedDate}`;
    
    reportHeader.appendChild(reportType);
    reportHeader.appendChild(reportInfo);
    
    const reportDetails = document.createElement('div');
    reportDetails.className = 'report-details hidden';
    reportDetails.id = `report-details-${report.id}`;
    
    const reportSubject = document.createElement('div');
    reportSubject.className = 'report-subject';
    reportSubject.textContent = `Subject: ${report.subject}`;
    
    const reportText = document.createElement('div');
    reportText.className = 'report-text';
    reportText.textContent = report.report_text;
    
    const reportActions = document.createElement('div');
    reportActions.className = 'report-actions';
    
    const helpBtn = document.createElement('button');
    helpBtn.className = 'action-btn help-btn';
    helpBtn.textContent = 'Help';
    helpBtn.onclick = function(e) {
        e.stopPropagation(); // Prevent triggering the parent click
        teleportToPlayer(report.id);
    };
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'action-btn close-btn';
    closeBtn.textContent = 'Close';
    closeBtn.onclick = function(e) {
        e.stopPropagation(); // Prevent triggering the parent click
        updateReportStatus(report.id, 'rejected');
    };
    
    reportActions.appendChild(helpBtn);
    reportActions.appendChild(closeBtn);
    
    reportDetails.appendChild(reportSubject);
    reportDetails.appendChild(reportText);
    reportDetails.appendChild(reportActions);
    
    reportItem.appendChild(reportHeader);
    reportItem.appendChild(reportDetails);
    
    return reportItem;
}

function openReportChat(reportId) {
    fetch('https://Jester-reports/getReportMessages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            reportId: reportId
        })
    });
}

function toggleReportDetails(reportId) {
    const detailsElement = document.getElementById(`report-details-${reportId}`);
    if (detailsElement) {
        detailsElement.classList.toggle('hidden');
    }
}

function closeMenu() {
    const reportMenu = document.getElementById('report-menu');
    reportMenu.classList.add('hidden');
    fetch('https://Jester-reports/closeMenu', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    });
}

function closeReportsList() {
    const reportsList = document.getElementById('reports-list');
    reportsList.classList.add('hidden');
    fetch('https://Jester-reports/closeReportsList', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    });
}

function submitReport() {
    const reportType = document.getElementById('report-type').value;
    const reportSubject = document.getElementById('report-subject').value.trim();
    const reportText = document.getElementById('report-text').value.trim();
    
    if (!reportSubject || !reportText) return;
    
    fetch('https://Jester-reports/submitReport', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            type: reportType,
            subject: reportSubject,
            report: reportText
        })
    });
}

function updateReportStatus(reportId, status) {
    fetch('https://Jester-reports/updateReportStatus', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            reportId: reportId,
            status: status
        })
    });
}

function teleportToPlayer(reportId) {
    fetch('https://Jester-reports/teleportToPlayer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            reportId: reportId
        })
    });
}

// Prevent form submission on enter key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
    }
});

function getReportTypeIcon(type) {
    return {
        player: 'fas fa-user',
        bug: 'fas fa-bug',
        other: 'fas fa-banana'
    }[type] || 'fas fa-file-alt';
}

function getReportTypeName(type) {
    return {
        player: 'Player Report',
        bug: 'Bug Report',
        other: 'Other Report'
    }[type] || 'Report';
}

function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.is_admin ? 'admin-message' : 'user-message'}`;
    
    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';
    
    const senderSpan = document.createElement('span');
    senderSpan.className = 'message-sender';
    senderSpan.textContent = message.sender_name;
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-time';
    
    // Format the timestamp
    let timestamp;
    if (message.created_at) {
        if (typeof message.created_at === 'string') {
            timestamp = new Date(message.created_at);
        } else {
            timestamp = new Date(); // Use current time as fallback
        }
    } else {
        timestamp = new Date(); // Use current time as fallback
    }
    
    timeSpan.textContent = formatTime(timestamp);
    
    messageHeader.appendChild(senderSpan);
    messageHeader.appendChild(timeSpan);
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = message.message;
    
    messageDiv.appendChild(messageHeader);
    messageDiv.appendChild(messageContent);
    
    return messageDiv;
}

function sendChatMessage(reportId) {
    const input = document.getElementById(`chat-input-${reportId}`);
    const message = input.value.trim();
    
    if (message) {
        fetch('https://Jester-reports/sendMessage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                reportId: reportId,
                message: message
            })
        });
        input.value = '';
    }
}

function closeChat(reportId) {
    const chatContainer = document.getElementById(`chat-container-${reportId}`);
    if (chatContainer) {
        chatContainer.remove();
    }
    fetch('https://Jester-reports/closeChat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    });
}

function closeReports() {
    const reportsContainer = document.querySelector('.reports-container');
    if (reportsContainer) {
        reportsContainer.style.display = 'none';
    }
    fetch('https://Jester-reports/closeReports', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    });
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const reportsList = document.getElementById('reports-list');
        const reportMenu = document.getElementById('report-menu');
        
        if (!reportMenu.classList.contains('hidden')) {
            closeMenu();
        } else if (!reportsList.classList.contains('hidden')) {
            closeReportsList();
        }
        
        const chatContainer = document.querySelector('[id^="chat-container-"]');
        if (chatContainer) {
            const reportId = chatContainer.id.replace('chat-container-', '');
            closeChat(reportId);
        }
    }
});

// Helper function to format time
function formatTime(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    return hours + ':' + minutes + ' ' + ampm;
}

// Add a function to handle report deletion from UI
function handleReportDeleted(reportId) {
    const reportElement = document.getElementById(`report-${reportId}`);
    if (reportElement) {
        reportElement.remove();
    }
}

// Add this function to handle keydown events in the chat input
function setupChatInputListeners(reportId) {
    const chatInput = document.getElementById(`chat-input-${reportId}`);
    if (chatInput) {
        chatInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                sendChatMessage(reportId);
            }
        });
    }
}