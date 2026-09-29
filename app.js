import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// Konfiguracja Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDmZFsY3qhyX-5q1hhDHLJx6LimRou1jOM",
  authDomain: "pielegniarstwo-hub.firebaseapp.com",
  projectId: "pielegniarstwo-hub",
  storageBucket: "pielegniarstwo-hub.firebasestorage.app",
  messagingSenderId: "1014906979718",
  appId: "1:1014906979718:web:065da12de205b3f27cd807"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 1. INICJALIZACJA KALENDARZA (FullCalendar)
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

// Funkcja onSnapshot automatycznie odświeża dane, gdy tylko w bazie zajdzie jakaś zmiana
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

        // Jeśli post ma datę, dodaj do kalendarza
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
    postsContainer.innerHTML = '<p>Błąd ładowania danych. Sprawdź konsolę.</p>';
});

// 3. OBSŁUGA FORMULARZA I ZAPIS DO BAZY
const postForm = document.getElementById('postForm');

postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const pinCode = document.getElementById('pinCode').value;
    if(pinCode !== '123456') {
        alert('❌ Nieprawidłowy kod PIN!');
        return;
    }

    const inputDataWydarzenia = document.getElementById('dataWydarzenia').value;

    const newPostData = {
        title: document.getElementById('title').value,
        content: document.getElementById('content').value,
        isUrgent: document.getElementById('isUrgent').checked,
        dataWydarzenia: inputDataWydarzenia || null,
        createdAt: Date.now(), // Czas lokalny natychmiast wrzuca post w odpowiednie miejsce
        displayDate: new Date().toLocaleString('pl-PL')
    };

    try {
        await addDoc(collection(db, "posts"), newPostData);
        
        alert('✅ Ogłoszenie dodane pomyślnie!');
        postForm.reset();
        document.getElementById('addPostDetails').removeAttribute('open');
        // Usunięto wywołanie ładujące posty, ponieważ onSnapshot robi to teraz sam w tle!
    } catch (error) {
        console.error("Błąd zapisu: ", error);
        alert('Wystąpił błąd podczas dodawania ogłoszenia.');
    }
});

// 4. FUNKCJA RYSUJĄCA OGŁOSZENIA
function renderPost(post) {
    const postElement = document.createElement('div');
    postElement.className = `post-card ${post.isUrgent ? 'urgent' : ''}`;
    
    const urgentBadge = post.isUrgent ? '🚨 <b>PILNE</b> | ' : '';
    const eventBadge = post.dataWydarzenia ? `📅 <b>Wydarzenie:</b> ${post.dataWydarzenia} | ` : '';
    const dateString = post.displayDate ? post.displayDate : 'Przed chwilą';

    postElement.innerHTML = `
        <h3 class="post-title">${post.title}</h3>
        <p class="post-date">${urgentBadge} ${eventBadge} Dodano: ${dateString}</p>
        <p class="post-content">${post.content}</p>
    `;
    postsContainer.appendChild(postElement);
}