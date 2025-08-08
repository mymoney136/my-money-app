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
    baseCurrency: 'ILS'
};
let currentUser = null;
let isGuestMode = false;
let isPWA = false;
let rates = {};

// --- פונקציות עזר כלליות ---
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

    themeDarkRadio.checked = settings.theme === 'dark';
    themeLightRadio.checked = settings.theme === 'light';
    mainColorInput.value = settings.mainColor;
    accentColorInput.value = settings.accentColor;
    fontSelector.value = settings.font;
    baseCurrencySelector.value = settings.baseCurrency;
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
    } catch (error) {
        console.error("Error fetching exchange rates:", error);
    }
}

function convertToBaseCurrency(amount, currency) {
    if (!rates[settings.baseCurrency] || !rates[currency]) {
        console.error("Missing exchange rate data");
        return amount; // Fallback
    }
    const rateToUSD = 1 / rates[currency];
    const rateFromUSD = rates[settings.baseCurrency];
    return (amount * rateToUSD) * rateFromUSD;
}

// --- ניהול נתונים (Firebase / Local Storage) ---
async function loadUserData() {
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
            <td>${t.type === 'income' ? 'הכנסה' : 'הוצאה'}</td>
            <td>${t.description || ''}</td>
            <td>
                <button class="button danger small-button delete-transaction" data-id="${t.id}">מחק</button>
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
                <strong>${g.name}</strong> - יעד: ${parseFloat(g.amount).toFixed(2)} ${settings.baseCurrency}
            </div>
            <div class="goal-actions">
                <button class="button round danger delete-goal-button" data-id="${g.id}">מחק</button>
            </div>
        `;
        goalsList.appendChild(li);
    });
}

function updateBalances() {
    const selectedCurrencyHome = homeCurrencySelector.value;
    const selectedCurrencyMyMoney = moneyPageCurrencySelector.value;
    let balanceInBase = 0;

    transactions.forEach(t => {
        const amountInBase = convertToBaseCurrency(t.amount, t.currency);
        if (t.type === 'income') {
            balanceInBase += amountInBase;
        } else {
            balanceInBase -= amountInBase;
        }
    });

    const balanceHome = convertToBaseCurrency(balanceInBase, settings.baseCurrency) / (rates[selectedCurrencyHome] / rates[settings.baseCurrency]);
    const balanceMyMoney = convertToBaseCurrency(balanceInBase, settings.baseCurrency) / (rates[selectedCurrencyMyMoney] / rates[settings.baseCurrency]);
    
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
            periodSummaryReport.textContent = 'כל הכבוד! נשאר לך עודף בתקופה זו.';
        } else if (periodBalance === 0) {
            periodSummaryReport.className = 'message info';
            periodSummaryReport.textContent = 'סיימת את התקופה באיזון.';
        } else {
            periodSummaryReport.className = 'message error';
            periodSummaryReport.textContent = 'שים לב, נכנסת למינוס בתקופה זו.';
        }
        periodSummaryReport.classList.remove('hidden');
    }
}

// --- גרפים ---
function renderGraphs() {
    const expenseCategories = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        const category = t.description || 'אחר';
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

    expensesPieChart = new Chart(expensesPieChartCtx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { color: settings.theme === 'dark' ? 'white' : 'black' } },
                title: { display: true, text: 'הוצאות לפי קטגוריות', color: settings.theme === 'dark' ? 'white' : 'black' }
            }
        }
    });
}

// --- אירועי לחיצות (Event Listeners) ---
function attachEventListeners() {
    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            let pageId = button.id.replace('-button', '').replace('-2', '').replace('-3', '') + '-page';
            if (pageId === 'home-page') showPage('home-page');
            else if (pageId === 'my-money-page') showPage('budget-management-page');
            else if (pageId === 'graphs-page') showPage('graphs-page');
        });
    });

    settingsButton.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    settingsButton2.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    settingsButton3.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    
    closeModalButton.addEventListener('click', () => settingsModal.classList.add('hidden'));

    startGuestButton.addEventListener('click', () => {
        isGuestMode = true;
        homeGreeting.textContent = 'שלום, אורח!';
        showPage('home-page');
        loadUserData();
        authFormSection.classList.add('hidden');
    });

    showRegisterFormButton.addEventListener('click', () => {
        registerFields.classList.remove('hidden');
        loginFields.classList.add('hidden');
    });
    
    showLoginFormButton.addEventListener('click', () => {
        registerFields.classList.add('hidden');
        loginFields.classList.remove('hidden');
    });

    registerButton.addEventListener('click', async () => {
        const email = authEmailInput.value;
        const password = authPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        if (password !== confirmPassword) {
            showMessage(authMessage, 'הסיסמאות אינן תואמות!', 'error');
            return;
        }
        if (!validateEmail(email)) {
            showMessage(authMessage, 'אנא הכנס כתובת אימייל חוקית.', 'error');
            return;
        }
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            showMessage(authMessage, 'הרשמה מוצלחת! אתה מחובר כעת.', 'success');
            authEmailInput.value = '';
            authPasswordInput.value = '';
            confirmPasswordInput.value = '';
        } catch (error) {
            showMessage(authMessage, `שגיאת הרשמה: ${error.message}`, 'error');
        }
    });

    loginButton.addEventListener('click', async () => {
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            showMessage(authMessage, 'התחברות מוצלחת!', 'success');
            loginEmailInput.value = '';
            loginPasswordInput.value = '';
        } catch (error) {
            showMessage(authMessage, `שגיאת התחברות: ${error.message}`, 'error');
        }
    });

    googleLoginButton.addEventListener('click', async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            showMessage(authMessage, 'התחברות עם גוגל מוצלחת!', 'success');
        } catch (error) {
            showMessage(authMessage, `שגיאת התחברות עם גוגל: ${error.message}`, 'error');
        }
    });

    logoutButton.addEventListener('click', async () => {
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

    togglePasswordButton.addEventListener('click', () => {
        if (userPasswordInput.type === 'password') {
            userPasswordInput.type = 'text';
            togglePasswordButton.textContent = 'הסתר';
        } else {
            userPasswordInput.type = 'password';
            togglePasswordButton.textContent = 'הצג';
        }
    });

    transactionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const type = transactionTypeSelect.value;
        const currency = transactionCurrencySelect.value;
        const amount = parseFloat(transactionAmountInput.value);
        const description = transactionDescriptionInput.value;
        const date = transactionDateInput.value;

        if (!amount || !date || isNaN(amount)) {
            showMessage(transactionMessage, 'אנא מלא סכום ותאריך', 'error');
            return;
        }

        const newTransaction = { type, amount, currency, description, date };
        await saveTransaction(newTransaction);
        showMessage(transactionMessage, 'פעולה נוספה בהצלחה!', 'success');
        transactionForm.reset();
    });

    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-transaction')) {
            const transactionId = e.target.dataset.id;
            await deleteTransaction(transactionId);
            showMessage(transactionMessage, 'פעולה נמחקה בהצלחה.', 'success');
        }
        if (e.target.classList.contains('delete-goal-button')) {
            const goalId = e.target.dataset.id;
            await deleteGoal(goalId);
            showMessage(goalMessage, 'יעד נמחק בהצלחה.', 'success');
        }
    });

    toggleTransactionsTable.addEventListener('click', () => {
        transactionsTableContainer.classList.toggle('hidden');
    });

    addGoalBtn.addEventListener('click', () => {
        addGoalForm.classList.remove('hidden');
        addGoalBtn.classList.add('hidden');
    });

    saveGoalButton.addEventListener('click', async () => {
        const name = goalNameInput.value;
        const amount = parseFloat(goalAmountInput.value);

        if (!name || !amount || isNaN(amount)) {
            showMessage(goalMessage, 'אנא מלא שם וסכום ליעד', 'error');
            return;
        }
        const newGoal = { name, amount };
        await addGoal(newGoal);
        showMessage(goalMessage, 'יעד נוסף בהצלחה!', 'success');
        goalNameInput.value = '';
        goalAmountInput.value = '';
        addGoalForm.classList.add('hidden');
        addGoalBtn.classList.remove('hidden');
    });

    filterButton.addEventListener('click', () => {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        if (!startDate || !endDate) {
            showMessage(transactionMessage, 'אנא בחר תאריכי התחלה וסיום.', 'error');
            return;
        }
        const filtered = transactions.filter(t => t.date >= startDate && t.date <= endDate);
        renderTransactionsTable(filtered);
        updatePeriodSummary(filtered);
    });

    resetFilterButton.addEventListener('click', () => {
        renderTransactionsTable(transactions);
        updatePeriodSummary();
        startDateInput.value = '';
        endDateInput.value = '';
    });

    // שינוי הגדרות
    themeDarkRadio.addEventListener('change', () => { settings.theme = 'dark'; saveSettings(); });
    themeLightRadio.addEventListener('change', () => { settings.theme = 'light'; saveSettings(); });
    mainColorInput.addEventListener('input', (e) => { settings.mainColor = e.target.value; saveSettings(); });
    accentColorInput.addEventListener('input', (e) => { settings.accentColor = e.target.value; saveSettings(); });
    fontSelector.addEventListener('change', (e) => { settings.font = e.target.value; saveSettings(); });
    baseCurrencySelector.addEventListener('change', (e) => {
        settings.baseCurrency = e.target.value;
        saveSettings();
        // עדכון סלקטורים אחרים
        homeCurrencySelector.value = e.target.value;
        moneyPageCurrencySelector.value = e.target.value;
    });
    
    homeCurrencySelector.addEventListener('change', updateBalances);
    moneyPageCurrencySelector.addEventListener('change', updateBalances);

    enableNotificationsButton.addEventListener('click', () => {
        if ('Notification' in window && 'serviceWorker' in navigator) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    notificationStatus.textContent = 'התראות אושרו! 🎉';
                    enableNotificationsButton.classList.add('hidden');
                    new Notification('הכסף שלי', { body: 'התראות אפליקציה הופעלו בהצלחה!' });
                } else {
                    notificationStatus.textContent = 'התראות נדחו. 😔';
                }
            });
        } else {
            notificationStatus.textContent = 'התראות לא נתמכות בדפדפן זה.';
        }
    });
}

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

// --- אימות וניהול משתמשים (Firebase) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        isGuestMode = false;
        homeGreeting.textContent = `שלום, ${currentUser.email}!`;
        userEmailDisplay.textContent = currentUser.email;
        showPage('home-page');
        loadUserData();
        authFormSection.classList.add('hidden');
        userPasswordInput.disabled = false;
    } else {
        currentUser = null;
        if (!isGuestMode) {
            homeGreeting.textContent = 'שלום!';
            showPage('welcome-page');
            authFormSection.classList.remove('hidden');
        }
        userEmailDisplay.textContent = '';
        userPasswordInput.disabled = true;
    }
});

// --- PWA ו-Service Worker ---
window.addEventListener('load', () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/my-money-app/service-worker.js').then(reg => {
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
            notificationStatus.textContent = 'התראות מופעלות. 🎉';
            enableNotificationsButton.classList.add('hidden');
        } else {
            notificationStatus.textContent = 'ניתן לאפשר התראות לאפליקציה!';
            enableNotificationsButton.classList.remove('hidden');
        }
    } else {
        notificationStatus.textContent = 'התראות זמינות רק כאשר האתר מותקן כאפליקציה.';
        enableNotificationsButton.classList.add('hidden');
    }
});

fetchExchangeRates();
applySettings();
attachEventListeners();