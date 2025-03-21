// Add this to a new file called location_handler.js

// Function to get location ID from URL parameters
function getLocationIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('locationId');
}

// Function to load location details
async function loadLocationDetails() {
    const locationId = getLocationIdFromURL() || '67d4708826e81b777f2d75d1'; // Default to Orlando if no ID is provided
    
    try {
        const response = await fetch(`/getLocation/${locationId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch location data');
        }
        
        const locationData = await response.json();
        updateLocationUI(locationData);
    } catch (error) {
        console.error("Error loading location data:", error);
    }
}

// Function to update the UI with location data
function updateLocationUI(locationData) {
    // Update page title
    document.querySelector('h1').textContent = `${locationData.Location_Name} Reviews`;
    
    // Update store info
    const storeInfoSection = document.querySelector('.store-info');
    const storeImage = storeInfoSection.querySelector('img');
    const storeHeading = storeInfoSection.querySelector('h2');
    const storeAddress = storeInfoSection.querySelector('p:nth-of-type(1)');
    const storeDescription = storeInfoSection.querySelector('p:nth-of-type(2)');
    
    storeHeading.textContent = `Lay Bare Waxing Salon - ${locationData.Location_Name}`;
    storeAddress.textContent = locationData.Address;
    storeDescription.textContent = locationData.Description;
    
    // You may need to update image path based on your structure
    storeImage.src = `img/loc${locationData._id.slice(-1)}.png`;
}

// Function to load reviews for the specific location
async function loadReviews() {
    const locationId = getLocationIdFromURL() || '67d4708826e81b777f2d75d1'; // Default to Orlando
    
    try {
        const response = await fetch(`/getReviewsByLocation/${locationId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch reviews');
        }
        
        const reviews = await response.json();
        console.log("Fetched reviews for location:", reviews);
        
        // Update review count and average rating
        updateReviewStatistics(reviews);
        
        // Display reviews
        displayReviews(reviews);
        
    } catch (error) {
        console.error("Error loading reviews:", error);
    }
}

// Function to update review statistics
function updateReviewStatistics(reviews) {
    const reviewCountElement = document.getElementById('review-count');
    const avgRatingElement = document.getElementById('average-rating');
    
    // Update review count
    if (reviewCountElement) {
        reviewCountElement.textContent = reviews.length;
    }
    
    // Update average rating
    if (avgRatingElement && reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + (review.Star_rating || 0), 0);
        const avgRating = (totalRating / reviews.length).toFixed(1);
        avgRatingElement.textContent = `${avgRating} ⭐ (${reviews.length} Reviews)`;
    }
}

// Function to display reviews
function displayReviews(reviews) {
    // Get containers
    const topContainer = document.getElementById('top-reviews-container');
    const otherContainer = document.getElementById('other-reviews-container');
    
    if (!topContainer || !otherContainer) {
        console.error("Review containers not found in the DOM");
        return;
    }
    
    // Clear containers
    topContainer.innerHTML = '';
    otherContainer.innerHTML = '';
    
    // Filter out reviews without proper structure
    const validReviews = reviews.filter(review => review && review.Review);
    
    // Sort reviews by likes (highest first)
    const sortedReviews = [...validReviews].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    
    // Display top 2 reviews if available
    const topReviews = sortedReviews.slice(0, Math.min(5, sortedReviews.length));
    topReviews.forEach(review => {
        topContainer.innerHTML += createTopReviewCard(review);
    });
    
    // Display other reviews
    sortedReviews.forEach(review => {
        otherContainer.innerHTML += createReviewCard(review);
    });
    
    // Add event listeners for user profile links
    document.querySelectorAll('.user-profile-link').forEach(link => {
        link.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            if (userId) {
                window.location.href = `view_user.html?id=${userId}`;
            }
        });
    });
}

// Update the page initialization
document.addEventListener('DOMContentLoaded', async function() {
    await fetchCurrentUser();
    loadLocationDetails();
    loadReviews();
});

// Function to add a manager comment
async function addManagerComment(reviewId) {
    if (!currentUser || !currentUser.isManager) {
        alert("You must be logged in as a manager to add comments.");
        return;
    }
    
    const commentText = document.getElementById(`manager-comment-${reviewId}`).value.trim();
    if (!commentText) {
        alert("Please enter a comment.");
        return;
    }
    
    try {
        const response = await fetch(`/addmanagercomment/${reviewId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ comment: commentText })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert(result.message);
            // Reload reviews to show the updated comment
            loadReviews();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("Error adding manager comment:", error);
        alert("An error occurred while adding your comment. Please try again.");
    }
}

// Function to delete a manager comment
async function deleteManagerComment(reviewId) {
    if (!currentUser || !currentUser.isManager) {
        alert("You must be logged in as a manager to delete comments.");
        return;
    }
    
    if (confirm("Are you sure you want to delete this comment?")) {
        try {
            const response = await fetch(`/deletemanagercomment/${reviewId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert(result.message);
                // Reload reviews to show the updated UI
                loadReviews();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Error deleting manager comment:", error);
            alert("An error occurred while deleting your comment. Please try again.");
        }
    }
}