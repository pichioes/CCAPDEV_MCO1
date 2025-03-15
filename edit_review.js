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

    updateStars(currentRating); // Pre-fill stars
}

async function loadEditModal(reviewId) {
    const response = await fetch('/getReviews');
    const allReviews = await response.json();
    const review = allReviews.find(r => r._id === reviewId);
    if (!review) return alert("Review not found");

    const html = await fetch('edit_review.html').then(res => res.text());
    document.getElementById('editReviewModalContainer').innerHTML = html;

    setTimeout(() => {
        document.getElementById('editReviewModal').style.display = 'block';
        document.getElementById('editModalOverlay').style.display = 'block';

        // Fill in data
        document.getElementById("editReviewTitle").value = review.Title;
        document.getElementById("editReviewText").value = review.Review;
        document.getElementById("editServiceSelect").value = review.Service_ID?.Service_Name || "";
        initializeEditStarRating(review.Star_rating || 0);

        // Preview current image
        if (review.Image_path) {
            const preview = document.getElementById("editImagePreview");
            preview.src = review.Image_path;
            preview.style.display = "block";
        }

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

    formData.append('starRating', stars);
    formData.append('title', title);
    formData.append('review', reviewText);
    formData.append('serviceName', serviceName);
    if (imageFile) formData.append('reviewImage', imageFile);

    try {
        const res = await fetch(`/editreview/${reviewId}`, {
            method: 'PUT',
            body: formData
        });

        const result = await res.json();
        if (res.ok) {
            alert(result.message);
            closeEditModal();
            window.location.reload();
        } else {
            alert("Failed to update review: " + result.message);
        }
    } catch (err) {
        console.error("Edit error:", err);
        alert("Error editing review.");
    }
}
