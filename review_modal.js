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
    fetch('review_modal.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('reviewModalContainer').innerHTML = html;

            setTimeout(() => {
                document.getElementById('reviewModal').style.display = 'block';
                document.getElementById('modalOverlay').style.display = 'block';

                document.querySelector(".close-button").addEventListener("click", closeModal);
                document.getElementById("modalOverlay").addEventListener("click", closeModal);
                document.querySelector("#submitReviewButton").addEventListener("click", submitReview);

                initializeStarRating();
            }, 0);
        });
}

function closeModal() {
    document.getElementById('reviewModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
}

function submitReview(event) {
    event.preventDefault(); 

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
        imageUrl: "" // you can add upload logic later
    };

    fetch("/addreview", {
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
}
