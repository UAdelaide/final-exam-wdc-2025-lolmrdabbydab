/*
 * Handles the user login process.
 * Sends user credentials to the server and redirects on success.
 */
function login(event) {
    // Prevent pag reload upon form submission
    event.preventDefault();

    let user = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
    };

    const errorElement = document.getElementById('login-error');
    errorElement.textContent = '';

    // AJAX Request
    var xmlhttp = new XMLHttpRequest();

    // function run on response
    xmlhttp.onreadystatechange = function() {
        if (this.readyState == 4) { // Request is complete
            const responseData = JSON.parse(this.responseText);

            if (this.status == 200) { // Success
                // Redirect based on the user's role from the server response
                if (responseData.role === 'owner') {
                    window.location.href = '/owner-dashboard.html';
                } else if (responseData.role === 'walker') {
                    window.location.href = '/walker-dashboard.html';
                } else {
                    errorElement.textContent = 'Login successful, but user role is unknown.';
                }
            } else { // Error (e.g., 401 Unauthorized)
                errorElement.textContent = responseData.error || 'Login failed. Please try again.';
            }
        }
    };

    // Open connection to our API endpoint
    xmlhttp.open("POST", "/api/users/login", true);
    xmlhttp.setRequestHeader("Content-type", "application/json");
    xmlhttp.send(JSON.stringify(user));
}

// Attach the login function to the form's submit event.
// This ensures our login function is called when the user clicks the "Log In" button.
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', login);
}