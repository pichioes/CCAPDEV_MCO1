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
            document.getElementById('reviewModalContainer').innerHTML = html;

            // diplay, event listeners
            setTimeout(() => {
                document.getElementById('reviewModal').style.display = 'block';
                document.getElementById('modalOverlay').style.display = 'block';

                document.querySelector(".close-button").addEventListener("click", closeModal);
                document.getElementById("modalOverlay").addEventListener("click", closeModal);
                document.getElementById("submitReviewButton").addEventListener("click", submitReview);
                
                // preview image
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
        const formData = new FormData();
        formData.append('serviceName', service);
        formData.append('title', title); 
        formData.append('review', review);
        formData.append('starRating', stars);
        formData.append('locationId', locationId);
        
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
            window.location.reload(); 
        } else {
            alert("Review failed: " + (data.message));
        }
    } catch(error) {
        console.error("Error during fetch:", error);
    }
}

function getLocationIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('locationId');
}