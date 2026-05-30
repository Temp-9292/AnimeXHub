// AnimeXHub Script
const SHEET_ID = '1uUGWMgw8oNTswDJBz8se0HxPMEqRk0keJtFNlhaZoj0';
let allAnime = [];
let slides = [];
let currentSlide = 0;
let autoSlideInterval;

document.addEventListener('DOMContentLoaded', () => {
  fetchAnimeData();
  fetchSlidesData();
  setupEventListeners();
});

// ---------- FETCH DATA ----------
function fetchAnimeData() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=Sheet1&tq=select%20*`;
  fetch(url)
    .then(res => res.text())
    .then(rep => {
      const json = JSON.parse(rep.substring(47).slice(0, -2));
      allAnime = json.table.rows.map(row => row.c.map(cell => cell ? cell.v : '')).slice(1);
      renderAnimeCards(allAnime);
    })
    .catch(err => console.error('Anime fetch error:', err));
}

function fetchSlidesData() {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=Sheet2&tq=select%20*`;
  fetch(url)
    .then(res => res.text())
    .then(rep => {
      const json = JSON.parse(rep.substring(47).slice(0, -2));
      slides = json.table.rows.map(row => row.c.map(cell => cell ? cell.v : '')).slice(1);
      renderCarousel();
    })
    .catch(err => console.error('Slides fetch error:', err));
}

// ---------- RENDER CARDS ----------
function renderAnimeCards(data) {
  const container = document.getElementById('anime-list');
  if (!container) return;
  if (!data.length) {
    container.innerHTML = `<div class="no-results">✨ No anime found. Try a different search!</div>`;
    return;
  }
  let html = '';
  data.forEach(item => {
    const [no, thumb, name, desc, link] = item;
    const short = desc.length > 120 ? desc.slice(0, 120) + '...' : desc;
    const hasMore = desc.length > 120;
    html += `
      <div class="anime-card" data-name="${name.toLowerCase()}">
        <div class="thumb"><img src="${thumb}" alt="${name}" loading="lazy"></div>
        <h3>${name}</h3>
        <div class="description-container">
          <p class="short-desc">${short}</p>
          ${hasMore ? `<button class="read-more-btn">Read more</button>` : ''}
          <p class="full-desc" style="display:none;">${desc}</p>
        </div>
        <div class="actions">
          <a href="${link}" class="watch-btn" target="_blank">Watch Now</a>
          <span class="meta-small">#${no}</span>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
  attachReadMoreEvents();
}

function attachReadMoreEvents() {
  document.querySelectorAll('.read-more-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const container = btn.closest('.description-container');
      const shortP = container.querySelector('.short-desc');
      const fullP = container.querySelector('.full-desc');
      if (btn.textContent === 'Read more') {
        shortP.style.display = 'none';
        fullP.style.display = 'block';
        btn.textContent = 'Read less';
      } else {
        shortP.style.display = 'block';
        fullP.style.display = 'none';
        btn.textContent = 'Read more';
      }
    });
  });
}

// ---------- CAROUSEL ----------
function renderCarousel() {
  const track = document.getElementById('carousel-track');
  const dotsContainer = document.getElementById('carousel-dots');
  if (!track || !dotsContainer) return;
  track.innerHTML = '';
  slides.forEach(slide => {
    const [_, thumb, title, desc] = slide;
    const slideDiv = document.createElement('div');
    slideDiv.className = 'slide';
    slideDiv.style.backgroundImage = `url('${thumb}')`;
    slideDiv.innerHTML = `<div class="meta"><h3>${title}</h3><p>${desc}</p></div>`;
    track.appendChild(slideDiv);
  });
  dotsContainer.innerHTML = '';
  slides.forEach((_, idx) => {
    const dot = document.createElement('div');
    dot.classList.add('dot');
    if (idx === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToSlide(idx));
    dotsContainer.appendChild(dot);
  });
  setupCarouselControls();
  updateCarousel();
  startAutoSlide();
}

function setupCarouselControls() {
  const prev = document.getElementById('carousel-prev');
  const next = document.getElementById('carousel-next');
  if (prev) prev.addEventListener('click', () => { stopAutoSlide(); prevSlide(); startAutoSlide(); });
  if (next) next.addEventListener('click', () => { stopAutoSlide(); nextSlide(); startAutoSlide(); });
}

function updateCarousel() {
  const track = document.getElementById('carousel-track');
  const dots = document.querySelectorAll('.dot');
  if (!track) return;
  track.style.transform = `translateX(-${currentSlide * 100}%)`;
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });
}

function nextSlide() {
  currentSlide = (currentSlide + 1) % slides.length;
  updateCarousel();
}
function prevSlide() {
  currentSlide = (currentSlide - 1 + slides.length) % slides.length;
  updateCarousel();
}
function goToSlide(index) {
  stopAutoSlide();
  currentSlide = index;
  updateCarousel();
  startAutoSlide();
}
function startAutoSlide() {
  if (autoSlideInterval) clearInterval(autoSlideInterval);
  autoSlideInterval = setInterval(() => nextSlide(), 5000);
}
function stopAutoSlide() {
  if (autoSlideInterval) clearInterval(autoSlideInterval);
}

// ---------- SEARCH + NAVBAR ----------
function setupEventListeners() {
  const menuBtn = document.getElementById('menu-btn');
  const searchBtn = document.getElementById('search-btn');
  const searchInput = document.getElementById('search-input');
  const navbar = document.getElementById('side-navbar');

  if (menuBtn) {
    menuBtn.addEventListener('click', () => navbar.classList.toggle('active'));
  }
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const isVisible = searchInput.style.display === 'block';
      searchInput.style.display = isVisible ? 'none' : 'block';
      if (!isVisible) {
        searchInput.focus();
        searchInput.value = '';
        renderAnimeCards(allAnime);
      } else {
        searchInput.value = '';
        renderAnimeCards(allAnime);
      }
    });
  }
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.trim().toLowerCase();
      if (term === '') renderAnimeCards(allAnime);
      else {
        const filtered = allAnime.filter(anime => anime[2].toLowerCase().includes(term));
        renderAnimeCards(filtered);
      }
    });
  }
  // Close navbar on outside click
  document.addEventListener('click', (e) => {
    if (navbar && navbar.classList.contains('active') && !navbar.contains(e.target) && !menuBtn.contains(e.target)) {
      navbar.classList.remove('active');
    }
  });
  // Escape key to close search & navbar
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (searchInput && searchInput.style.display === 'block') {
        searchInput.style.display = 'none';
        searchInput.value = '';
        renderAnimeCards(allAnime);
      }
      if (navbar) navbar.classList.remove('active');
    }
  });
}
