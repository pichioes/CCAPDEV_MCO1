function loadModal() {
    fetch('change_picture.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('reviewModalContainer').innerHTML = html;

            setTimeout(() => {
                document.getElementById('reviewModal').style.display = 'block';
                document.getElementById('modalOverlay').style.display = 'block';

                document.querySelector(".close-button").addEventListener("click", closeModal);
                document.getElementById("modalOverlay").addEventListener("click", closeModal);
                document.querySelector("#submitReviewButton").addEventListener("click", submitProfilePicture);
            }, 0);
        });
}

function closeModal() {
    document.getElementById('reviewModal').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'none';
}

async function submitProfilePicture(event) {
    event.preventDefault();

    let fileInput = document.getElementById("reviewImage");
    let file = fileInput.files[0];

    if (!file) {
        alert("Please select an image.");
        return;
    }

    try {
        // Option 1: Use FormData to send the file directly
        const formData = new FormData();
        formData.append('profilePicture', file);

        const response = await fetch('/update-profile-picture', {
            method: 'POST',
            body: formData
        });

        // Option 2: Send as base64 if you prefer that method
        // let reader = new FileReader();
        // reader.onload = async function(e) {
        //     const imageData = e.target.result;
        //     const response = await fetch('/update-profile-picture-base64', {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json'
        //         },
        //         body: JSON.stringify({ imageData })
        //     });
        // };
        // reader.readAsDataURL(file);

        if (response.ok) {
            const data = await response.json();
            // Update the profile picture on the page
            document.querySelector(".profile-img").src = data.profilePicture;
            alert("Profile picture updated successfully!");
            closeModal();
        } else {
            const errorData = await response.json();
            alert(`Error: ${errorData.message}`);
        }
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        alert("Failed to update profile picture. Please try again.");
    }
}

// Now let's modify the profile loading script to also load the profile picture
// Add this to your existing DOMContentLoaded event listener in the HTML file:

document.addEventListener("DOMContentLoaded", async function () {
    try {
        const response = await fetch("/profile");
        if (!response.ok) {
            alert("You must be logged in to view this page.");
            window.location.href = "login.html"; // Redirect to login page
            return;
        }

        const user = await response.json();
        
        // Set username and description
        document.querySelector("h2").textContent = user.username;
        document.querySelector(".description").textContent = user.description;
        
        // Set profile picture if available
        if (user.profilePicture) {
            document.getElementById("profilePic").src = user.profilePicture;
        }
        // If no profile picture, keep the default one
    } catch (error) {
        console.error("Error fetching profile:", error);
        alert("Error loading profile.");
    }
});