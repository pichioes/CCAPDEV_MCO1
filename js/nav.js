// nav.js
document.addEventListener('DOMContentLoaded', function() {
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
                
                const profileLink = document.querySelector('.profile-menu a');
                if (profileLink) {
                    profileLink.addEventListener('click', async function(event) {
                        event.preventDefault();
                        
                        try {
                            // Check if user is logged in by querying the profile endpoint
                            const response = await fetch('/profile');
                            
                            if (response.status === 401) {
                                // User is not logged in, redirect to login page
                                window.location.href = 'index.html';
                            } else if (response.ok) {
                                // User is logged in, proceed to profile page
                                window.location.href = 'userpage.html';
                            } else {
                                console.error('Error checking login status:', response.statusText);
                                window.location.href = 'userpage.html';
                            }
                        } catch (error) {
                            console.error('Error checking login status:', error);
                            window.location.href = 'userpage.html';
                        }
                    });
                }
            })
            .catch(error => {
                console.error('Error loading navbar:', error);
                navbarContainer.innerHTML = '<p>Error loading navigation</p>';
            });
    }
});