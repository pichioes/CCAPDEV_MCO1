// Initialize star rating for edit review modal
function initializeEditStarRating(currentRating) {
    const stars = document.querySelectorAll("#edit-star-container .star");
    stars.forEach((star, index) => {
        // Set the data value attribute
        star.dataset.value = index + 1;
        
        // Add click event listener to each star
        star.addEventListener("click", function () {
            updateStars(parseInt(this.dataset.value));
        });
    });

    // Function to update star appearance based on rating
    function updateStars(rating) {
        stars.forEach(star => {
            star.classList.toggle("active", parseInt(star.dataset.value) <= rating);
        });
        // Store the selected rating in the modal's dataset for later retrieval
        document.getElementById("editReviewModal").dataset.stars = rating;
    }

    // Pre-fill stars based on the current review rating
    updateStars(currentRating);
}

// Load the edit modal with review data
async function loadEditModal(reviewId) {
    try {
        // Fetch all reviews to find the one to edit
        const response = await fetch('/getReviews');
        if (!response.ok) {
            throw new Error('Failed to fetch reviews');
        }
        
        const allReviews = await response.json();
        const review = allReviews.find(r => r._id === reviewId);
        
        if (!review) {
            return alert("Review not found");
        }

        // Fetch the edit review HTML template
        const htmlResponse = await fetch('edit_review.html');
        if (!htmlResponse.ok) {
            throw new Error('Failed to load edit review template');
        }
        
        const html = await htmlResponse.text();
        document.getElementById('editReviewModalContainer').innerHTML = html;

        // Setup modal after it's loaded into the DOM
        setTimeout(() => {
            // Show the modal
            document.getElementById('editReviewModal').style.display = 'block';
            document.getElementById('editModalOverlay').style.display = 'block';

            // Fill in the form with existing review data
            document.getElementById("editReviewTitle").value = review.Title || "";
            document.getElementById("editReviewText").value = review.Review || "";
            
            // Handle service selection
            const serviceSelect = document.getElementById("editServiceSelect");
            if (review.Service_ID && review.Service_ID.Service_Name) {
                serviceSelect.value = review.Service_ID.Service_Name;
            }
            
            // Initialize star rating with current value
            initializeEditStarRating(review.Star_rating || 0);

            // Preview current image if it exists
            if (review.Image_path) {
                const preview = document.getElementById("editImagePreview");
                preview.src = review.Image_path;
                preview.style.display = "block";
            }

            // Add change event listener for image preview
            document.getElementById("editReviewImage").addEventListener("change", function (event) {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const preview = document.getElementById("editImagePreview");
                        preview.src = e.target.result;
                        preview.style.display = 'block';
                    };
                    reader.readAsDataURL(file);
                }
            });

            // Set up submit button with the review ID
            document.getElementById("submitEditReviewButton").onclick = () => submitEditReview(reviewId);
        }, 0);
    } catch (error) {
        console.error("Error loading edit modal:", error);
        alert("Error loading edit form. Please try again.");
    }
}

// Close the edit modal
function closeEditModal() {
    document.getElementById('editReviewModal').style.display = 'none';
    document.getElementById('editModalOverlay').style.display = 'none';
}

// Submit the edited review
async function submitEditReview(reviewId) {
    // Create FormData object to handle file uploads
    const formData = new FormData();
    
    // Get values from form elements
    const stars = parseInt(document.getElementById("editReviewModal").dataset.stars || 0);
    const serviceName = document.getElementById("editServiceSelect").value;
    const title = document.getElementById("editReviewTitle").value;
    const reviewText = document.getElementById("editReviewText").value;
    const imageFile = document.getElementById("editReviewImage").files[0];

    // Validate inputs
    if (stars === 0) {
        return alert("Please rate your experience (1-5 stars).");
    }
    
    if (!title.trim()) {
        return alert("Please enter a review title.");
    }
    
    if (!reviewText.trim()) {
        return alert("Please enter your review.");
    }
    
    if (!serviceName) {
        return alert("Please select a service.");
    }

    // Add data to FormData object
    formData.append('starRating', stars);
    formData.append('title', title);
    formData.append('review', reviewText);
    formData.append('serviceName', serviceName);
    
    // Only append image if a new one was selected
    if (imageFile) {
        formData.append('reviewImage', imageFile);
    }

    try {
        // Send PUT request to update the review
        const res = await fetch(`/editreview/${reviewId}`, {
            method: 'PUT',
            body: formData
        });

        const result = await res.json();
        
        if (res.ok) {
            alert(result.message || "Review updated successfully!");
            closeEditModal();
            // Reload the page to show updated reviews
            window.location.reload();
        } else {
            alert("Failed to update review: " + (result.message || "Unknown error"));
        }
    } catch (err) {
        console.error("Edit error:", err);
        alert("Error editing review. Please try again later.");
    }
}