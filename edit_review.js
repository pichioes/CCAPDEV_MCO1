function initializeEditStarRating(currentRating) {
    const stars = document.querySelectorAll("#edit-star-container .star");
    stars.forEach((star, index) => {
        star.dataset.value = index + 1;
        
        star.addEventListener("click", function () {
            updateStars(parseInt(this.dataset.value));
        });
    });

    function updateStars(rating) {
        stars.forEach(star => {
            star.classList.toggle("active", parseInt(star.dataset.value) <= rating);
        });
        document.getElementById("editReviewModal").dataset.stars = rating;
    }

    updateStars(currentRating);
}

async function loadEditModal(reviewId) {
    try {
        const response = await fetch('/getReviews');
        if (!response.ok) {
            throw new Error('Failed to fetch reviews');
        }
        
        const allReviews = await response.json();
        const review = allReviews.find(r => r._id === reviewId);
        
        if (!review) {
            return alert("Review not found");
        }

        const htmlResponse = await fetch('edit_review.html');
        if (!htmlResponse.ok) {
            throw new Error('Failed to load edit review template');
        }
        
        const html = await htmlResponse.text();
        document.getElementById('editReviewModalContainer').innerHTML = html;

        setTimeout(() => {
            document.getElementById('editReviewModal').style.display = 'block';
            document.getElementById('editModalOverlay').style.display = 'block';

            document.getElementById("editReviewTitle").value = review.Title || "";
            document.getElementById("editReviewText").value = review.Review || "";
            
            const serviceSelect = document.getElementById("editServiceSelect");
            if (review.Service_ID && review.Service_ID.Service_Name) {
                serviceSelect.value = review.Service_ID.Service_Name;
            }
            
            initializeEditStarRating(review.Star_rating || 0);

            if (review.Image_path) {
                const preview = document.getElementById("editImagePreview");
                preview.src = review.Image_path;
                preview.style.display = "block";
            }

            // img preview
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

            document.getElementById("submitEditReviewButton").onclick = () => submitEditReview(reviewId);
        }, 0);
    } catch (error) {
        console.error("Error loading edit modal:", error);
        alert("Error loading edit form. Please try again.");
    }
}

function closeEditModal() {
    document.getElementById('editReviewModal').style.display = 'none';
    document.getElementById('editModalOverlay').style.display = 'none';
}

async function submitEditReview(reviewId) {
    const formData = new FormData();
    
    const stars = parseInt(document.getElementById("editReviewModal").dataset.stars || 0);
    const serviceName = document.getElementById("editServiceSelect").value;
    const title = document.getElementById("editReviewTitle").value;
    const reviewText = document.getElementById("editReviewText").value;
    const imageFile = document.getElementById("editReviewImage").files[0];

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

    formData.append('starRating', stars);
    formData.append('title', title);
    formData.append('review', reviewText);
    formData.append('serviceName', serviceName);
    
    if (imageFile) {
        formData.append('reviewImage', imageFile);
    }

    try {
        const res = await fetch(`/editreview/${reviewId}`, {
            method: 'PUT',
            body: formData
        });

        const result = await res.json();
        
        if (res.ok) {
            alert(result.message || "Review updated successfully!");
            closeEditModal();
            window.location.reload();
        } else {
            alert("Failed to update review: " + (result.message || "Unknown error"));
        }
    } catch (err) {
        console.error("Edit error:", err);
        alert("Error editing review. Please try again later.");
    }
}