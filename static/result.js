const topUserName = document.getElementById("top-user-name");
const dropdownBtn = document.querySelector(".dropdown-btn");
const dropdownContent = document.querySelector(".dropdown-content");
const dropdownLinks = document.querySelectorAll(".dropdown-content a");
const arrowSvg = document.querySelector(".arrow");

dropdownBtn.addEventListener("click", function (event) {
  event.stopPropagation();
  dropdownContent.classList.toggle("show");
  arrowSvg.classList.toggle("routed"); 
});

window.addEventListener("click", function (event) {
  if (!event.target.matches(".dropdown-btn")) {
    dropdownContent.classList.remove("show");
    arrowSvg.classList.remove("routed");
  }
}); 
