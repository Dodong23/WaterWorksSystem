document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const alertContainer = document.getElementById('alert-container');

    const showAlert = (message, type = 'danger') => {
        // Clear any existing alerts
        alertContainer.innerHTML = '';
        
        const wrapper = document.createElement('div');
        wrapper.innerHTML = [
            `<div class="alert alert-${type} alert-dismissible fade show" role="alert">`,
            `   <div>${message}</div>`,
            '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
            '</div>'
        ].join('');

        alertContainer.append(wrapper);
    };

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = usernameInput.value;
        const password = passwordInput.value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            console.log('Server response OK:', response.ok);
            console.log('Server data:', data);

            if (response.ok) {
                
                const officeCode = data.user.officeCode;
                localStorage.setItem('userId', data.user.id);
                localStorage.setItem('fullName', data.user.fullName);
                console.log('Login successful. Office Code for redirection:', officeCode);

                // Redirect based on officeCode
                switch (officeCode) {
                    case '0': // Master Admin
                        window.location.href = '/admin/users';
                        break;
                    case '1': // Billing
                        window.location.href = '/billings';
                        break;
                    case '2': // Treasury
                        window.location.href = '/treasury';
                        break;
                    case '3': // Engineering
                        window.location.href = '/engineering';
                        break;
                    default:
                        // Fallback or error page if officeCode is unexpected
                        showAlert('Unknown office code. Redirecting to a default page.', 'warning');
                        setTimeout(() => {
                            window.location.href = '/'; 
                        }, 2000);
                        break;
                }
            } else {
                showAlert(data.message || 'Login failed. Please check your credentials or contact the system administrator.');
            }
        } catch (error) {
            console.error('Error during login:', error);
            showAlert('An error occurred during login. Please try again later.');
        }
    });
});