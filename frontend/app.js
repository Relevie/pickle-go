const STORAGE_KEY = "pickle-go-dashboard-v1";
const sampleProfile = { name: "Taylor Reed", location: "Philippines", rating: "4.18", wins: 17, losses: 8, streak: 3 };
const sampleMatches = [
  { opponent: "Kai & Mina", score: "11 – 8", result: "W", format: "Doubles", daysAgo: 4 },
  { opponent: "Sam & Jo", score: "7 – 11", result: "L", format: "Doubles", daysAgo: 7 },
  { opponent: "Chris Wu", score: "11 – 5", result: "W", format: "Singles", daysAgo: 10 },
  { opponent: "Mei & Ava", score: "11 – 9", result: "W", format: "Doubles", daysAgo: 14 },
];
const courtData = [];
const bracketTeams = { semi1: ["Kitchen Crew", "Dink Dynasty"], semi2: ["Court Queens", "Spin Doctors"] };
const $ = (selector) => document.querySelector(selector);
const mapsSearchUrl = (query) => `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
let toastTimer;

function readSavedState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return { profile: { ...sampleProfile }, matches: [], savedEvents: [] };
    return {
      profile: { ...sampleProfile, ...(saved.profile || {}) },
      matches: Array.isArray(saved.matches) ? saved.matches : [],
      savedEvents: Array.isArray(saved.savedEvents) ? saved.savedEvents : [],
    };
  } catch {
    return { profile: { ...sampleProfile }, matches: [], savedEvents: [] };
  }
}

const state = readSavedState();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    showToast("Could not save on this device. Check your browser storage settings.");
  }
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function localDate(offsetDays = 0) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offsetDays);
  return date;
}

function dateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function prettyDate(date, options = { month: "short", day: "numeric" }) {
  return new Intl.DateTimeFormat(undefined, options).format(date);
}

function renderProfile() {
  const profile = state.profile;
  const initials = profile.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase() || "PG";
  $("#player-name").textContent = profile.name;
  $("#home-location").textContent = profile.location || "Add your home area";
  $("#hero-avatar").textContent = initials;
  $("#dupr-rating").textContent = profile.rating || "—";
  const wins = Number(profile.wins) + state.matches.filter((match) => match.result === "W").length;
  const losses = Number(profile.losses) + state.matches.filter((match) => match.result === "L").length;
  const games = wins + losses;
  $("#win-record").textContent = wins;
  $("#loss-record").textContent = losses;
  $("#games-played").textContent = games;
  $("#win-rate").innerHTML = `${games ? Math.round((wins / games) * 100) : 0}<span>%</span>`;
  const newestFirst = [...state.matches].sort((a, b) => b.date.localeCompare(a.date));
  let streak = Number(profile.streak);
  if (newestFirst.length) {
    const result = newestFirst[0].result;
    streak = 0;
    for (const match of newestFirst) {
      if (match.result !== result) break;
      streak += result === "W" ? 1 : -1;
    }
  }
  $("#streak-count").innerHTML = `${Math.abs(streak)}<span>${streak < 0 ? "L" : "W"}</span>`;
}

function renderMatches() {
  const list = $("#history-list");
  const custom = state.matches.map((match) => ({ ...match, custom: true }));
  const samples = sampleMatches.map((match) => ({ ...match, date: dateInputValue(localDate(-match.daysAgo)), custom: false }));
  const matches = [...custom, ...samples].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  if (!matches.length) {
    list.innerHTML = '<p class="history-empty">No games yet. Log your first match to start your history.</p>';
    return;
  }
  list.innerHTML = matches.map((match) => {
    const date = new Date(`${match.date}T12:00:00`);
    const resultClass = match.result === "W" ? "win" : "loss";
    return `<article class="history-item"><div class="history-date"><strong>${prettyDate(date, { day: "numeric" })}</strong><span>${prettyDate(date, { month: "short" })}</span></div><div class="match-people"><strong>${escapeHtml(match.opponent)}</strong><span>${match.custom ? "Your game" : "Sample game"}</span></div><div class="match-result"><span class="result-pill ${resultClass}">${match.result === "W" ? "WIN" : "LOSS"}</span><span class="match-score">${escapeHtml(match.score)}</span></div><span class="match-type">${escapeHtml(match.format || "Doubles")}</span></article>`;
  }).join("");
}

function setupProfilePage() {
  if (!$("#player-name")) return;
  renderProfile();
  renderMatches();
  const profileDialog = $("#profile-dialog");
  const gameDialog = $("#game-dialog");
  const openProfile = () => {
    $("#profile-name-input").value = state.profile.name;
    $("#profile-location-input").value = state.profile.location;
    $("#profile-rating-input").value = state.profile.rating;
    profileDialog.showModal();
  };
  const openGame = () => {
    $("#game-form").reset();
    $("#game-date").value = dateInputValue(localDate());
    gameDialog.showModal();
  };

  $("#edit-profile-card").addEventListener("click", openProfile);
  $("#update-rating-button").addEventListener("click", openProfile);
  $("#log-game-button").addEventListener("click", openGame);
  $("#log-another-game").addEventListener("click", openGame);
  $("#profile-form").addEventListener("submit", (event) => {
    if (event.submitter?.value !== "save") return;
    event.preventDefault();
    const rating = $("#profile-rating-input").value.trim();
    if (rating && (Number(rating) < 1 || Number(rating) > 8)) {
      $("#profile-rating-input").setCustomValidity("Enter a rating between 1 and 8.");
      $("#profile-rating-input").reportValidity();
      return;
    }
    $("#profile-rating-input").setCustomValidity("");
    state.profile.name = $("#profile-name-input").value.trim() || sampleProfile.name;
    state.profile.location = $("#profile-location-input").value.trim();
    state.profile.rating = rating;
    persist();
    renderProfile();
    profileDialog.close();
    showToast("Your profile is saved on this device.");
  });
  $("#profile-rating-input").addEventListener("input", (event) => event.currentTarget.setCustomValidity(""));
  $("#game-form").addEventListener("submit", (event) => {
    if (event.submitter?.value !== "save") return;
    event.preventDefault();
    const ourScore = Number($("#our-score").value);
    const theirScore = Number($("#their-score").value);
    if (ourScore === theirScore) {
      $("#their-score").setCustomValidity("A game needs a winner. Scores cannot be tied.");
      $("#their-score").reportValidity();
      return;
    }
    $("#their-score").setCustomValidity("");
    state.matches.push({
      opponent: $("#game-opponent").value.trim(),
      score: `${ourScore} – ${theirScore}`,
      result: ourScore > theirScore ? "W" : "L",
      format: "Doubles",
      date: $("#game-date").value,
    });
    persist();
    renderProfile();
    renderMatches();
    gameDialog.close();
    showToast("Game saved to your player history.");
  });
  $("#their-score").addEventListener("input", (event) => event.currentTarget.setCustomValidity(""));
}

let userCoords = null;
function setupCourtsPage() {
  if (!($("#court-list") && $("#location-input"))) return;
  $("#location-input").value ||= "Philippines";
  const render = () => {
    const filtered = courtData;
    $("#court-count").textContent = filtered.length ? String(filtered.length).padStart(2, "0") : "—";
    $("#court-list").innerHTML = filtered.length ? filtered.map((court) => `<a class="court-item" href="${mapsSearchUrl(court.query)}" target="_blank" rel="noreferrer"><div><strong>${escapeHtml(court.name)}</strong><span>${escapeHtml(court.area)}</span></div><span class="court-distance">${court.distance}</span></a>`).join("") : '<p class="court-empty">No local court listings are connected yet. Use the map search to find courts in your area.</p>';
  };
  const updateMapLink = () => {
    const location = $("#location-input").value.trim();
    const destination = userCoords ? `${userCoords.latitude},${userCoords.longitude}` : location || "near me";
    $("#maps-link").href = mapsSearchUrl(`pickleball courts near ${destination}`);
  };
  $("#location-input").addEventListener("input", () => { userCoords = null; updateMapLink(); });
  $("#near-me-button").addEventListener("click", () => {
    if (!navigator.geolocation) { showToast("Location is not available in this browser."); return; }
    showToast("Finding your location…");
    navigator.geolocation.getCurrentPosition((position) => {
      userCoords = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      $("#location-input").value = "Near me";
      updateMapLink();
      showToast("Map search centered on your location.");
    }, () => showToast("Location access was unavailable. Enter a city or area instead."), { enableHighAccuracy: false, timeout: 9000, maximumAge: 300000 });
  });
  render();
  updateMapLink();
}

function daysUntilWeekday(weekday) {
  const days = (weekday - new Date().getDay() + 7) % 7;
  return days || 7;
}

const demoEvents = [
  { offset: 0, time: "6:00 PM", name: "After-work open play", category: "open-play", venue: "Sample venue · Philippines", level: "Intermediate", spots: 4, query: "pickleball open play Philippines", description: "Shake off the day with relaxed doubles and a friendly group." },
  { offset: 2, time: "7:00 PM", name: "Friendly doubles mixer", category: "open-play", venue: "Sample venue · Philippines", level: "All levels", spots: 6, query: "pickleball open play Philippines", description: "Rotate partners, meet new players, and keep the rallies going." },
  { offset: daysUntilWeekday(6), time: "9:30 AM", name: "Saturday morning rally", category: "open-play", venue: "Sample venue · Philippines", level: "Social · all levels", spots: 3, query: "pickleball open play Philippines", description: "A low-pressure morning session with plenty of play time." },
  { offset: 7, time: "10:00 AM", name: "Pickle Go Fall Cup", category: "tournament", venue: "Sample venue · Philippines", level: "Intermediate doubles", spots: 8, query: "pickleball tournament Philippines", description: "A friendly round-robin day with medals and a club lunch." },
  { offset: 9, time: "5:30 PM", name: "First paddle clinic", category: "clinic", venue: "Sample venue · Philippines", level: "Beginner friendly", spots: 5, query: "pickleball beginner clinic Philippines", description: "Learn the serve, kitchen, and scoring with a patient coach." },
];

function setupEventsPage() {
  const eventGrid = $("#event-grid");
  if (!eventGrid) return;
  let category = "all";
  let searchQuery = "";
  const renderEvents = () => {
    const search = searchQuery.trim().toLowerCase();
    const filtered = demoEvents.filter((event) => (category === "all" || event.category === category) && (!search || `${event.name} ${event.venue} ${event.level}`.toLowerCase().includes(search)));
    if (!filtered.length) { eventGrid.innerHTML = '<p class="event-empty">No sample events match. Try another category or search.</p>'; return; }
    eventGrid.innerHTML = filtered.map((event) => {
      const date = localDate(event.offset);
      const saved = state.savedEvents.includes(event.name);
      const label = event.category === "open-play" ? "Open play" : event.category;
      return `<article class="event-card"><div class="event-card-top"><span class="event-category ${event.category}">${label}</span><span class="event-date">${prettyDate(date, { weekday: "short", month: "short", day: "numeric" })}</span></div><h3>${escapeHtml(event.name)}</h3><p>${escapeHtml(event.description)}</p><div class="event-card-meta"><span>${escapeHtml(event.time)}</span><span>${escapeHtml(event.level)}</span><span>${event.spots} sample spots</span></div><div class="event-card-bottom"><a class="event-venue" href="${mapsSearchUrl(event.query)}" target="_blank" rel="noreferrer">${escapeHtml(event.venue)} ↗</a><button class="join-button ${saved ? "joined" : ""}" type="button" data-save-event="${escapeHtml(event.name)}" aria-pressed="${saved}">${saved ? "Saved" : "Save"}</button></div></article>`;
    }).join("");
    eventGrid.querySelectorAll("[data-save-event]").forEach((button) => button.addEventListener("click", () => {
      const name = button.dataset.saveEvent;
      state.savedEvents = state.savedEvents.includes(name) ? state.savedEvents.filter((savedName) => savedName !== name) : [...state.savedEvents, name];
      persist();
      renderEvents();
      showToast(state.savedEvents.includes(name) ? "Event saved on this device." : "Event removed from your saved list.");
    }));
  };
  document.querySelectorAll(".event-filter").forEach((filter) => filter.addEventListener("click", () => {
    category = filter.dataset.category;
    document.querySelectorAll(".event-filter").forEach((other) => {
      const active = other === filter;
      other.classList.toggle("active", active);
      other.setAttribute("aria-selected", String(active));
    });
    renderEvents();
  }));
  $("#event-search").addEventListener("input", (event) => { searchQuery = event.currentTarget.value; renderEvents(); });

  const bracketBoard = $("#bracket-board");
  let winners = { semi1: null, semi2: null, final: null };
  const renderBracket = () => {
    const first = winners.semi1;
    const second = winners.semi2;
    const renderMatch = (id, teams, winner) => `<div class="bracket-match">${teams.map((team) => `<button class="bracket-team ${winner === team ? "winner" : ""}" type="button" data-match="${id}" data-team="${escapeHtml(team)}" aria-pressed="${winner === team}">${escapeHtml(team)}<span>${winner === team ? "✓" : ""}</span></button>`).join("")}</div>`;
    const finalistTeams = first && second ? [first, second] : [];
    const finalMatch = finalistTeams.length ? renderMatch("final", finalistTeams, winners.final) : '<div class="bracket-match"><strong>Final matchup</strong><small>Choose both semi-final winners</small></div>';
    const champion = winners.final ? `<div class="bracket-champion">✳ CHAMPION</div>` : "";
    bracketBoard.innerHTML = `<div class="bracket-round"><span class="bracket-round-title">SEMI-FINALS</span>${renderMatch("semi1", bracketTeams.semi1, first)}${renderMatch("semi2", bracketTeams.semi2, second)}</div><div class="bracket-connector" aria-hidden="true"></div><div class="bracket-round bracket-final"><span class="bracket-round-title">FINAL</span>${finalMatch}</div><div class="bracket-connector" aria-hidden="true"></div><div class="bracket-round bracket-final"><span class="bracket-round-title">CLUB CHAMPION</span><div class="bracket-match"><strong>${escapeHtml(winners.final || "The winner takes it")}</strong><small>${winners.final ? "Sample bracket champion" : "Pick the final winner"}</small>${champion}</div></div>`;
    bracketBoard.querySelectorAll("[data-match]").forEach((button) => button.addEventListener("click", () => {
      const { match, team } = button.dataset;
      winners[match] = team;
      if (match === "semi1" && winners.final && winners.final !== team && winners.final !== winners.semi2) winners.final = null;
      if (match === "semi2" && winners.final && winners.final !== team && winners.final !== winners.semi1) winners.final = null;
      renderBracket();
    }));
  };
  $("#bracket-reset").addEventListener("click", () => { winners = { semi1: null, semi2: null, final: null }; renderBracket(); });
  renderEvents();
  renderBracket();
}

function setupGalleryPage() {
  const slides = [...document.querySelectorAll(".gallery-slide")];
  if (!slides.length) return;
  const dots = [...document.querySelectorAll("#gallery-dots button")];
  let index = 0;
  const render = () => {
    slides.forEach((slide, i) => slide.classList.toggle("active", i === index));
    dots.forEach((dot, i) => { dot.classList.toggle("active", i === index); dot.setAttribute("aria-pressed", String(i === index)); });
    $("#gallery-index").innerHTML = `${String(index + 1).padStart(2, "0")} <i>/</i> ${String(slides.length).padStart(2, "0")}`;
  };
  $("#gallery-prev").addEventListener("click", () => { index = (index - 1 + slides.length) % slides.length; render(); });
  $("#gallery-next").addEventListener("click", () => { index = (index + 1) % slides.length; render(); });
  dots.forEach((dot, i) => dot.addEventListener("click", () => { index = i; render(); }));
  render();
}

function setupContactPage() {
  const formElement = $("#contact-form");
  if (!formElement) return;
  formElement.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(formElement);
    const subject = `Pickle Go Club note from ${form.get("name")}`;
    const body = `Name: ${form.get("name")}\nEmail: ${form.get("email")}\n\n${form.get("message")}`;
    window.location.href = `mailto:hello@pickle-go.example?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    showToast("Your email app will open with this message ready to send.");
  });
}

setupProfilePage();
setupCourtsPage();
setupEventsPage();
setupGalleryPage();
setupContactPage();
