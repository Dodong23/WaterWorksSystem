document.addEventListener('DOMContentLoaded', () => {
    const userForm = document.getElementById('user-form');
    const userIdInput = document.getElementById('user-id');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const fullNameInput = document.getElementById('fullName');
    const officeCodeInput = document.getElementById('officeCode');
    const officeDescriptionInput = document.getElementById('officeDescription');
    const userContactInput = document.getElementById('userContact');
    const positionInput = document.getElementById('position');
    const submitBtn = document.getElementById('submit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const userListDiv = document.getElementById('user-list');
    const logoutBtn = document.getElementById('logout-btn');

    let editingUserId = null;

    // Function to fetch and display users
    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/admin/users');
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    alert('Session expired or unauthorized. Please log in again.');
                    window.location.href = '/mws-login'; // Redirect to login page
                    return;
                }
                throw new Error('Failed to fetch users');
            }
            const users = await response.json();
            displayUsers(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            alert('Error fetching users. See console for details.');
        }
    };

    // Function to display users
    const displayUsers = (users) => {
        userListDiv.innerHTML = '';
        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = `col-md-4 user-card ${user.isLoggedIn ? 'logged-in' : 'logged-out'}`;
            userCard.innerHTML = `
                <h5>${user.fullName} (${user.username})</h5>
                <p>Office: ${user.officeDescription} (${user.officeCode})</p>
                <p>Position: ${user.position}</p>
                <p>Contact: ${user.userContact}</p>
                <p>Status: <span class="status-indicator ${user.isLoggedIn ? 'online' : 'offline'}"></span> ${user.isLoggedIn ? 'Online' : 'Offline'}</p>
                <button class="btn btn-sm btn-info edit-btn" data-id="${user._id}">Edit</button>
                <button class="btn btn-sm btn-danger delete-btn" data-id="${user._id}">Delete</button>
            `;
            userListDiv.appendChild(userCard);
        });

        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => editUser(e.target.dataset.id));
        });
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => deleteUser(e.target.dataset.id));
        });
    };

    // Function to handle form submission (Add/Edit User)
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const userData = {
            username: usernameInput.value,
            fullName: fullNameInput.value,
            officeCode: officeCodeInput.value,
            officeDescription: officeDescriptionInput.value,
            userContact: userContactInput.value,
            position: positionInput.value,
        };

        // Only add password if it's a new user or password field is not empty during edit
        if (passwordInput.value) {
            userData.password = passwordInput.value;
        }

        let response;
        if (editingUserId) {
            // Edit user
            response = await fetch(`/api/admin/users/${editingUserId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
        } else {
            // Add user
            response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });
        }

        if (response.ok) {
            userForm.reset();
            editingUserId = null;
            submitBtn.textContent = 'Add User';
            cancelEditBtn.style.display = 'none';
            fetchUsers(); // Refresh user list
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.message || 'Something went wrong'}`);
        }
    });

    const editUser = async (id) => {
        try {
            const response = await fetch(`/api/admin/users/${id}`);
            if (!response.ok) throw new Error('Failed to fetch user for edit');
            const user = await response.json();

            userIdInput.value = user._id;
            usernameInput.value = user.username;
            fullNameInput.value = user.fullName;
            officeCodeInput.value = user.officeCode;
            officeDescriptionInput.value = user.officeDescription;
            userContactInput.value = user.userContact;
            positionInput.value = user.position;
            passwordInput.value = ''; // Clear password field for security

            editingUserId = user._id;
            submitBtn.textContent = 'Update User';
            cancelEditBtn.style.display = 'inline-block';
        } catch (error) {
            console.error('Error fetching user for edit:', error);
            alert('Error fetching user details for edit. See console.');
        }
    };

    // Function to cancel editing
    cancelEditBtn.addEventListener('click', () => {
        userForm.reset();
        editingUserId = null;
        submitBtn.textContent = 'Add User';
        cancelEditBtn.style.display = 'none';
    });

    // Function to delete user
    const deleteUser = async (id) => {
        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }
        try {
            const response = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete user');
            fetchUsers(); // Refresh user list
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error deleting user. See console for details.');
        }
    };

    // Handle logout
    logoutBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
            });
            if (response.ok) {
                window.location.href = '/mws-login'; // Redirect to login page
            } else {
                alert('Logout failed. Please try again.');
            }
        } catch (error) {
            console.error('Error during logout:', error);
            alert('Error during logout. See console for details.');
        }
    });

    // Initial fetch of users
    fetchUsers();
});