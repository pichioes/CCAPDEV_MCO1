function initializeStarRating() {
    const stars = document.querySelectorAll(".star");
    stars.forEach((star, index) => {
        star.dataset.value = index + 1;
        star.addEventListener("click", function () {
            updateStars(parseInt(this.dataset.value));
        });
    });

    function updateStars(rating) {
        stars.forEach(star => {
            if (parseInt(star.dataset.value) <= rating) {
                star.classList.add("active");
            } else {
                star.classList.remove("active");
            }
        });
    }
}

function loadModal() {
    const locationId = getLocationIdFromURL() || '67d4708826e81b777f2d75d1'; // orlando default
    
    const modalContainer = document.getElementById('reviewModalContainer');
    modalContainer.innerHTML = `
        <div id="reviewModal" class="modal">
            <div class="modal-content">
                <span class="close" onclick="closeModal()">&times;</span>
                <h2>Write a Review</h2>
                <form id="reviewForm" onsubmit="submitReview(event)">
                    <input type="hidden" id="locationId" value="${locationId}">
                    <div class="form-group">
                        <label for="serviceSelect">Service</label>
                        <select id="serviceSelect" required>
                            <option value="Waxing">Waxing</option>
                            <option value="Brazilian Waxing">Brazilian Waxing</option>
                            <option value="Full Body Waxing">Full Body Waxing</option>
                            <option value="Facial">Facial</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="reviewTitle">Title</label>
                        <input type="text" id="reviewTitle" placeholder="Review Title" required>
                    </div>
                    <div class="form-group">
                        <label for="reviewText">Your Review</label>
                        <textarea id="reviewText" placeholder="Share your experience..." required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Rating</label>
                        <div class="star-rating">
                            <span class="star" onclick="rateService(1)">★</span>
                            <span class="star" onclick="rateService(2)">★</span>
                            <span class="star" onclick="rateService(3)">★</span>
                            <span class="star" onclick="rateService(4)">★</span>
                            <span class="star" onclick="rateService(5)">★</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="reviewImage">Add an Image (Optional)</label>
                        <input type="file" id="reviewImage" accept="image/*">
                        <img id="imagePreview" style="display: none; max-width: 100%; margin-top: 10px;">
                    </div>
                    <button type="submit">Submit Review</button>
                </form>
            </div>
        </div>
    `;
    
    // Show modal
    document.getElementById('reviewModal').style.display = 'block';
    
    document.querySelector(".close").addEventListener("click", closeModal);
    document.getElementById("reviewForm").addEventListener("submit", submitReview);
    
    // image preview
    const imageInput = document.getElementById('reviewImage');
    if (imageInput) {
        imageInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                const preview = document.getElementById('imagePreview');
                
                reader.onload = function(e) {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                }
                
                reader.readAsDataURL(file);
            }
        });
    }
    
    initializeStarRating();
}

function closeModal() {
    document.getElementById('reviewModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
}

async function submitReview(event) {
    event.preventDefault();
    console.log("submitReview triggered");
    
    if (!currentUser) {
        alert("You must be logged in to post a review.");
        return;
    }
    
    const locationId = document.getElementById("locationId").value;
    const service = document.getElementById("serviceSelect").value;
    const title = document.getElementById("reviewTitle").value;
    const review = document.getElementById("reviewText").value;
    const stars = document.querySelectorAll(".star.active").length;
    const imageFile = document.getElementById("reviewImage").files[0];

    if (service === "" || review.trim() === "" || stars === 0) {
        alert("Please fill out all required fields and select a star rating.");
        return;
    }

    try {
        const formData = new FormData();
        formData.append('locationId', locationId);
        formData.append('serviceName', service);
        formData.append('title', title); 
        formData.append('review', review);
        formData.append('starRating', stars);
        
        if (imageFile) {
            formData.append('reviewImage', imageFile);
        }

        const response = await fetch("/addreview", {
            method: "POST",
            body: formData 
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            closeModal(); 
            loadReviews(); 
        } else {
            alert("Review failed: " + (data.message || "Unknown error"));
        }
    } catch(error) {
        console.error("Error submitting review:", error);
        alert("An error occurred while submitting your review. Please try again.");
    }
}

// Helper function to get location ID from URL
function getLocationIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('locationId');
}