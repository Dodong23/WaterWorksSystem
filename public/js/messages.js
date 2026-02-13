$(document).ready(function() {
    let recipientId = null;
    let recipientName = null;
    let messagePollingInterval = null;
    const myUserId = localStorage.getItem('userId'); // Ensure myUserId is available

    // Fetch users
    $.ajax({
        url: '/api/users',
        method: 'GET',
        success: function(users) {
            const usersList = $('#users-list');
            usersList.empty(); // Clear existing list to prevent duplicates on re-fetch
            users.forEach(user => {
                if (user._id === myUserId) return;
                const avatarSrc = '/user_4791601.png'; // Placeholder avatar
                const userItem = $(`
                    <li class="list-group-item list-group-item-action user-item" data-user-id="${user._id}" data-user-name="${user.fullName}">
                        <img src="${avatarSrc}" alt="Avatar" class="avatar" style="width: 50px; height: 50px">
                        ${user.fullName}
                    </li>
                `);
                usersList.append(userItem);
            });
        },
        error: function() {
            alert('Error fetching users.');
        }
    });

    // Handle user selection
    $('#users-list').on('click', '.list-group-item', function() {
        recipientId = $(this).data('user-id');
        recipientName = $(this).data('user-name');
        $('#recipient-name').text(`Messaging with ${recipientName}`);
        
        if (messagePollingInterval) {
            clearInterval(messagePollingInterval);
        }
        
        loadMessages(recipientId);
        
        messagePollingInterval = setInterval(() => {
            loadMessages(recipientId);
        }, 3000);
    });

    // Load messages
    function loadMessages(userId) {
        if (!userId) return;
        $.ajax({
            url: `/api/messages/${userId}`,
            method: 'GET',
            success: function(messages) {
                const messagesBody = $('#messages-body');
                // Check if the user was already scrolled to the bottom
                const isScrolledToBottom = messagesBody[0].scrollHeight - messagesBody.scrollTop() === messagesBody.innerHeight();
                
                messagesBody.empty();
                messages.forEach(message => {
                    const messageDate = new Date(message.timestamp).toLocaleString();
                    const isSender = message.sender._id === myUserId;
                    const avatarSrc = '/user_4791601.png'; // Placeholder avatar for messages

                    const messageElement = $(`
                        <div class="message-container ${isSender ? 'sent' : 'received'}">
                            ${!isSender ? `<img src="${avatarSrc}" alt="Avatar" class="message-avatar" style="width: 50px; height: 50px">` : ''}
                            <div class="message-content">
                                <div class="message-bubble ${isSender ? 'sent' : 'received'}">
                                    <p><strong>${message.sender.fullName}:</strong> ${message.message}</p>
                                </div>
                                <span class="message-timestamp">${messageDate}</span>
                            </div>
                            ${isSender ? `<img src="${avatarSrc}" alt="Avatar" class="message-avatar" style="width: 50px; height: 50px">` : ''}
                        </div>
                    `);
                    messagesBody.append(messageElement); // Append to show new messages at the bottom
                }); // Close the forEach loop

                // Scroll to bottom only if it was already at the bottom or if it's the first load
                if (isScrolledToBottom || messages.length === 0) {
                    messagesBody.scrollTop(messagesBody[0].scrollHeight);
                }

            },
            error: function() {
                console.error('Error fetching messages.');
            }
        });
    }

    // Handle message sending
    $('#message-form').on('submit', function(e) {
        e.preventDefault();
        const message = $('#message-input').val();
        if (!message || !recipientId) return;
        console.log('Sending message:', { recipientId, message, myUserId });

        $.ajax({
            url: '/api/messages',
            method: 'POST',
            data: {
                sender: myUserId,
                recipient: recipientId,
                message: message
            },
            success: function(newMessage) {
                const messagesBody = $('#messages-body');
                const messageDate = new Date(newMessage.timestamp).toLocaleString();
                const senderFullName = newMessage.sender.fullName;
                const senderAvatarSrc = '/user_4791601.png';
                
                const messageElement = $(`
                    <div class="message-container sent">
                        <div class="message-content">
                            <div class="message-bubble sent">
                                <p><strong>${senderFullName}:</strong> ${newMessage.message}</p>
                            </div>
                            <span class="message-timestamp">${messageDate}</span>
                        </div>
                        <img src="${senderAvatarSrc}" alt="Avatar" class="message-avatar">
                    </div>
                `);
                messagesBody.append(messageElement); // Append new message to the bottom
                messagesBody.scrollTop(messagesBody[0].scrollHeight); // Scroll to bottom for new messages
                $('#message-input').val('');
            },
            error: function() {
                alert('Error sending message.');
            }
        });
    });
});
