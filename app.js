// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import translations from './languages.js';

// הגדרות Firebase שלך
const firebaseConfig = {
    apiKey: "AIzaSyCAkTramEw9xQsKDJafmKPTRaoQMyxl_88",
    authDomain: "my-money-site-177b1.firebaseapp.com",
    projectId: "my-money-site-177b1",
    storageBucket: "my-money-site-177b1.firebasestorage.app",
    messagingSenderId: "1001673216101",
    appId: "1:1001673216101:web:dd0fc887f73d733889b68c"
};

// אתחול Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// --- אלמנטים מה-DOM ---
const pages = document.querySelectorAll('.page');
const navButtons = document.querySelectorAll('.nav-button');
const desktopNavButtons = document.querySelectorAll('.nav-button-desktop');

const showRegisterFormButton = document.getElementById('show-register-form-button');
const showLoginFormButton = document.getElementById('show-login-form-button');
const loginButton = document.getElementById('login-button');
const registerButton = document.getElementById('register-button');
const googleLoginButton = document.getElementById('google-login-button');
const loginFields = document.getElementById('login-fields');
const registerFields = document.getElementById('register-fields');
const authMessage = document.getElementById('auth-message');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const confirmPasswordInput = document.getElementById('confirm-password');

const homeGreeting = document.getElementById('home-greeting');
const currentBalanceDisplayHome = document.getElementById('current-balance');
const enableNotificationsButton = document.getElementById('enable-notifications-button');
const notificationStatus = document.getElementById('notification-status');

const settingsModal = document.getElementById('settings-modal');
const closeModalButton = document.getElementById('close-modal-button');
const logoutButton = document.getElementById('logout-button');
const userEmailDisplay = document.getElementById('user-email-display');
const themeDarkRadio = document.getElementById('theme-dark-radio');
const themeLightRadio = document.getElementById('theme-light-radio');
const languageSelector = document.getElementById('language-selector');

// --- נתונים גלובליים ---
let currentUser = null;
let userData = {};
let settings = JSON.parse(localStorage.getItem('settings')) || {
    theme: 'dark',
    language: 'he'
};
let isNotificationsEnabled = false;

// --- פונקציות עזר ---
function setLanguage(lang) {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translatedText = translations[lang][key];
        if (translatedText) {
            element.textContent = translatedText;
        }
    });
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    if (homeGreeting) {
        homeGreeting.textContent = `${translations[lang]['home.greeting_user']} ${currentUser?.email?.split('@')[0] || ''}`;
    }
}

function showPage(pageId) {
    pages.forEach(page => page.classList.remove('active'));
    const pageToShow = document.getElementById(pageId);
    if (pageToShow) {
        pageToShow.classList.add('active');
    }
}

function showMessage(element, text, type) {
    if (element) {
        element.textContent = text;
        element.className = `message ${type}`;
        element.classList.remove('hidden');
        setTimeout(() => element.classList.add('hidden'), 5000);
    }
}

function applySettingsToUI() {
    document.body.className = settings.theme === 'dark' ? 'dark-theme' : 'light-theme';
    if (themeDarkRadio) themeDarkRadio.checked = settings.theme === 'dark';
    if (themeLightRadio) themeLightRadio.checked = settings.theme === 'light';
    if (languageSelector) languageSelector.value = settings.language;
    if (userEmailDisplay) userEmailDisplay.textContent = currentUser?.email || 'אורח';

    setLanguage(settings.language);
}

// --- לוגיקה של Firebase ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            userData = userDocSnap.data();
            if (userData.theme) settings.theme = userData.theme;
            if (userData.language) settings.language = userData.language;
        } else {
            await setDoc(userDocRef, {
                email: user.email,
                balance: 0,
                transactions: [],
                goals: [],
                theme: 'dark',
                language: 'he'
            });
            userData = { balance: 0, transactions: [], goals: [], theme: 'dark', language: 'he' };
        }
        applySettingsToUI();
        showPage('home-page');
    } else {
        currentUser = null;
        userData = {};
        showPage('welcome-page');
    }
});

// --- פונקציות ואירועים ---
function toggleNotifications() {
    isNotificationsEnabled = !isNotificationsEnabled;
    if (enableNotificationsButton) {
        enableNotificationsButton.textContent = isNotificationsEnabled ?
            translations[settings.language]['home.disable_notifications'] :
            translations[settings.language]['home.enable_notifications_button'];
        
        if (notificationStatus) {
            notificationStatus.textContent = isNotificationsEnabled ?
                translations[settings.language]['home.notifications_on'] :
                translations[settings.language]['home.notifications_off'];
        }
    }
}

function attachEventListeners() {
    // ניווט
    const allNavButtons = [...navButtons, ...desktopNavButtons];
    allNavButtons.forEach(button => {
        button.addEventListener('click', () => {
            const pageId = button.getAttribute('data-page-id');
            if (pageId === 'settings-page') {
                if (settingsModal) settingsModal.classList.remove('hidden');
                applySettingsToUI();
            } else {
                showPage(pageId);
            }
        });
    });

    // כניסה והרשמה
    if (showRegisterFormButton) showRegisterFormButton.addEventListener('click', () => {
        if (loginFields) loginFields.classList.add('hidden');
        if (registerFields) registerFields.classList.remove('hidden');
    });
    if (showLoginFormButton) showLoginFormButton.addEventListener('click', () => {
        if (registerFields) registerFields.classList.add('hidden');
        if (loginFields) loginFields.classList.remove('hidden');
    });
    if (loginButton) loginButton.addEventListener('click', async () => {
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            showMessage(authMessage, `שגיאת התחברות: ${error.message}`, 'error');
        }
    });
    if (registerButton) registerButton.addEventListener('click', async () => {
        const email = authEmailInput.value;
        const password = authPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        if (password !== confirmPassword) {
            showMessage(authMessage, 'הסיסמאות אינן תואמות', 'error');
            return;
        }
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            showMessage(authMessage, 'ההרשמה הצליחה! אנא התחבר', 'success');
            if (registerFields) registerFields.classList.add('hidden');
            if (loginFields) loginFields.classList.remove('hidden');
        } catch (error) {
            showMessage(authMessage, `שגיאת הרשמה: ${error.message}`, 'error');
        }
    });

    // כפתור התראות
    if (enableNotificationsButton) {
        enableNotificationsButton.addEventListener('click', toggleNotifications);
    }
    
    // הגדרות
    if (closeModalButton) closeModalButton.addEventListener('click', () => {
        if (settingsModal) settingsModal.classList.add('hidden');
    });
    if (logoutButton) logoutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
            if (settingsModal) settingsModal.classList.add('hidden');
        } catch (error) {
            console.error("Logout failed:", error.message);
        }
    });
    if (themeDarkRadio) themeDarkRadio.addEventListener('change', async () => {
        settings.theme = 'dark';
        if (currentUser) {
            await updateDoc(doc(db, "users", currentUser.uid), { theme: 'dark' });
        }
        applySettingsToUI();
    });
    if (themeLightRadio) themeLightRadio.addEventListener('change', async () => {
        settings.theme = 'light';
        if (currentUser) {
            await updateDoc(doc(db, "users", currentUser.uid), { theme: 'light' });
        }
        applySettingsToUI();
    });
    if (languageSelector) languageSelector.addEventListener('change', async (event) => {
        const newLang = event.target.value;
        settings.language = newLang;
        if (currentUser) {
            await updateDoc(doc(db, "users", currentUser.uid), { language: newLang });
        }
        applySettingsToUI();
    });
}

// --- אתחול ראשוני ---
document.addEventListener('DOMContentLoaded', () => {
    attachEventListeners();
    applySettingsToUI();
    // showPage('welcome-page'); // showPage is called by onAuthStateChanged
});
