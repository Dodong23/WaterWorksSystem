window.renderMessagesSection = function(mainContent, user) {
    mainContent.innerHTML = `
    <div class="container-fluid mt-4">
        <div class="row">
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        Users
                    </div>
                    <ul class="list-group list-group-flush" id="users-list">
                        <!-- User list will be populated here -->
                    </ul>
                </div>
            </div>
            <div class="col-md-8">
                <div class="card">
                    <div class="card-header">
                        <span id="recipient-name">Select a user to message</span>
                    </div>
                    <div class="card-body messages-body" id="messages-body">
                        <!-- Messages will be displayed here -->
                    </div>
                    <div class="card-footer">
                        <form id="message-form">
                            <div class="input-group">
                                <input type="text" id="message-input" class="form-control" placeholder="Type a message...">
                                <div class="input-group-append">
                                    <button class="btn btn-primary" type="submit">Send</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

    // Set user info for the messaging script
    window.myUserId = user._id;
    window.myFullName = user.fullName;

    // Manually fetch and execute the messages.js script
    $.getScript('/js/messages.js');
};
