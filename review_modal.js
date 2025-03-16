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

async function loadModal() {
    const locationId = getLocationIdFromURL() || '67d4708826e81b777f2d75d1';
    fetch('review_modal.html')
        .then(response => response.text())
        .then(html => {
            // Inject the modal HTML into the dedicated container in the main page
            document.getElementById('reviewModalContainer').innerHTML = html;

            // After injection, display the modal and set up event listeners
            setTimeout(() => {
                document.getElementById('reviewModal').style.display = 'block';
                document.getElementById('modalOverlay').style.display = 'block';

                document.querySelector(".close-button").addEventListener("click", closeModal);
                document.getElementById("modalOverlay").addEventListener("click", closeModal);
                document.getElementById("submitReviewButton").addEventListener("click", submitReview);
                
                // Add image preview functionality
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
            }, 0);
        });
}

function closeModal() {
    document.getElementById('reviewModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
}

async function submitReview(event) {
    event.preventDefault(); 
    console.log("submitReview triggered");
    
    let locationId = getLocationIdFromURL();
    let service = document.getElementById("serviceSelect").value;
    let title = document.getElementById("reviewTitle").value;
    let review = document.getElementById("reviewText").value;
    let stars = document.querySelectorAll(".star.active").length;
    let imageFile = document.getElementById("reviewImage").files[0];

    if (service === "" || review.trim() === "" || stars === 0) {
        alert("Please fill out all required fields and select a star rating.");
        return;
    }

    try {
        // Use FormData to handle both text data and file upload
        const formData = new FormData();
        formData.append('serviceName', service);
        formData.append('title', title || 'Review'); // Ensure title has default value if empty
        formData.append('review', review);
        formData.append('starRating', stars);
        formData.append('locationId', locationId);
        
        // Only append the file if one was selected
        if (imageFile) {
            formData.append('reviewImage', imageFile);
        }

        const response = await fetch("/addreview", {
            method: "POST",
            body: formData // Don't set Content-Type header when using FormData
        });

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            closeModal(); // Close the modal after success
            window.location.reload(); // Reload the page to show the new review
        } else {
            alert("Review failed: " + (data.message || "Unknown error"));
        }
    } catch(error) {
        console.error("Error during fetch:", error);
        
        // Try alternative method with base64 encoding if FormData fails
        if (imageFile) {
            try {
                const reader = new FileReader();
                reader.readAsDataURL(imageFile);
                reader.onload = async function() {
                    const imageData = reader.result;
                    
                    const jsonData = {
                        serviceName: service,
                        title: title || 'Review', // Ensure title has default value if empty
                        review: review,
                        starRating: stars,
                        imageData: imageData
                    };
                    
                    const response = await fetch("/addreview-base64", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(jsonData)
                    });
                    
                    const data = await response.json();
                    if (response.ok) {
                        alert(data.message);
                        closeModal();
                        window.location.reload();
                    } else {
                        alert("Review failed: " + (data.message || "Unknown error"));
                    }
                };
            } catch (err) {
                alert("An error occurred trying to submit a review.");
                console.error("Error with base64 upload:", err);
            }
        } else {
            alert("An error occurred trying to submit a review.");
        }
    }
}

function getLocationIdFromURL() {
    // Example implementation - adjust based on your URL structure
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('locationId');
}