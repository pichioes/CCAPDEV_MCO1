// This script handles redirection for the Profile button
document.addEventListener('DOMContentLoaded', function() {
    // Wait for the navbar to be loaded
    const checkNavbar = setInterval(() => {
        const profileLink = document.querySelector('.profile-menu a');
        
        if (profileLink) {
            clearInterval(checkNavbar);
            
            // Override the default link behavior
            profileLink.addEventListener('click', async function(event) {
                event.preventDefault();
                
                try {
                    // Check if user is logged in by querying the profile endpoint
                    const response = await fetch('/profile');
                    
                    if (response.status === 401) {
                        // User is not logged in, redirect to signup page
                        window.location.href = 'signup.html';
                    } else if (response.ok) {
                        // User is logged in, proceed to profile page
                        window.location.href = 'userpage.html';
                    } else {
                        // Handle other errors
                        console.error('Error checking login status:', response.statusText);
                        // Default to userpage in case of unexpected errors
                        window.location.href = 'userpage.html';
                    }
                } catch (error) {
                    console.error('Error checking login status:', error);
                    // Default to userpage in case of network errors
                    window.location.href = 'userpage.html';
                }
            });
        }
    }, 100); // Check every 100ms for the navbar to load
});