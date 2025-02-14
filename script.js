const nav = document.querySelector('.navbar')
fetch('/partials/navbar.html')
.then(res=>res.text())
.then(data=>{
    nav.innerHTML=data
})