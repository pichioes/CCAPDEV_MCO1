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
    let service = document.getElementById("serviceSelect").value;
    let review = document.getElementById("reviewText").value;
    let stars = document.querySelectorAll(".star.active").length;

    if (service === "" || review.trim() === "" || stars === 0) {
        alert("Please fill out all fields and select a star rating.");
        return;
    }

    const formData = {
        serviceName: service,
        review: review,
        starRating: stars,
        imageUrl: "" // You can add file upload logic later if needed
    };

    try{

        const response = await fetch("/addreview", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData)
        })

        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            alert("button works");
            closeModal(); // Close the modal after success
            window.location.reload(); // Redirect to user page
        } else {
            alert("Review failed: " + (data.message || "Unknown error"));
        }

    }catch(error){
        console.error("Error during fetch:", error);
        alert("An error occurred trying to submit a review.");

       
    }

    /*fetch("/addreview", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        closeModal();
    })
    .catch(err => {
        console.error(err);
        alert("Error submitting review.");
    });
    fetch("/addreview", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
    })
    .then(res => {
        if (res.status === 401) {
            alert("You must be logged in to post a review.");
            window.location.href = "/login.html"; // Redirect to login
            throw new Error("Not authenticated");
            }
            return res.json();
        })
    .then(data => {
        alert(data.message);
        closeModal();
    })
    .catch(err => {
        console.error(err);
        if (err.message !== "Not authenticated") {
            alert("Error submitting review.");
        }
     });*/


}

