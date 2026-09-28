/* ==========================================
   LUXORA JEWELS
   JAVASCRIPT
========================================== */


/* ==========================================
   MOBILE MENU
========================================== */

const menuBtn = document.getElementById("menuBtn");
const nav = document.getElementById("nav");

if (menuBtn && nav) {

  menuBtn.addEventListener("click", () => {

    nav.classList.toggle("active");

    if (nav.classList.contains("active")) {
      menuBtn.textContent = "✕";
    } else {
      menuBtn.textContent = "☰";
    }

  });


  /* Close menu after clicking a link */

  const navLinks = nav.querySelectorAll("a");

  navLinks.forEach((link) => {

    link.addEventListener("click", () => {

      nav.classList.remove("active");

      menuBtn.textContent = "☰";

    });

  });

}


/* ==========================================
   CURRENT YEAR
========================================== */

const year = document.getElementById("year");

if (year) {
  year.textContent = new Date().getFullYear();
}


/* ==========================================
   HEADER SCROLL EFFECT
========================================== */

const header = document.querySelector(".header");

window.addEventListener("scroll", () => {

  if (!header) return;

  if (window.scrollY > 50) {

    header.style.background =
      "rgba(8, 7, 9, 0.97)";

  } else {

    header.style.background =
      "rgba(12, 11, 13, 0.92)";

  }

});


/* ==========================================
   SIMPLE REVEAL ANIMATION
========================================== */

const revealElements =
  document.querySelectorAll(
    ".product-card, .feature-card, .review-card, .gallery-item"
  );


const revealObserver =
  new IntersectionObserver(
    (entries, observer) => {

      entries.forEach((entry) => {

        if (entry.isIntersecting) {

          entry.target.style.opacity = "1";

          entry.target.style.transform =
            "translateY(0)";

          observer.unobserve(entry.target);

        }

      });

    },
    {
      threshold: 0.12
    }
  );


revealElements.forEach((element) => {

  element.style.opacity = "0";

  element.style.transform =
    "translateY(25px)";

  element.style.transition =
    "opacity 0.7s ease, transform 0.7s ease";

  revealObserver.observe(element);

});
