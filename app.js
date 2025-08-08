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
         query,
         where,
         deleteDoc,
         doc,
         updateDoc,
         setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
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
const welcomePage = document.getElementById('welcome-page');
const homePage = document.getElementById('home-page');
const budgetManagementPage = document.getElementById('budget-management-page');
const graphsPage = document.getElementById('graphs-page');

const navButtons = document.querySelectorAll('.nav-button');
const settingsButton = document.getElementById('settings-button');
const settingsButton2 = document.getElementById('settings-button-2');
const settingsButton3 = document.getElementById('settings-button-3');

const startGuestButton = document.getElementById('start-guest-button');
const authFormSection = document.getElementById('auth-form-section');
const registerFields = document.getElementById('register-fields');
const loginFields = document.getElementById('login-fields');
const showRegisterFormButton = document.getElementById('show-register-form-button');
const showLoginFormButton = document.getElementById('show-login-form-button');
const registerButton = document.getElementById('register-button');
const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const confirmPasswordInput = document.getElementById('confirm-password');
const loginButton = document.getElementById('login-button');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const googleLoginButton = document.getElementById('google-login-button');
const authMessage = document.getElementById('auth-message');

const homeGreeting = document.getElementById('home-greeting');
const currentBalanceDisplayHome = document.getElementById('current-balance');
const homeCurrencySelector = document.getElementById('home-currency-selector');
const enableNotificationsButton = document.getElementById('enable-notifications-button');
const notificationStatus = document.getElementById('notification-status');

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

const goalsList = document.getElementById('goals-list');
const addGoalBtn = document.getElementById('add-goal-btn');
const addGoalForm = document.getElementById('add-goal-form');
const saveGoalButton = document.getElementById('save-goal-button');
const goalNameInput = document.getElementById('goal-name');
const goalAmountInput = document.getElementById('goal-amount');
const goalMessage = document.getElementById('goal-message');

const settingsModal = document.getElementById('settings-modal');
const closeModalButton = document.getElementById('close-modal-button');
const userEmailDisplay = document.getElementById('user-email-display');
const userPasswordInput = document.getElementById('user-password-input');
const togglePasswordButton = document.getElementById('toggle-password-button');
const logoutButton = document.getElementById('logout-button');
const themeDarkRadio = document.getElementById('theme-dark-radio');
const themeLightRadio = document.getElementById('theme-light-radio');
const mainColorInput = document.getElementById('main-color-input');
const accentColorInput = document.getElementById('accent-color-input');
const fontSelector = document.getElementById('font-selector');
const baseCurrencySelector = document.getElementById('base-currency-selector');
const languageSelector = document.getElementById('language-selector');
const passwordFieldContainer = document.querySelector('.password-field-container');

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
let isPWA = false;
let rates = {};
let allCurrencies = {};

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
            ? translations[lang].home.greeting_guest 
            : `${translations[lang].home.greeting_user} ${currentUser?.email || ''}`;
    }
    
    updateUI();
}

function showPage(pageId) {
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
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
        } catch (e) {
            console.error("Error adding document: ", e);
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
        } catch (e) {
            console.error("Error deleting transaction: ", e);
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
        } catch (e) {
            console.error("Error adding goal: ", e);
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
        } catch (e) {
            console.error("Error deleting goal: ", e);
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
}

function renderTransactionsTable(transactionsToRender) {
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
    
    const rateToHome = rates[selectedCurrencyHome] || 1;
    const rateToMyMoney = rates[selectedCurrencyMyMoney] || 1;
    const rateFromBase = 1 / rates[settings.baseCurrency];

    const balanceHome = (balanceInBase * rateToHome) * rateFromBase;
    const balanceMyMoney = (balanceInBase * rateToMyMoney) * rateFromBase;
    
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
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            let pageId = button.id.replace('-button', '').replace('-2', '').replace('-3', '') + '-page';
            if (pageId === 'my-money-page') pageId = 'budget-management-page';
            showPage(pageId);
        });
    });

    [settingsButton, settingsButton2, settingsButton3].forEach(btn => {
        if(btn) btn.addEventListener('click', showSettingsModal);
    });

    if (closeModalButton) closeModalButton.addEventListener('click', () => settingsModal.classList.add('hidden'));

    if (startGuestButton) startGuestButton.addEventListener('click', () => {
        isGuestMode = true;
        authFormSection.classList.add('hidden');
        if (homeGreeting) homeGreeting.textContent = translations[settings.language]['home.greeting_guest'];
        showPage('home-page');
        loadUserData();
    });

    if (showRegisterFormButton) showRegisterFormButton.addEventListener('click', () => {
        registerFields.classList.remove('hidden');
        loginFields.classList.add('hidden');
    });
    
    if (showLoginFormButton) showLoginFormButton.addEventListener('click', () => {
        registerFields.classList.add('hidden');
        loginFields.classList.remove('hidden');
    });

    if (registerButton) registerButton.addEventListener('click', async () => {
        const email = authEmailInput.value;
        const password = authPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        if (password !== confirmPassword) {
            showMessage(authMessage, translations[settings.language]['messages.password_mismatch'], 'error');
            return;
        }
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            showMessage(authMessage, translations[settings.language]['messages.register_success'], 'success');
        } catch (error) {
            showMessage(authMessage, `${translations[settings.language]['messages.register_error']}: ${error.message}`, 'error');
        }
    });

    if (loginButton) loginButton.addEventListener('click', async () => {
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            showMessage(authMessage, translations[settings.language]['messages.login_success'], 'success');
        } catch (error) {
            showMessage(authMessage, `${translations[settings.language]['messages.login_error']}: ${error.message}`, 'error');
        }
    });

    if (googleLoginButton) googleLoginButton.addEventListener('click', async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            showMessage(authMessage, translations[settings.language]['messages.google_login_success'], 'success');
        } catch (error) {
            showMessage(authMessage, `${translations[settings.language]['messages.google_login_error']}: ${error.message}`, 'error');
        }
    });

    if (logoutButton) logoutButton.addEventListener('click', async () => {
        if (isGuestMode) {
            isGuestMode = false;
            localStorage.removeItem('guestTransactions');
            localStorage.removeItem('guestGoals');
            currentUser = null;
            authFormSection.classList.remove('hidden');
            showPage('welcome-page');
        } else {
            await signOut(auth);
            showPage('welcome-page');
        }
        settingsModal.classList.add('hidden');
    });

    if (togglePasswordButton) togglePasswordButton.addEventListener('click', () => {
        if (userPasswordInput.type === 'password') {
            userPasswordInput.type = 'text';
            togglePasswordButton.textContent = translations[settings.language]['settings.hide_password'];
        } else {
            userPasswordInput.type = 'password';
            togglePasswordButton.textContent = translations[settings.language]['settings.show_password'];
        }
    });

    if (transactionForm) transactionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const type = transactionTypeSelect.value;
        const currency = transactionCurrencySelect.value;
        const amount = parseFloat(transactionAmountInput.value);
        const description = transactionDescriptionInput.value;
        const date = transactionDateInput.value;

        if (!amount || !date || isNaN(amount)) {
            showMessage(transactionMessage, translations[settings.language]['messages.fill_amount_date'], 'error');
            return;
        }

        const newTransaction = { type, amount, currency, description, date };
        await saveTransaction(newTransaction);
        showMessage(transactionMessage, translations[settings.language]['messages.transaction_added'], 'success');
        transactionForm.reset();
    });

    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-transaction')) {
            const transactionId = e.target.dataset.id;
            await deleteTransaction(transactionId);
            showMessage(transactionMessage, translations[settings.language]['messages.transaction_deleted'], 'success');
        }
        if (e.target.classList.contains('delete-goal-button')) {
            const goalId = e.target.dataset.id;
            await deleteGoal(goalId);
            showMessage(goalMessage, translations[settings.language]['messages.goal_deleted'], 'success');
        }
    });

    if (toggleTransactionsTable) toggleTransactionsTable.addEventListener('click', () => {
        transactionsTableContainer.classList.toggle('hidden');
    });

    if (addGoalBtn) addGoalBtn.addEventListener('click', () => {
        addGoalForm.classList.remove('hidden');
        addGoalBtn.classList.add('hidden');
    });

    if (saveGoalButton) saveGoalButton.addEventListener('click', async () => {
        const name = goalNameInput.value;
        const amount = parseFloat(goalAmountInput.value);

        if (!name || !amount || isNaN(amount)) {
            showMessage(goalMessage, translations[settings.language]['messages.fill_goal_details'], 'error');
            return;
        }
        const newGoal = { name, amount };
        await addGoal(newGoal);
        showMessage(goalMessage, translations[settings.language]['messages.goal_added'], 'success');
        goalNameInput.value = '';
        goalAmountInput.value = '';
        addGoalForm.classList.add('hidden');
        addGoalBtn.classList.remove('hidden');
    });

    if (filterButton) filterButton.addEventListener('click', () => {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        if (!startDate || !endDate) {
            showMessage(transactionMessage, translations[settings.language]['messages.select_date_range'], 'error');
            return;
        }
        const filtered = transactions.filter(t => t.date >= startDate && t.date <= endDate);
        renderTransactionsTable(filtered);
        updatePeriodSummary(filtered);
    });

    if (resetFilterButton) resetFilterButton.addEventListener('click', () => {
        renderTransactionsTable(transactions);
        updatePeriodSummary();
        startDateInput.value = '';
        endDateInput.value = '';
    });

    // שינוי הגדרות
    if (themeDarkRadio) themeDarkRadio.addEventListener('change', () => { settings.theme = 'dark'; saveSettings(); });
    if (themeLightRadio) themeLightRadio.addEventListener('change', () => { settings.theme = 'light'; saveSettings(); });
    if (mainColorInput) mainColorInput.addEventListener('input', (e) => { settings.mainColor = e.target.value; saveSettings(); });
    if (accentColorInput) accentColorInput.addEventListener('input', (e) => { settings.accentColor = e.target.value; saveSettings(); });
    if (fontSelector) fontSelector.addEventListener('change', (e) => { settings.font = e.target.value; saveSettings(); });
    if (baseCurrencySelector) baseCurrencySelector.addEventListener('change', (e) => {
        settings.baseCurrency = e.target.value;
        saveSettings();
        if (homeCurrencySelector) homeCurrencySelector.value = e.target.value;
        if (moneyPageCurrencySelector) moneyPageCurrencySelector.value = e.target.value;
    });
    
    if (languageSelector) languageSelector.addEventListener('change', (e) => {
        settings.language = e.target.value;
        saveSettings();
    });

    if (homeCurrencySelector) homeCurrencySelector.addEventListener('change', updateBalances);
    if (moneyPageCurrencySelector) moneyPageCurrencySelector.addEventListener('change', updateBalances);

    if (enableNotificationsButton) enableNotificationsButton.addEventListener('click', () => {
        if ('Notification' in window && 'serviceWorker' in navigator) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    if (notificationStatus) {
                        notificationStatus.textContent = translations[settings.language]['notifications.granted'];
                        enableNotificationsButton.classList.add('hidden');
                    }
                    new Notification(translations[settings.language]['app.title'], { body: translations[settings.language]['notifications.enabled_message'] });
                } else {
                    if (notificationStatus) notificationStatus.textContent = translations[settings.language]['notifications.denied'];
                }
            });
        } else {
            if (notificationStatus) {
                notificationStatus.textContent = translations[settings.language]['notifications.not_supported'];
                enableNotificationsButton.classList.add('hidden');
            }
        }
    });
}

function showSettingsModal() {
    if (isGuestMode) {
        if (userEmailDisplay) userEmailDisplay.textContent = `${translations[settings.language]['settings.email_label']}: ${translations[settings.language]['settings.guest_email']}`;
        if (passwordFieldContainer) passwordFieldContainer.classList.add('hidden');
    } else if (currentUser) {
        if (userEmailDisplay) userEmailDisplay.textContent = `${translations[settings.language]['settings.email_label']}: ${currentUser.email}`;
        if (passwordFieldContainer) passwordFieldContainer.classList.remove('hidden');
    }
    settingsModal.classList.remove('hidden');
}

// --- אימות וניהול משתמשים (Firebase) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        isGuestMode = false;
        if (homeGreeting) homeGreeting.textContent = `${translations[settings.language]['home.greeting_user']} ${currentUser.email}!`;
        if (userEmailDisplay) userEmailDisplay.textContent = `${translations[settings.language]['settings.email_label']}: ${currentUser.email}`;
        showPage('home-page');
        loadUserData();
        if (authFormSection) authFormSection.classList.add('hidden');
    } else {
        currentUser = null;
        if (!isGuestMode) {
            if (homeGreeting) homeGreeting.textContent = translations[settings.language]['home.greeting_user'];
            showPage('welcome-page');
            if (authFormSection) authFormSection.classList.remove('hidden');
        }
        if (userEmailDisplay) userEmailDisplay.textContent = '';
    }
});

// --- PWA ו-Service Worker ---
window.addEventListener('load', () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js').then(reg => {
            console.log('Service Worker registered!');
        }).catch(err => {
            console.error('Service Worker registration failed:', err);
        });
    }

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
        isPWA = true;
    }
    
    if (isPWA && 'Notification' in window) {
        if (Notification.permission === 'granted') {
            if (notificationStatus) {
                notificationStatus.textContent = translations[settings.language]['notifications.enabled'];
                enableNotificationsButton.classList.add('hidden');
            }
        } else {
            if (notificationStatus) {
                notificationStatus.textContent = translations[settings.language]['notifications.can_enable'];
                enableNotificationsButton.classList.remove('hidden');
            }
        }
    } else {
        if (notificationStatus) {
            notificationStatus.textContent = translations[settings.language]['notifications.pwa_only'];
            enableNotificationsButton.classList.add('hidden');
        }
    }
});

fetchExchangeRates();
applySettings();
attachEventListeners();