const sitePages = [
  ["home", "Home", "index.html"],
  ["about", "About us", "about.html"],
  ["courts", "Courts", "courts.html"],
  ["events", "Events", "events.html"],
  ["learn", "Learn", "learn.html"],
  ["gallery", "Gallery", "gallery.html"],
  ["contact", "Contact", "contact.html"],
];

const pageName = document.body.dataset.page || "home";
const navMarkup = sitePages.map(([key, label, url]) => {
  const active = pageName === key;
  return `<a class="nav-link${active ? " active" : ""}" href="${url}"${active ? ' aria-current="page"' : ""}>${label}</a>`;
}).join("");

document.querySelector("[data-site-header]").innerHTML = `
  <header class="site-header">
    <a class="brand" href="index.html" aria-label="Pickle Go Club home"><span class="brand-ball" aria-hidden="true"><i></i></span><span>pickle<span class="brand-light">go</span><small>CLUB</small></span></a>
    <button class="menu-toggle" id="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav" aria-label="Open navigation"><span></span><span></span></button>
    <nav class="site-nav" id="site-nav" aria-label="Main navigation">${navMarkup}</nav>
    <a class="header-join" href="profile.html">My player card <span>↗</span></a>
  </header>`;

document.querySelector("[data-site-footer]").innerHTML = `
  <footer class="site-footer">
    <div class="wrap footer-top"><a class="brand footer-brand" href="index.html"><span class="brand-ball" aria-hidden="true"><i></i></span><span>pickle<span class="brand-light">go</span><small>CLUB</small></span></a><p>Good people. Great rallies. One more game.</p><a href="index.html">Back to home ↑</a></div>
    <div class="wrap footer-bottom"><span>© <span id="footer-year"></span> Pickle Go Club · Sample club website</span><span>Made for the love of the game <b>♥</b></span></div>
  </footer>`;

document.querySelector("#footer-year").textContent = String(new Date().getFullYear());
document.body.insertAdjacentHTML("beforeend", '<div class="toast" id="toast" role="status" aria-live="polite"></div>');
const menuToggle = document.querySelector("#menu-toggle");
menuToggle.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") !== "true";
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
  document.querySelector("#site-nav").classList.toggle("open", open);
});
document.querySelectorAll("#site-nav .nav-link").forEach((link) => link.addEventListener("click", () => {
  document.querySelector("#site-nav").classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
}));
