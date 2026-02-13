document.addEventListener('DOMContentLoaded', async () => {
    const profileForm = document.getElementById('profile-form');
    const usernameInput = document.getElementById('username');
    const fullNameInput = document.getElementById('fullName');
    const positionInput = document.getElementById('position');
    const userContactInput = document.getElementById('userContact');
    const passwordInput = document.getElementById('password');

    let userId = null;

    try {
        const response = await fetch('/api/users/me');
        if (!response.ok) {
            throw new Error('Could not fetch user data');
        }
        const user = await response.json();
        userId = user._id;

        usernameInput.value = user.username;
        fullNameInput.value = user.fullName;
        positionInput.value = user.position;
        userContactInput.value = user.userContact || '';
    } catch (error) {
        console.error('Error fetching user data:', error);
        alert('Failed to load user data.');
    }

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const updates = {
            username: usernameInput.value,
            fullName: fullNameInput.value,
            position: positionInput.value,
            userContact: userContactInput.value,
        };

        if (passwordInput.value) {
            updates.password = passwordInput.value;
        }

        try {
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            });

            if (response.ok) {
                alert('Profile updated successfully!');
                window.location.reload();
            } else {
                const errorData = await response.json();
                alert(`Update failed: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('An error occurred while updating the profile.');
        }
    });
});
