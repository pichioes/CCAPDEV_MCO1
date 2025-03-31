document.addEventListener('DOMContentLoaded', function() {
    checkUserStatus();
    
    // Function: check user login status
    async function checkUserStatus() {
        try {
            const response = await fetch('/profile');
            
            if (response.status === 401) {
                handleGuestUser();
            } else if (response.ok) {
                console.log('User is logged in');
            } else {
                console.error('Error checking login status:', response.statusText);
                handleGuestUser();
            }
        } catch (error) {
            console.error('Error checking login status:', error);
            handleGuestUser();
        }
    }
    
    // Function: UI for guest users
    function handleGuestUser() {        
        // hide other reviews
        const otherReviewsSection = document.querySelector('.other-reviews');
        if (otherReviewsSection) {
            otherReviewsSection.style.display = 'none';
        }
        
        // login prompt banner
        const topReviewsContainer = document.querySelector('.top-reviews');
        if (topReviewsContainer) {
            const loginPrompt = document.createElement('div');
            loginPrompt.className = 'login-prompt';
            loginPrompt.innerHTML = `
                <div style="text-align: center; margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
                    <p style="margin-bottom: 10px;">Please log in to see all reviews and share your own experience!</p>
                    <button onclick="window.location.href='index.html'" style="padding: 10px 20px; background-color: #c69fa5; color: white; border: none; border-radius: 5px; cursor: pointer;">Log In</button>
                    <button onclick="window.location.href='signup.html'" style="padding: 10px 20px; background-color: white; color: #c69fa5; border: 1px solid #c69fa5; border-radius: 5px; margin-left: 10px; cursor: pointer;">Sign Up</button>
                </div>
            `;
            topReviewsContainer.after(loginPrompt);
        }
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
                        window.location.href = 'index.html';
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
    }, 300);
});