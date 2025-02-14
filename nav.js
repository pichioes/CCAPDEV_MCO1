// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Target element where navbar will be inserted
    const navbarContainer = document.getElementById('navbar');
    
    if (navbarContainer) {
        // Fetch the navbar.html file
        fetch('/partials/navbar.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load navbar');
                }
                return response.text();
            })
            .then(html => {
                // Insert the navbar HTML
                navbarContainer.innerHTML = html;
                
                // Add any additional functionality for navbar if needed
                // (e.g., highlight current page, mobile menu toggle, etc.)
            })
            .catch(error => {
                console.error('Error loading navbar:', error);
                navbarContainer.innerHTML = '<p>Error loading navigation</p>';
            });
    }
});