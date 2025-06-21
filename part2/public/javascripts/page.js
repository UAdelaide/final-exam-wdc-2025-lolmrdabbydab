/*
 * Handles the user login process.
 * Sends user credentials to the server and redirects on success.
 */
function login(event) {
    // Prevent page reload upon form submission
    event.preventDefault();

    // Get user input
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
                // Redirect based on the user's role
                if (responseData.role === 'owner') {
                    window.location.href = '/owner-dashboard.html';
                } else if (responseData.role === 'walker') {
                    window.location.href = '/walker-dashboard.html';
                } else {
                    errorElement.textContent = 'Login successful, but user role is unknown.';
                }
            } else {
                errorElement.textContent = responseData.error || 'Login failed. Please try again.';
            }
        }
    };

    // Connect to API endpoint
    xmlhttp.open("POST", "/api/users/login", true);
    xmlhttp.setRequestHeader("Content-type", "application/json");

    // Send conerted string to json
    xmlhttp.send(JSON.stringify(user));
}

// -= Log In =-
const loginForm = document.getElementById('login-form');
// trigger login function when submit
if (loginForm) {
  loginForm.addEventListener('submit', login);
}

/*
 * Fetches all dogs from -> fetches random image from external API -> builds
 * and displays the HTML table on the homepage.
 */
async function loadAllDogsTable() {
    try {
        // 1. Fetch the list of all dogs from our own API.
        const dogListResponse = await fetch('/api/walks/dogs');
        if (!dogListResponse.ok) {
            throw new Error('Failed to fetch dog list from our server.');
        }
        const dogs = await dogListResponse.json();

        const tableBody = document.getElementById('dog-table-body');
        tableBody.innerHTML = ''; // Clear existing table data

        // 2. For each dog, create a promise to fetch a random image.
        const imageFetchPromises = dogs.map(dog =>
            fetch('https://dog.ceo/api/breeds/image/random')
                .then(res => res.json())
                .then(imgData => {
                    // Combine dog data with the fetched image URL.
                    return { ...dog, imageUrl: imgData.message };
                })
        );

        // 3. Wait for all image fetches to complete.
        const dogsWithImages = await Promise.all(imageFetchPromises);

        // 4. Iterate over the complete data and build the table rows.
        dogsWithImages.forEach(dog => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${dog.name}</td>
                <td>${dog.size}</td>
                <td>${dog.owner_username}</td>
                <td><img src="${dog.imageUrl}" alt="A random dog" style="width: 100px; height: 100px; object-fit: cover;"></td>
            `;
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading the dog table:', error);
        // Optionally, display an error message on the page.
    }
}

// --- ADD A CALL to the new function when the page loads ---
// Place this at the very bottom of the file.
document.addEventListener('DOMContentLoaded', () => {
    // This ensures the DOM is fully loaded before we try to manipulate it.
    loadAllDogsTable();
});