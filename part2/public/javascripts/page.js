// This function will handle the login form submission
async function login(event) {
    // Prevent the form from submitting the traditional way
    event.preventDefault();

    // Get the values from the form inputs
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('login-error');

    // Clear any previous error messages
    errorElement.textContent = '';

    try {
        const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
        // If the server returns an error, display it
        errorElement.textContent = data.error || 'Login failed. Please try again.';
        } else {
        // On success, redirect based on role
        if (data.role === 'owner') {
            window.location.href = '/owner-dashboard.html';
        } else if (data.role === 'walker') {
            window.location.href = '/walker-dashboard.html';
        } else {
            errorElement.textContent = 'Login successful, but user role is unknown.';
        }
        }
    } catch (err) {
        console.error('An error occurred during the login request:', err);
        errorElement.textContent = 'A network error occurred. Please check your connection.';
    }
}

// Add an event listener to the form to call our login function when it's submitted
const loginForm = document.getElementById('login-form');
if (loginForm) {
loginForm.addEventListener('submit', login);
}
