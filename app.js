// app.js

// ייבוא ספריות Firebase - גרסה אחת ונקייה
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth,
         createUserWithEmailAndPassword,
         signInWithEmailAndPassword,
         signOut,
         onAuthStateChanged,
         GoogleAuthProvider,
         signInWithPopup } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore,
         collection,
         addDoc,
         getDocs,
         deleteDoc,
         doc,
         updateDoc,
         setDoc,
         getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
// ייבוא ספריית גרפים
import "https://cdn.jsdelivr.net/npm/chart.js";
// ייבוא קובץ השפה
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

// --- אלמנטים מה-DOM (השתמשנו ב-querySelector כדי לאסוף את כל הכפתורים) ---
const pages = document.querySelectorAll('.page');
const welcomePage = document.getElementById('welcome-page');
const homePage = document.getElementById('home-page');
const budgetManagementPage = document.getElementById('budget-management-page');
const graphsPage = document.getElementById('graphs-page');
const settingsModal = document.getElementById('settings-modal');

const navButtons = document.querySelectorAll('.nav-button');
const desktopNavButtons = document.querySelectorAll('.nav-button-desktop');

// אלמנטים של דף הכניסה/הרשמה
const startGuestButton = document.getElementById('start-guest-button');
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

// אלמנטים של דף הבית
const homeGreeting = document.getElementById('home-greeting');
const currentBalanceDisplayHome = document.getElementById('current-balance');
const homeCurrencySelector = document.getElementById('home-currency-selector');
const goalsList = document.getElementById('goals-list');
const addGoalBtn = document.getElementById('add-goal-btn');
const addGoalForm = document.getElementById('add-goal-form');
const saveGoalButton = document.getElementById('save-goal-button');
const goalNameInput = document.getElementById('goal-name');
const goalAmountInput = document.getElementById('goal-amount');
const goalMessage = document.getElementById('goal-message');

// אלמנטים של דף ניהול כסף
const currentBalanceDisplayMyMoney = document.getElementById('current-balance-money-page');
const moneyPageCurrencySelector = document.getElementById('money-page-currency-selector');
const transactionForm = document.getElementById('transaction-form');
const transactionTypeSelect = document.getElementById('transaction-type');
const transactionCurrencySelect = document.getElementById('transaction-currency');
const transactionAmountInput = document.getElementById('transaction-amount');
const transactionDescriptionInput = document.getElementById('transaction-description');
const transactionDateInput = document.getElementById('transaction-date');
const transactionMessage = document.getElementById('transaction-message');
const transactionsTableBody = document.getElementById('transactions-table-body');
const toggleTransactionsTable = document.getElementById('toggle-transactions-table');
const transactionsTableContainer = document.getElementById('transactions-table-container');
const filterButton = document.getElementById('filter-button');
const resetFilterButton = document.getElementById('reset-filter-button');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const periodIncomeSpan = document.getElementById('period-income');
const periodExpenseSpan = document.getElementById('period-expense');
const periodBalanceSpan = document.getElementById('period-balance');
const periodSummaryReport = document.getElementById('period-summary-report');

// אלמנטים של חלון ההגדרות
const closeModalButton = document.getElementById('close-modal-button');
const userEmailDisplay = document.getElementById('user-email-display');
const logoutButton = document.getElementById('logout-button');
const themeDarkRadio = document.getElementById('theme-dark-radio');
const themeLightRadio = document.getElementById('theme-light-radio');
const mainColorInput = document.getElementById('main-color-input');
const accentColorInput = document.getElementById('accent-color-input');
const fontSelector = document.getElementById('font-selector');
const baseCurrencySelector = document.getElementById('base-currency-selector');
const languageSelector = document.getElementById('language-selector');

// אלמנטים של גרפים
const expensesPieChartCtx = document.getElementById('expenses-pie-chart')?.getContext('2d');
let expensesPieChart;

// --- נתונים גלובליים ---
let transactions = [];
let goals = [];
let settings = JSON.parse(localStorage.getItem('settings')) || {
    theme: 'dark',
    mainColor: '#7289DA',
    accentColor: '#4CAF50',
    font: 'Heebo',
    baseCurrency: 'ILS',
    language: 'he'
};
let currentUser = null;
let isGuestMode = false;
let rates = {};
let allCurrencies = {};
let isPWA = false;

// --- פונקציות עזר כלליות ---
function setLanguage(lang) {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const [attr, textKey] = key.startsWith('[') ? key.substring(1, key.length - 1).split(']') : [null, key];
        
        if (attr) {
            if (translations[lang][textKey]) {
                element.setAttribute(attr, translations[lang][textKey]);
            }
        } else {
            const nestedKeys = key.split('.');
            let translatedText = translations[lang];
            for (const nestedKey of nestedKeys) {
                translatedText = translatedText ? translatedText[nestedKey] : undefined;
            }
            if (translatedText) {
                element.textContent = translatedText;
            }
        }
    });
    
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    
    if (homeGreeting) {
        homeGreeting.textContent = isGuestMode 
            ? translations[lang]['home.greeting_guest'] 
            : `${translations[lang]['home.greeting_user']} ${currentUser?.email?.split('@')[0] || ''}`;
    }
    
    updateUI();
}

function showPage(pageId) {
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    
    // סגירת חלון ההגדרות אם פתוח
    if (settingsModal) settingsModal.classList.add('hidden');
}

function showMessage(element, text, type) {
    element.textContent = text;
    element.className = `message ${type}`;
    element.classList.remove('hidden');
    setTimeout(() => {
        element.classList.add('hidden');
    }, 5000);
}

function applySettings() {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', settings.mainColor);
    root.style.setProperty('--secondary-color', settings.accentColor);
    root.style.setProperty('--font-family', settings.font);

    document.body.className = settings.theme === 'dark' ? 'dark-theme' : 'light-theme';

    if (themeDarkRadio) themeDarkRadio.checked = settings.theme === 'dark';
    if (themeLightRadio) themeLightRadio.checked = settings.theme === 'light';
    if (mainColorInput) mainColorInput.value = settings.mainColor;
    if (accentColorInput) accentColorInput.value = settings.accentColor;
    if (fontSelector) fontSelector.value = settings.font;
    if (baseCurrencySelector) baseCurrencySelector.value = settings.baseCurrency;
    if (languageSelector) languageSelector.value = settings.language;
    
    setLanguage(settings.language);
}

function saveSettings() {
    localStorage.setItem('settings', JSON.stringify(settings));
    applySettings();
    updateUI();
}

async function fetchExchangeRates() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        rates = data.rates;
        
        const allCurrenciesList = Object.keys(rates);
        allCurrenciesList.forEach(currency => {
            allCurrencies[currency] = currency;
        });
        
        populateCurrencySelectors();
        updateUI();
    } catch (error) {
        console.error("Error fetching exchange rates:", error);
    }
}

function populateCurrencySelectors() {
    [homeCurrencySelector, moneyPageCurrencySelector, transactionCurrencySelect, baseCurrencySelector].forEach(selector => {
        if (!selector) return;
        selector.innerHTML = '';
        const currencies = Object.keys(allCurrencies).sort();
        currencies.forEach(currency => {
            const option = document.createElement('option');
            option.value = currency;
            option.textContent = `${currency} - ${translations[settings.language].currencies[currency] || currency}`;
            selector.appendChild(option);
        });
        selector.value = settings.baseCurrency;
    });
}

function convertToBaseCurrency(amount, currency) {
    if (!rates || Object.keys(rates).length === 0 || !rates[settings.baseCurrency] || !rates[currency]) {
        console.error("Missing exchange rate data");
        return amount;
    }
    const rateToUSD = 1 / rates[currency];
    const rateFromUSD = rates[settings.baseCurrency];
    return (amount * rateToUSD) * rateFromUSD;
}

// --- ניהול נתונים (Firebase / Local Storage) ---
async function loadUserData() {
    transactions = [];
    goals = [];

    if (isGuestMode) {
        transactions = JSON.parse(localStorage.getItem('guestTransactions')) || [];
        goals = JSON.parse(localStorage.getItem('guestGoals')) || [];
    } else if (currentUser) {
        const userId = currentUser.uid;
        const transactionsRef = collection(db, 'users', userId, 'transactions');
        const transactionsSnapshot = await getDocs(transactionsRef);
        transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const goalsRef = collection(db, 'users', userId, 'goals');
        const goalsSnapshot = await getDocs(goalsRef);
        goals = goalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    updateUI();
}

async function saveTransaction(transaction) {
    if (isGuestMode) {
        transaction.id = Date.now().toString();
        transactions.push(transaction);
        localStorage.setItem('guestTransactions', JSON.stringify(transactions));
    } else if (currentUser) {
        const userId = currentUser.uid;
        try {
            const docRef = await addDoc(collection(db, 'users', userId, 'transactions'), transaction);
            transaction.id = docRef.id;
            transactions.push(transaction); // הוספה למערך המקומי לאחר שמירה מוצלחת
        } catch (e) {
            console.error("Error adding document: ", e);
            showMessage(transactionMessage, translations[settings.language]['budget.error_saving_transaction'], 'error');
        }
    }
    updateUI();
}

async function deleteTransaction(transactionId) {
    if (isGuestMode) {
        transactions = transactions.filter(t => t.id !== transactionId);
        localStorage.setItem('guestTransactions', JSON.stringify(transactions));
    } else if (currentUser) {
        try {
            await deleteDoc(doc(db, 'users', currentUser.uid, 'transactions', transactionId));
            transactions = transactions.filter(t => t.id !== transactionId); // הסרה מהמערך המקומי
        } catch (e) {
            console.error("Error deleting transaction: ", e);
            showMessage(transactionMessage, translations[settings.language]['budget.error_deleting_transaction'], 'error');
        }
    }
    updateUI();
}

async function addGoal(goal) {
    if (isGuestMode) {
        goal.id = Date.now().toString();
        goals.push(goal);
        localStorage.setItem('guestGoals', JSON.stringify(goals));
    } else if (currentUser) {
        const userId = currentUser.uid;
        try {
            const docRef = await addDoc(collection(db, 'users', userId, 'goals'), goal);
            goal.id = docRef.id;
            goals.push(goal); // הוספה למערך המקומי
        } catch (e) {
            console.error("Error adding goal: ", e);
            showMessage(goalMessage, translations[settings.language]['home.error_saving_goal'], 'error');
        }
    }
    updateUI();
}

async function deleteGoal(goalId) {
    if (isGuestMode) {
        goals = goals.filter(g => g.id !== goalId);
        localStorage.setItem('guestGoals', JSON.stringify(goals));
    } else if (currentUser) {
        try {
            await deleteDoc(doc(db, 'users', currentUser.uid, 'goals', goalId));
            goals = goals.filter(g => g.id !== goalId); // הסרה מהמערך המקומי
        } catch (e) {
            console.error("Error deleting goal: ", e);
            showMessage(goalMessage, translations[settings.language]['home.error_deleting_goal'], 'error');
        }
    }
    updateUI();
}

// --- ניהול ממשק משתמש (UI) ---
function updateUI() {
    renderTransactionsTable(transactions);
    renderGoalsList(goals);
    updateBalances();
    updatePeriodSummary();
    if (expensesPieChartCtx) {
        renderGraphs();
    }
    
    // עדכון תצוגת אימייל בחלון ההגדרות
    if (userEmailDisplay) {
        userEmailDisplay.textContent = currentUser?.email || translations[settings.language]['settings.guest_user'];
    }
}

function renderTransactionsTable(transactionsToRender) {
    if (!transactionsTableBody) return;
    transactionsTableBody.innerHTML = '';
    transactionsToRender.forEach(t => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${t.date}</td>
            <td class="${t.type}">${parseFloat(t.amount).toFixed(2)} ${t.currency}</td>
            <td>${translations[settings.language][`budget.transaction_type_${t.type}`]}</td>
            <td>${t.description || ''}</td>
            <td>
                <button class="button danger small-button delete-transaction" data-id="${t.id}">${translations[settings.language]['budget.delete_button']}</button>
            </td>
        `;
        transactionsTableBody.appendChild(row);
    });
}

function renderGoalsList(goalsToRender) {
    if (!goalsList) return;
    goalsList.innerHTML = '';
    goalsToRender.forEach(g => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div>
                <strong>${g.name}</strong> - ${translations[settings.language]['home.goal_target']}: ${parseFloat(g.amount).toFixed(2)} ${settings.baseCurrency}
            </div>
            <div class="goal-actions">
                <button class="button round danger delete-goal-button" data-id="${g.id}">${translations[settings.language]['home.delete_button']}</button>
            </div>
        `;
        goalsList.appendChild(li);
    });
}

function updateBalances() {
    if (!rates || Object.keys(rates).length === 0) return;

    const selectedCurrencyHome = homeCurrencySelector?.value || settings.baseCurrency;
    const selectedCurrencyMyMoney = moneyPageCurrencySelector?.value || settings.baseCurrency;
    let balanceInBase = 0;

    transactions.forEach(t => {
        const amountInBase = convertToBaseCurrency(t.amount, t.currency);
        if (t.type === 'income') {
            balanceInBase += amountInBase;
        } else {
            balanceInBase -= amountInBase;
        }
    });
    
    const rateToHome = rates[selectedCurrencyHome] / rates[settings.baseCurrency];
    const rateToMyMoney = rates[selectedCurrencyMyMoney] / rates[settings.baseCurrency];

    const balanceHome = balanceInBase * rateToHome;
    const balanceMyMoney = balanceInBase * rateToMyMoney;
    
    if (currentBalanceDisplayHome) currentBalanceDisplayHome.textContent = `${balanceHome.toFixed(2)} ${selectedCurrencyHome}`;
    if (currentBalanceDisplayMyMoney) currentBalanceDisplayMyMoney.textContent = `${balanceMyMoney.toFixed(2)} ${selectedCurrencyMyMoney}`;
}

function updatePeriodSummary(filteredTransactions = transactions) {
    let periodIncome = 0;
    let periodExpense = 0;
    
    filteredTransactions.forEach(t => {
        const amountInBase = convertToBaseCurrency(t.amount, t.currency);
        if (t.type === 'income') {
            periodIncome += amountInBase;
        } else {
            periodExpense += amountInBase;
        }
    });

    const periodBalance = periodIncome - periodExpense;

    if (periodIncomeSpan) periodIncomeSpan.textContent = `${periodIncome.toFixed(2)} ${settings.baseCurrency}`;
    if (periodExpenseSpan) periodExpenseSpan.textContent = `${periodExpense.toFixed(2)} ${settings.baseCurrency}`;
    if (periodBalanceSpan) periodBalanceSpan.textContent = `${periodBalance.toFixed(2)} ${settings.baseCurrency}`;

    if (periodSummaryReport) {
        if (periodBalance > 0) {
            periodSummaryReport.className = 'message success';
            periodSummaryReport.textContent = translations[settings.language]['budget.summary_good'];
        } else if (periodBalance === 0) {
            periodSummaryReport.className = 'message info';
            periodSummaryReport.textContent = translations[settings.language]['budget.summary_neutral'];
        } else {
            periodSummaryReport.className = 'message error';
            periodSummaryReport.textContent = translations[settings.language]['budget.summary_bad'];
        }
        periodSummaryReport.classList.remove('hidden');
    }
}

// --- גרפים ---
function renderGraphs() {
    const expenseCategories = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        const category = t.description || translations[settings.language]['graphs.other_category'];
        const amountInBase = convertToBaseCurrency(t.amount, t.currency);
        if (!expenseCategories[category]) {
            expenseCategories[category] = 0;
        }
        expenseCategories[category] += amountInBase;
    });

    const labels = Object.keys(expenseCategories);
    const data = Object.values(expenseCategories);

    if (expensesPieChart) {
        expensesPieChart.destroy();
    }
    
    if (expensesPieChartCtx) {
        expensesPieChart = new Chart(expensesPieChartCtx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E7E9ED', '#8B5CF6'
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top', labels: { color: settings.theme === 'dark' ? 'white' : 'black' } },
                    title: { display: true, text: translations[settings.language]['graphs.expenses_by_category'], color: settings.theme === 'dark' ? 'white' : 'black' }
                }
            }
        });
    }
}

// --- אירועי לחיצות (Event Listeners) ---
function attachEventListeners() {
    // אירועי ניווט
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            showPage(button.getAttribute('data-page-id'));
        });
    });
    desktopNavButtons.forEach(button => {
        button.addEventListener('click', () => {
            showPage(button.getAttribute('data-page-id'));
        });
    });

    // אירועי דף כניסה/הרשמה
    if (startGuestButton) startGuestButton.addEventListener('click', () => {
        isGuestMode = true;
        showPage('home-page');
        loadUserData();
    });
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
            showMessage(authMessage, `${translations[settings.language]['login.login_error']}: ${error.message}`, 'error');
        }
    });
    if (registerButton) registerButton.addEventListener('click', async () => {
        const email = authEmailInput.value;
        const password = authPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        if (password !== confirmPassword) {
            showMessage(authMessage, translations[settings.language]['register.password_mismatch'], 'error');
            return;
        }
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            showMessage(authMessage, translations[settings.language]['register.success'], 'success');
            if (registerFields) registerFields.classList.add('hidden');
            if (loginFields) loginFields.classList.remove('hidden');
        } catch (error) {
            showMessage(authMessage, `${translations[settings.language]['register.register_error']}: ${error.message}`, 'error');
        }
    });
    if (googleLoginButton) googleLoginButton.addEventListener('click', async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            showMessage(authMessage, `${translations[settings.language]['login.google_login_error']}: ${error.message}`, 'error');
        }
    });

    // אירועי דף ניהול כסף
    if (transactionForm) transactionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newTransaction = {
            type: transactionTypeSelect.value,
            currency: transactionCurrencySelect.value,
            amount: parseFloat(transactionAmountInput.value),
            description: transactionDescriptionInput.value,
            date: transactionDateInput.value
        };
        if (isNaN(newTransaction.amount) || newTransaction.amount <= 0) {
            showMessage(transactionMessage, translations[settings.language]['budget.invalid_amount'], 'error');
            return;
        }
        await saveTransaction(newTransaction);
        showMessage(transactionMessage, translations[settings.language]['budget.transaction_added'], 'success');
        transactionForm.reset();
    });

    if (transactionsTableBody) transactionsTableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-transaction')) {
            const transactionId = e.target.getAttribute('data-id');
            deleteTransaction(transactionId);
        }
    });

    if (toggleTransactionsTable) toggleTransactionsTable.addEventListener('click', () => {
        if (transactionsTableContainer) transactionsTableContainer.classList.toggle('hidden');
    });

    if (filterButton) filterButton.addEventListener('click', () => {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        const filtered = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            return (!start || transactionDate >= start) && (!end || transactionDate <= end);
        });
        renderTransactionsTable(filtered);
        updatePeriodSummary(filtered);
    });

    if (resetFilterButton) resetFilterButton.addEventListener('click', () => {
        startDateInput.value = '';
        endDateInput.value = '';
        renderTransactionsTable(transactions);
        updatePeriodSummary(transactions);
    });

    // אירועי דף הבית
    if (addGoalBtn) addGoalBtn.addEventListener('click', () => {
        if (addGoalForm) addGoalForm.classList.toggle('hidden');
    });
    if (saveGoalButton) saveGoalButton.addEventListener('click', async () => {
        const newGoal = {
            name: goalNameInput.value,
            amount: parseFloat(goalAmountInput.value),
            progress: 0
        };
        if (!newGoal.name || isNaN(newGoal.amount) || newGoal.amount <= 0) {
            showMessage(goalMessage, translations[settings.language]['home.invalid_goal'], 'error');
            return;
        }
        await addGoal(newGoal);
        showMessage(goalMessage, translations[settings.language]['home.goal_added'], 'success');
        if (addGoalForm) addGoalForm.classList.add('hidden');
        if (goalNameInput) goalNameInput.value = '';
        if (goalAmountInput) goalAmountInput.value = '';
    });
    if (goalsList) goalsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-goal-button')) {
            const goalId = e.target.getAttribute('data-id');
            deleteGoal(goalId);
        }
    });

    // אירועי חלון הגדרות
    document.querySelectorAll('.settings-button').forEach(btn => {
        btn.addEventListener('click', () => {
            if (settingsModal) settingsModal.classList.remove('hidden');
            applySettings();
        });
    });
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

    if (themeDarkRadio) themeDarkRadio.addEventListener('change', () => {
        settings.theme = 'dark';
        saveSettings();
    });
    if (themeLightRadio) themeLightRadio.addEventListener('change', () => {
        settings.theme = 'light';
        saveSettings();
    });
    if (mainColorInput) mainColorInput.addEventListener('change', () => {
        settings.mainColor = mainColorInput.value;
        saveSettings();
    });
    if (accentColorInput) accentColorInput.addEventListener('change', () => {
        settings.accentColor = accentColorInput.value;
        saveSettings();
    });
    if (fontSelector) fontSelector.addEventListener('change', () => {
        settings.font = fontSelector.value;
        saveSettings();
    });
    if (baseCurrencySelector) baseCurrencySelector.addEventListener('change', () => {
        settings.baseCurrency = baseCurrencySelector.value;
        saveSettings();
        updateBalances();
    });
    if (languageSelector) languageSelector.addEventListener('change', () => {
        settings.language = languageSelector.value;
        saveSettings();
    });
    if (homeCurrencySelector) homeCurrencySelector.addEventListener('change', updateBalances);
    if (moneyPageCurrencySelector) moneyPageCurrencySelector.addEventListener('change', updateBalances);
}

// --- לוגיקת אתחול ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        isGuestMode = false;
        await loadUserData();
        showPage('home-page');
    } else {
        currentUser = null;
        isGuestMode = false; // איפוס מצב אורח
        transactions = [];
        goals = [];
        showPage('welcome-page');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    fetchExchangeRates();
    applySettings();
    attachEventListeners();
});

