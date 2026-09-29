import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// !!! Zostaw tutaj swój działający firebaseConfig !!!
const firebaseConfig = {
  apiKey: "AIzaSyCz0CXVx7340fTBKEFLf4z_V1wEY2iD8mc",
  authDomain: "pielegniarstwo-app.firebaseapp.com",
  projectId: "pielegniarstwo-app",
  storageBucket: "pielegniarstwo-app.firebasestorage.app",
  messagingSenderId: "1067338445005",
  appId: "1:1067338445005:web:b862a0ba3e4750ac063984"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 1. INICJALIZACJA KALENDARZA
const calendarEl = document.getElementById('calendar');
const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'pl',
    headerToolbar: { left: 'prev,next', center: 'title', right: 'today' },
    events: [] 
});
calendar.render();

// 2. ŁADOWANIE OGŁOSZEŃ (W CZASIE RZECZYWISTYM)
const postsContainer = document.getElementById('postsContainer');
const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

onSnapshot(q, (querySnapshot) => {
    postsContainer.innerHTML = ''; 
    calendar.removeAllEvents(); 

    if (querySnapshot.empty) {
        postsContainer.innerHTML = '<p style="color: var(--text-muted)">Brak ogłoszeń na tablicy.</p>';
        return;
    }

    querySnapshot.forEach((doc) => {
        const post = doc.data();
        renderPost(post);

        if (post.dataWydarzenia) {
            calendar.addEvent({
                title: post.title,
                start: post.dataWydarzenia,
                color: post.isUrgent ? '#e66c86' : '#4285f4'
            });
        }
    });
}, (error) => {
    console.error("Błąd podczas ładowania z bazy: ", error);
});

// 3. OBSŁUGA FORMULARZA I ZAPIS DO BAZY
const postForm = document.getElementById('postForm');
const submitBtn = document.querySelector('.btn-primary');

postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const pinCode = document.getElementById('pinCode').value;
    if(pinCode !== '123456') {
        alert('❌ Nieprawidłowy kod PIN!');
        return;
    }

    submitBtn.textContent = '⏳ Publikowanie...';
    submitBtn.disabled = true;

    const inputDataWydarzenia = document.getElementById('dataWydarzenia').value;
    const fileLink = document.getElementById('fileLink').value; // Pobieramy link, jeśli jest
    
    try {
        const newPostData = {
            title: document.getElementById('title').value,
            content: document.getElementById('content').value,
            isUrgent: document.getElementById('isUrgent').checked,
            dataWydarzenia: inputDataWydarzenia || null,
            fileLink: fileLink || null, // Zapisujemy link
            createdAt: Date.now(),
            displayDate: new Date().toLocaleString('pl-PL')
        };

        await addDoc(collection(db, "posts"), newPostData);
        
        alert('✅ Ogłoszenie dodane pomyślnie!');
        postForm.reset();
        document.getElementById('addPostDetails').removeAttribute('open');
        
    } catch (error) {
        console.error("Błąd zapisu: ", error);
        alert('❌ Wystąpił błąd podczas dodawania ogłoszenia.');
    } finally {
        submitBtn.textContent = 'Opublikuj';
        submitBtn.disabled = false;
    }
});

// 4. FUNKCJA RYSUJĄCA OGŁOSZENIA
function renderPost(post) {
    const postElement = document.createElement('div');
    postElement.className = `post-card ${post.isUrgent ? 'urgent' : ''}`;
    
    const urgentBadge = post.isUrgent ? '🚨 <b>PILNE</b> | ' : '';
    const eventBadge = post.dataWydarzenia ? `📅 <b>Wydarzenie:</b> ${post.dataWydarzenia} | ` : '';
    const dateString = post.displayDate ? post.displayDate : 'Przed chwilą';
    
    // Jeśli post zawiera link, generujemy ładny przycisk
    const linkHtml = post.fileLink 
        ? `<div style="margin-top: 15px;">
             <a href="${post.fileLink}" target="_blank" class="btn" style="text-decoration: none; display: inline-block; background: rgba(66, 133, 244, 0.1); color: var(--primary); border: 1px solid var(--primary); font-size: 13px;">
               📎 Przejdź do załącznika
             </a>
           </div>` 
        : '';

    postElement.innerHTML = `
        <h3 class="post-title">${post.title}</h3>
        <p class="post-date">${urgentBadge} ${eventBadge} Dodano: ${dateString}</p>
        <p class="post-content">${post.content}</p>
        ${linkHtml}
    `;
    postsContainer.appendChild(postElement);
}