document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    checkUserStatus();
    
    // Function to check user login status and modify UI accordingly
    async function checkUserStatus() {
        try {
            const response = await fetch('/profile');
            
            if (response.status === 401) {
                // User is not logged in (guest)
                handleGuestUser();
            } else if (response.ok) {
                // User is logged in, no action needed
                console.log('User is logged in, showing all content');
            } else {
                // Handle unexpected errors by assuming guest
                console.error('Error checking login status:', response.statusText);
                handleGuestUser();
            }
        } catch (error) {
            // Handle network errors by assuming guest
            console.error('Error checking login status:', error);
            handleGuestUser();
        }
    }
    
    // Modify UI for guest users
    function handleGuestUser() {
        console.log('Guest user detected, limiting access');
        
        // Hide "Other Reviews" section
        const otherReviewsSection = document.querySelector('.other-reviews');
        if (otherReviewsSection) {
            otherReviewsSection.style.display = 'none';
        }
        
        // Add login prompt after top reviews section
        const topReviewsContainer = document.querySelector('.top-reviews');
        if (topReviewsContainer) {
            const loginPrompt = document.createElement('div');
            loginPrompt.className = 'login-prompt';
            loginPrompt.innerHTML = `
                <div style="text-align: center; margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
                    <p style="margin-bottom: 10px;">Please log in to see all reviews and share your own experience!</p>
                    <button onclick="window.location.href='login.html'" style="padding: 10px 20px; background-color: #c69fa5; color: white; border: none; border-radius: 5px; cursor: pointer;">Log In</button>
                    <button onclick="window.location.href='signup.html'" style="padding: 10px 20px; background-color: white; color: #c69fa5; border: 1px solid #c69fa5; border-radius: 5px; margin-left: 10px; cursor: pointer;">Sign Up</button>
                </div>
            `;
            topReviewsContainer.after(loginPrompt);
        }
        
        // Modify "Post a Review" button to redirect to login page
        const reviewButtons = document.querySelectorAll('.review-buttons button');
        reviewButtons.forEach(button => {
            if (button.textContent.includes('Post a Review')) {
                button.removeAttribute('onclick');
                button.addEventListener('click', function() {
                    window.location.href = 'login.html';
                });
            }
        });
    }
    
    // Add event listener to profile links in the navbar
    setTimeout(() => {
        const profileLink = document.querySelector('.profile-menu a');
        if (profileLink) {
            profileLink.addEventListener('click', async function(event) {
                event.preventDefault();
                
                try {
                    const response = await fetch('/profile');
                    
                    if (response.status === 401) {
                        // if guest, go to login page
                        window.location.href = 'login.html';
                    } else if (response.ok) {
                        // if not guest, go to profile page
                        window.location.href = 'userpage.html';
                    } else {
                        // Handle other errors
                        console.error('Error checking login status:', response.statusText);
                        window.location.href = 'userpage.html';
                    }
                } catch (error) {
                    console.error('Error checking login status:', error);
                    window.location.href = 'userpage.html';
                }
            });
        }
    }, 300); // Wait for navbar to load
});