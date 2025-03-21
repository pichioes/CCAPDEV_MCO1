// Function: get location ID
function getLocationIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('locationId');
}

// Function: load location details
async function loadLocationDetails() {
    const locationId = getLocationIdFromURL() || '67d4708826e81b777f2d75d1'; // orlando default
    
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

// Function: update the UI with location
function updateLocationUI(locationData) {
    document.querySelector('h1').textContent = `${locationData.Location_Name} Reviews`;
    
    const storeInfoSection = document.querySelector('.store-info');
    const storeImage = storeInfoSection.querySelector('img');
    const storeHeading = storeInfoSection.querySelector('h2');
    const storeAddress = storeInfoSection.querySelector('p:nth-of-type(1)');
    const storeDescription = storeInfoSection.querySelector('p:nth-of-type(2)');
    
    storeHeading.textContent = `Lay Bare Waxing Salon - ${locationData.Location_Name}`;
    storeAddress.textContent = locationData.Address;
    storeDescription.textContent = locationData.Description;
    
    storeImage.src = `img/loc${locationData._id.slice(-1)}.png`;
}

// Function: load reviews of location
async function loadReviews() {
    const locationId = getLocationIdFromURL() || '67d4708826e81b777f2d75d1'; // orlando default
    
    try {
        const response = await fetch(`/getReviewsByLocation/${locationId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch reviews');
        }
        
        const reviews = await response.json();
        console.log("Fetched reviews for location:", reviews);
        
        updateReviewStatistics(reviews);
        
        displayReviews(reviews);
        
    } catch (error) {
        console.error("Error loading reviews:", error);
    }
}

// Function: update review stats
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

// Function: display reviews
function displayReviews(reviews) {
    const topContainer = document.getElementById('top-reviews-container');
    const otherContainer = document.getElementById('other-reviews-container');
    
    if (!topContainer || !otherContainer) {
        console.error("Review containers not found in the DOM");
        return;
    }
    
    topContainer.innerHTML = '';
    otherContainer.innerHTML = '';
    
    const validReviews = reviews.filter(review => review && review.Review);
    
    // Sort reviews by likes (highest first)
    const sortedReviews = [...validReviews].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    
    // Display top reviews
    const topReviews = sortedReviews.slice(0, Math.min(5, sortedReviews.length));
    topReviews.forEach(review => {
        topContainer.innerHTML += createTopReviewCard(review);
    });
    
    // Display other reviews
    sortedReviews.forEach(review => {
        otherContainer.innerHTML += createReviewCard(review);
    });
    
    // go to user on review click
    document.querySelectorAll('.user-profile-link').forEach(link => {
        link.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            if (userId) {
                window.location.href = `view_user.html?id=${userId}`;
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', async function() {
    await fetchCurrentUser();
    loadLocationDetails();
    loadReviews();
});
