// JavaScript logic for Kad Undangan & Guestbook Kahwin Aiman & Afrina

document.addEventListener('DOMContentLoaded', () => {
  // 1. References to DOM Elements
  const openingOverlay = document.getElementById('opening-overlay');
  const btnOpen = document.getElementById('btn-open');
  const bgMusic = document.getElementById('bg-music');
  const musicToggle = document.getElementById('music-toggle');
  const rsvpForm = document.getElementById('rsvp-form');
  const rsvpSuccess = document.getElementById('rsvp-success');
  const wishForm = document.getElementById('wish-form');
  const wishListContainer = document.getElementById('wish-list-container');
  const toast = document.getElementById('toast');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');

  let isPlaying = false;

  // 2. Open Invitation Button
  if (btnOpen) {
    btnOpen.addEventListener('click', () => {
      openingOverlay.classList.add('hidden');
      playAudio();
      // Trigger subtle particle/confetti effect if desired
      spawnsPetals();
    });
  }

  // 3. Audio Controller
  function playAudio() {
    if (bgMusic) {
      bgMusic.play().then(() => {
        isPlaying = true;
        if (musicToggle) musicToggle.classList.add('playing');
      }).catch(err => {
        console.log('Autoplay prevented by browser:', err);
      });
    }
  }

  function pauseAudio() {
    if (bgMusic) {
      bgMusic.pause();
      isPlaying = false;
      if (musicToggle) musicToggle.classList.remove('playing');
    }
  }

  if (musicToggle) {
    musicToggle.addEventListener('click', () => {
      if (isPlaying) {
        pauseAudio();
      } else {
        playAudio();
      }
    });
  }

  // 4. Countdown Timer Logic (Wedding Date: 24 Disember 2026, 11:00 AM)
  const targetDate = new Date('December 24, 2026 11:00:00').getTime();

  function updateCountdown() {
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference < 0) {
      document.getElementById('days').innerText = '00';
      document.getElementById('hours').innerText = '00';
      document.getElementById('minutes').innerText = '00';
      document.getElementById('seconds').innerText = '00';
      return;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    document.getElementById('days').innerText = days < 10 ? '0' + days : days;
    document.getElementById('hours').innerText = hours < 10 ? '0' + hours : hours;
    document.getElementById('minutes').innerText = minutes < 10 ? '0' + minutes : minutes;
    document.getElementById('seconds').innerText = seconds < 10 ? '0' + seconds : seconds;
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();

  // 5. Toast Message Helper
  window.showToast = function(message) {
    if (!toast) return;
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  };

  // 6. Copy Bank Account Number
  window.copyBankAcc = function(accNumber) {
    navigator.clipboard.writeText(accNumber).then(() => {
      showToast('Nombor Akaun ' + accNumber + ' berjaya disalin!');
    }).catch(err => {
      showToast('Berjaya disalin: ' + accNumber);
    });
  };

  // 7. Initial Guestbook Wishes Data (Pre-populated for instant beautiful view)
  const defaultWishes = [
    {
      name: "Dato' & Datin Iskandar",
      time: "Baru sahaja",
      text: "Selamat Pengantin Baru Aiman & Afrina. Semoga perkahwinan ini dilimpahi rahmat, mawaddah wa rahmah hingga ke syurga.",
      likes: 12,
      liked: false
    },
    {
      name: "Siti Sarah & Keluarga",
      time: "2 jam yang lalu",
      text: "Tahniah pasangan sejoli! Cantik sangat pelamin & pengantin hari ni. Semoga kekal bahagia bersama sehingga ke anak cucu.",
      likes: 8,
      liked: true
    },
    {
      name: "Khairul & Rakan Kolej",
      time: "5 jam yang lalu",
      text: "Akhirnya bro Aiman kawin jugak! Congrats man, semoga dipermudahkan segala urusan majlis & perkahwinan bro!",
      likes: 15,
      liked: false
    }
  ];

  // Load stored wishes or use defaults
  let wishes = JSON.parse(localStorage.getItem('aiman_afrina_wishes')) || defaultWishes;

  function renderWishes() {
    if (!wishListContainer) return;
    wishListContainer.innerHTML = '';

    wishes.forEach((item, index) => {
      const initial = item.name.charAt(0).toUpperCase();
      const card = document.createElement('div');
      card.className = 'wish-card';
      card.innerHTML = `
        <div class="wish-header">
          <div class="wish-author">
            <div class="avatar-chip">${initial}</div>
            <span>${escapeHtml(item.name)}</span>
          </div>
          <span class="wish-time">${item.time}</span>
        </div>
        <p class="wish-text">${escapeHtml(item.text)}</p>
        <button class="wish-like-btn ${item.liked ? 'liked' : ''}" onclick="toggleLike(${index})">
          <i class="fa-solid fa-heart"></i> <span id="like-count-${index}">${item.likes}</span> Sukai
        </button>
      `;
      wishListContainer.appendChild(card);
    });
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  window.toggleLike = function(index) {
    if (wishes[index].liked) {
      wishes[index].likes--;
      wishes[index].liked = false;
    } else {
      wishes[index].likes++;
      wishes[index].liked = true;
    }
    localStorage.setItem('aiman_afrina_wishes', JSON.stringify(wishes));
    renderWishes();
  };

  renderWishes();

  // 8. Wish Form Submit Handler
  if (wishForm) {
    wishForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('wish-name');
      const textInput = document.getElementById('wish-message');

      if (!nameInput.value.trim() || !textInput.value.trim()) {
        showToast('Sila isi nama dan ucapan anda');
        return;
      }

      const newWish = {
        name: nameInput.value.trim(),
        time: "Baru sahaja",
        text: textInput.value.trim(),
        likes: 0,
        liked: false
      };

      wishes.unshift(newWish);
      localStorage.setItem('aiman_afrina_wishes', JSON.stringify(wishes));
      renderWishes();

      nameInput.value = '';
      textInput.value = '';
      showToast('Terima kasih! Ucapan anda telah dihantar ❤️');
    });
  }

  // 9. RSVP Form Submit Handler
  if (rsvpForm) {
    rsvpForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('rsvp-name').value.trim();
      const phone = document.getElementById('rsvp-phone').value.trim();
      const attendance = document.getElementById('rsvp-attendance').value;
      const pax = document.getElementById('rsvp-pax').value;

      if (!name || !attendance) {
        showToast('Sila lengkapkan borang RSVP');
        return;
      }

      const rsvpData = { name, phone, attendance, pax, date: new Date().toISOString() };
      
      // Store in local storage for demonstration
      const savedRSVPs = JSON.parse(localStorage.getItem('aiman_afrina_rsvps')) || [];
      savedRSVPs.push(rsvpData);
      localStorage.setItem('aiman_afrina_rsvps', JSON.stringify(savedRSVPs));

      rsvpForm.reset();
      if (rsvpSuccess) {
        rsvpSuccess.style.display = 'block';
        rsvpSuccess.scrollIntoView({ behavior: 'smooth' });
      }
      showToast('Pengesahan kehadiran berjaya dihantar!');
    });
  }

  // 10. Lightbox Modal logic
  window.openLightbox = function(src) {
    if (lightbox && lightboxImg) {
      lightboxImg.src = src;
      lightbox.classList.add('active');
    }
  };

  if (lightboxClose) {
    lightboxClose.addEventListener('click', () => {
      lightbox.classList.remove('active');
    });
  }

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        lightbox.classList.remove('active');
      }
    });
  }

  // 11. Add to Calendar Handler
  window.addToCalendar = function() {
    const title = encodeURIComponent("Walimatulurus Aiman & Afrina");
    const details = encodeURIComponent("Majlis Perkahwinan Aiman & Afrina di Dewan Perdana.");
    const location = encodeURIComponent("Dewan Perdana, Kuala Lumpur");
    const startDate = "20261224T110000";
    const endDate = "20261224T160000";

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
    window.open(googleCalendarUrl, '_blank');
  };

  // 12. Floating Flower Petal Animation Generator
  function spawnsPetals() {
    const container = document.querySelector('.app-container');
    if (!container) return;

    for (let i = 0; i < 15; i++) {
      const petal = document.createElement('div');
      petal.innerHTML = '🌸';
      petal.style.position = 'fixed';
      petal.style.top = '-20px';
      petal.style.left = Math.random() * 100 + 'vw';
      petal.style.fontSize = (Math.random() * 12 + 10) + 'px';
      petal.style.opacity = Math.random() * 0.7 + 0.3;
      petal.style.pointerEvents = 'none';
      petal.style.zIndex = '998';
      petal.style.transition = `transform ${Math.random() * 5 + 6}s linear, top ${Math.random() * 5 + 6}s linear`;
      
      document.body.appendChild(petal);

      setTimeout(() => {
        petal.style.top = '105vh';
        petal.style.transform = `rotate(${Math.random() * 360}deg) translateX(${Math.random() * 100 - 50}px)`;
      }, 100);

      setTimeout(() => {
        petal.remove();
      }, 11000);
    }
  }

  // Periodically spawn gentle petals
  setInterval(spawnsPetals, 8000);

  // 13. Active Bottom Nav Highlight on Scroll
  const sections = document.querySelectorAll('.section, .hero-section');
  const navItems = document.querySelectorAll('.nav-item');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
        current = section.getAttribute('id');
      }
    });

    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('href') === `#${current}`) {
        item.classList.add('active');
      }
    });
  });
});
