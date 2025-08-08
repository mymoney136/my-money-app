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

// קבלת הפניות לשירותים
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// --- אלמנטים מה-DOM ---
const welcomePage = document.getElementById('welcome-page');
const homePage = document.getElementById('home-page');
const budgetManagementPage = document.getElementById('budget-management-page');
const graphsPage = document.getElementById('graphs-page');

const homeButton = document.getElementById('home-button');
const myMoneyButton = document.getElementById('my-money-button');
const graphsButton = document.getElementById('graphs-button');
const settingsButton = document.getElementById('settings-button');
const homeButton2 = document.getElementById('home-button-2');
const myMoneyButton2 = document.getElementById('my-money-button-2');
const graphsButton2 = document.getElementById('graphs-button-2');
const settingsButton2 = document.getElementById('settings-button-2');
const homeButton3 = document.getElementById('home-button-3');
const myMoneyButton3 = document.getElementById('my-money-button-3');
const graphsButton3 = document.getElementById('graphs-button-3');
const settingsButton3 = document.getElementById('settings-button-3');

const startGuestButton = document.getElementById('start-guest-button');
const authFormSection = document.getElementById('auth-form-section');

const authEmailInput = document.getElementById('auth-email');
const authPasswordInput = document.getElementById('auth-password');
const confirmPasswordInput = document.getElementById('confirm-password');
const registerButton = document.getElementById('register-button');

const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginButton = document.getElementById('login-button');
const showRegisterFormButton = document.getElementById('show-register-form-button');
const showLoginFormButton = document.getElementById('show-login-form-button');
const googleLoginButton = document.getElementById('google-login-button');
const authMessage = document.getElementById('auth-message');
const registerFields = document.getElementById('register-fields');
const loginFields = document.getElementById('login-fields');

const homeGreeting = document.getElementById('home-greeting');
const currentBalanceDisplayHome = document.getElementById('current-balance');
const enableNotificationsButton = document.getElementById('enable-notifications-button');
const notificationStatus = document.getElementById('notification-status');

const currentBalanceDisplayMyMoney = document.getElementById('current-balance-money-page');
const transactionTypeSelect = document.getElementById('transaction-type');
const transactionAmountInput = document.getElementById('transaction-amount');
const transactionDescriptionInput = document.getElementById('transaction-description');
const transactionDateInput = document.getElementById('transaction-date');
const addTransactionButton = document.getElementById('add-transaction-button');
const transactionMessage = document.getElementById('transaction-message');
const transactionsTableBody = document.getElementById('transactions-table-body');

const goalNameInput = document.getElementById('goal-name');
const goalAmountInput = document.getElementById('goal-amount');
const addGoalButton = document.getElementById('add-goal-button');
const goalMessage = document.getElementById('goal-message');
const goalsList = document.getElementById('goals-list');

const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const filterButton = document.getElementById('filter-button');
const resetFilterButton = document.getElementById('reset-filter-button');
const periodIncomeSpan = document.getElementById('period-income');
const periodExpenseSpan = document.getElementById('period-expense');
const periodBalanceSpan = document.getElementById('period-balance');
const periodSummaryReport = document.getElementById('period-summary-report');

const settingsModal = document.getElementById('settings-modal');
const closeModalButton = document.getElementById('close-modal-button');
const userEmailDisplay = document.getElementById('user-email-display');
const userPasswordInput = document.getElementById('user-password-input');
const showPasswordButton = document.getElementById('show-password-button');
const logoutButton = document.getElementById('logout-button');
const themeDarkRadio = document.getElementById('theme-dark-radio');
const themeLightRadio = document.getElementById('theme-light-radio');
const mainColorInput = document.getElementById('main-color-input');
const accentColorInput = document.getElementById('accent-color-input');
const fontHeeboRadio = document.getElementById('font-Heebo-radio');
const fontPoppinsRadio = document.getElementById('font-Poppins-radio');
const fontArialRadio = document.getElementById('font-Arial-radio');

const expensesPieChartCtx = document.getElementById('expenses-pie-chart')?.getContext('2d');
let expensesPieChart;


// --- נתונים גלובליים ---
let transactions = [];
let goals = [];
let settings = JSON.parse(localStorage.getItem('settings')) || {
    theme: 'light',
    mainColor: '#7289DA',
    accentColor: '#4CAF50',
    font: 'Heebo'
};
let currentUser = null;
let isGuestMode = false;
let isPWA = false;

// --- פונקציות עזר כלליות ---
function showPage(pageToShow) {
    const pages = [welcomePage, homePage, budgetManagementPage, graphsPage];
    pages.forEach(page => page.classList.remove('active'));
    pageToShow.classList.add('active');
}

function showMessage(element, text, type) {
    element.textContent = text;
    element.className = `message ${type}`;
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

function applySettings() {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', settings.mainColor);
    root.style.setProperty('--secondary-color', settings.accentColor);
    root.style.setProperty('font-family', settings.font);

    if (settings.theme === 'dark') {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        themeDarkRadio.checked = true;
    } else {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        themeLightRadio.checked = true;
    }

    mainColorInput.value = settings.mainColor;
    accentColorInput.value = settings.accentColor;

    const fontRadio = document.querySelector(`input[name="font"][value="${settings.font}"]`);
    if (fontRadio) fontRadio.checked = true;
}

function saveSettings() {
    localStorage.setItem('settings', JSON.stringify(settings));
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
            <td class="${t.type}">${parseFloat(t.amount).toFixed(2)} ₪</td>
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
                <strong>${g.name}</strong> - יעד: ${g.amount.toFixed(2)} ₪, נחסך: ${g.saved ? g.saved.toFixed(2) : 0} ₪
            </div>
            <div class="goal-actions">
                <button class="button danger small-button delete-goal" data-id="${g.id}">מחק</button>
            </div>
        `;
        goalsList.appendChild(li);
    });
}

function updateBalances() {
    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach(t => {
        if (t.type === 'income') {
            totalIncome += parseFloat(t.amount);
        } else {
            totalExpense += parseFloat(t.amount);
        }
    });
    const balance = totalIncome - totalExpense;

    if (currentBalanceDisplayHome) currentBalanceDisplayHome.textContent = `${balance.toFixed(2)} ₪`;
    if (currentBalanceDisplayMyMoney) currentBalanceDisplayMyMoney.textContent = `${balance.toFixed(2)} ₪`;
}

function updatePeriodSummary(filteredTransactions = transactions) {
    let periodIncome = 0;
    let periodExpense = 0;
    filteredTransactions.forEach(t => {
        if (t.type === 'income') {
            periodIncome += parseFloat(t.amount);
        } else {
            periodExpense += parseFloat(t.amount);
        }
    });

    const periodBalance = periodIncome - periodExpense;

    if (periodIncomeSpan) periodIncomeSpan.textContent = `${periodIncome.toFixed(2)} ₪`;
    if (periodExpenseSpan) periodExpenseSpan.textContent = `${periodExpense.toFixed(2)} ₪`;
    if (periodBalanceSpan) periodBalanceSpan.textContent = `${periodBalance.toFixed(2)} ₪`;

    if (periodSummaryReport) {
        if (periodBalance > 0) {
            periodSummaryReport.className = 'period-summary-report good-budget';
            periodSummaryReport.textContent = 'כל הכבוד! נשאר לך עודף בתקופה זו.';
        } else if (periodBalance === 0) {
            periodSummaryReport.className = 'period-summary-report warning-budget';
            periodSummaryReport.textContent = 'סיימת את התקופה באיזון.';
        } else {
            periodSummaryReport.className = 'period-summary-report bad-budget';
            periodSummaryReport.textContent = 'שים לב, נכנסת למינוס בתקופה זו.';
        }
    }
}

// --- גרפים ---
function renderGraphs() {
    const expenseCategories = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        const category = t.description || 'אחר';
        if (!expenseCategories[category]) {
            expenseCategories[category] = 0;
        }
        expenseCategories[category] += parseFloat(t.amount);
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
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40'
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'הוצאות לפי קטגוריות'
                }
            }
        }
    });
}

// --- אירועי לחיצות (Event Listeners) ---
function attachEventListeners() {
    if (homeButton) homeButton.addEventListener('click', () => showPage(homePage));
    if (myMoneyButton) myMoneyButton.addEventListener('click', () => showPage(budgetManagementPage));
    if (graphsButton) graphsButton.addEventListener('click', () => showPage(graphsPage));
    if (settingsButton) settingsButton.addEventListener('click', () => {
        if (isGuestMode) {
            userEmailDisplay.textContent = "אורח";
            if (userPasswordInput.parentElement) {
                userPasswordInput.parentElement.style.display = 'none';
            }
            showPasswordButton.style.display = 'none';
        } else if (currentUser) {
            userEmailDisplay.textContent = currentUser.email;
            if (userPasswordInput.parentElement) {
                userPasswordInput.parentElement.style.display = 'block';
            }
            userPasswordInput.value = "********";
            showPasswordButton.style.display = 'inline-block';
        }
        settingsModal.style.display = 'flex';
    });

    if (homeButton2) homeButton2.addEventListener('click', () => showPage(homePage));
    if (myMoneyButton2) myMoneyButton2.addEventListener('click', () => showPage(budgetManagementPage));
    if (graphsButton2) graphsButton2.addEventListener('click', () => showPage(graphsPage));
    if (settingsButton2) settingsButton2.addEventListener('click', () => settingsButton.click());
    
    if (homeButton3) homeButton3.addEventListener('click', () => showPage(homePage));
    if (myMoneyButton3) myMoneyButton3.addEventListener('click', () => showPage(budgetManagementPage));
    if (graphsButton3) graphsButton3.addEventListener('click', () => showPage(graphsPage));
    if (settingsButton3) settingsButton3.addEventListener('click', () => settingsButton.click());

    if (startGuestButton) startGuestButton.addEventListener('click', () => {
        isGuestMode = true;
        homeGreeting.textContent = 'שלום, אורח!';
        showPage(homePage);
        loadUserData();
        showMessage(authMessage, `ברוך הבא, אורח!`, 'success');
        document.body.classList.add('logged-in');
        document.body.classList.add('guest-mode');
    });

    if (registerButton) registerButton.addEventListener('click', async () => {
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

    if (loginButton) loginButton.addEventListener('click', async () => {
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

    if (googleLoginButton) googleLoginButton.addEventListener('click', async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            showMessage(authMessage, 'התחברות עם גוגל מוצלחת!', 'success');
        } catch (error) {
            showMessage(authMessage, `שגיאת התחברות עם גוגל: ${error.message}`, 'error');
        }
    });

    if (showLoginFormButton) showLoginFormButton.addEventListener('click', () => {
        registerFields.style.display = 'none';
        loginFields.style.display = 'block';
    });
    
    if (showRegisterFormButton) showRegisterFormButton.addEventListener('click', () => {
        registerFields.style.display = 'block';
        loginFields.style.display = 'none';
    });

    if (logoutButton) logoutButton.addEventListener('click', async () => {
        if (isGuestMode) {
            isGuestMode = false;
            localStorage.removeItem('guestTransactions');
            localStorage.removeItem('guestGoals');
            homeGreeting.textContent = 'שלום!';
            showPage(welcomePage);
            document.body.classList.remove('logged-in');
            document.body.classList.remove('guest-mode');
            showMessage(authMessage, 'התנתקת ממצב אורח.', 'success');
        } else {
            await signOut(auth);
            homeGreeting.textContent = 'שלום!';
            showPage(welcomePage);
            document.body.classList.remove('logged-in');
            document.body.classList.remove('guest-mode');
            showMessage(authMessage, 'התנתקת בהצלחה.', 'success');
        }
    });

    if (showPasswordButton) showPasswordButton.addEventListener('click', () => {
        if (userPasswordInput.type === 'password') {
            userPasswordInput.type = 'text';
            showPasswordButton.textContent = 'הסתר';
        } else {
            userPasswordInput.type = 'password';
            showPasswordButton.textContent = 'הצג';
        }
    });

    if (addTransactionButton) addTransactionButton.addEventListener('click', async () => {
        const type = transactionTypeSelect.value;
        const amount = parseFloat(transactionAmountInput.value);
        const description = transactionDescriptionInput.value;
        const date = transactionDateInput.value;

        if (!amount || !date || isNaN(amount)) {
            showMessage(transactionMessage, 'אנא מלא סכום ותאריך', 'error');
            return;
        }

        const newTransaction = {
            type,
            amount,
            description,
            date
        };
        
        await saveTransaction(newTransaction);
        
        showMessage(transactionMessage, 'פעולה נוספה בהצלחה!', 'success');
        transactionAmountInput.value = '';
        transactionDescriptionInput.value = '';
        transactionDateInput.value = '';
    });

    if (addGoalButton) addGoalButton.addEventListener('click', async () => {
        const name = goalNameInput.value;
        const amount = parseFloat(goalAmountInput.value);

        if (!name || !amount || isNaN(amount)) {
            showMessage(goalMessage, 'אנא מלא שם וסכום ליעד', 'error');
        } else {
            const newGoal = {
                name,
                amount,
                saved: 0
            };
            await addGoal(newGoal);
            showMessage(goalMessage, 'יעד נוסף בהצלחה!', 'success');
            goalNameInput.value = '';
            goalAmountInput.value = '';
        }
    });

    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-transaction')) {
            const transactionId = e.target.dataset.id;
            await deleteTransaction(transactionId);
            showMessage(transactionMessage, 'פעולה נמחקה בהצלחה.', 'success');
        }
        if (e.target.classList.contains('delete-goal')) {
            const goalId = e.target.dataset.id;
            await deleteGoal(goalId);
            showMessage(goalMessage, 'יעד נמחק בהצלחה.', 'success');
        }
    });

    if (filterButton) filterButton.addEventListener('click', () => {
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        if (!startDate || !endDate) {
            showMessage(transactionMessage, 'אנא בחר תאריכי התחלה וסיום.', 'error');
            return;
        }

        const filtered = transactions.filter(t => {
            const transactionDate = t.date;
            return transactionDate >= startDate && transactionDate <= endDate;
        });

        renderTransactionsTable(filtered);
        updatePeriodSummary(filtered);
    });

    if (resetFilterButton) resetFilterButton.addEventListener('click', () => {
        renderTransactionsTable(transactions);
        updatePeriodSummary(transactions);
        startDateInput.value = '';
        endDateInput.value = '';
    });

    if (closeModalButton) closeModalButton.addEventListener('click', () => settingsModal.style.display = 'none');
    if (themeDarkRadio) themeDarkRadio.addEventListener('change', () => {
        settings.theme = 'dark';
        applySettings();
        saveSettings();
    });
    if (themeLightRadio) themeLightRadio.addEventListener('change', () => {
        settings.theme = 'light';
        applySettings();
        saveSettings();
    });
    if (mainColorInput) mainColorInput.addEventListener('input', (e) => {
        settings.mainColor = e.target.value;
        applySettings();
        saveSettings();
    });
    if (accentColorInput) accentColorInput.addEventListener('input', (e) => {
        settings.accentColor = e.target.value;
        applySettings();
        saveSettings();
    });
    document.querySelectorAll('input[name="font"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            settings.font = e.target.value;
            applySettings();
            saveSettings();
        });
    });

    if (enableNotificationsButton) enableNotificationsButton.addEventListener('click', () => {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    notificationStatus.textContent = 'התראות אושרו בהצלחה! 🎉';
                    enableNotificationsButton.style.display = 'none';
                    new Notification('הכסף שלי', { body: 'התראות אפליקציה הופעלו בהצלחה!' });
                } else {
                    notificationStatus.textContent = 'התראות נדחו או לא ניתנו. 😔';
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
        showPage(homePage);
        loadUserData();
        document.body.classList.add('logged-in');
        document.body.classList.remove('guest-mode');
        updateAuthUI();
    } else {
        currentUser = null;
        if (!isGuestMode) {
            homeGreeting.textContent = 'שלום!';
            showPage(welcomePage);
            document.body.classList.remove('logged-in');
        } else {
            homeGreeting.textContent = 'שלום, אורח!';
            showPage(homePage);
        }
        updateAuthUI();
    }
});

function updateAuthUI() {
    if (isGuestMode || currentUser) {
        authFormSection.style.display = 'none';
    } else {
        authFormSection.style.display = 'block';
    }
}

// --- PWA ו-Service Worker ---
if (window.matchMedia('(display-mode: standalone)').matches || document.referrer.startsWith('android-app://')) {
    isPWA = true;
}
window.addEventListener('load', () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/my-money-app/service-worker.js').then(reg => {
            console.log('Service Worker registered! 😎', reg);
        }).catch(err => {
            console.log('Service Worker registration failed: 😫', err);
        });
    }

    if (isPWA && ('Notification' in window)) {
        if (notificationStatus) {
            notificationStatus.textContent = 'ניתן לאפשר התראות! לחץ על הכפתור למטה.';
        }
        if (enableNotificationsButton) {
            enableNotificationsButton.style.display = 'block';
        }
    } else {
        if (notificationStatus) {
            notificationStatus.textContent = 'כדי לקבל התראות, הוסף את האתר למסך הבית שלך.';
        }
        if (enableNotificationsButton) {
            enableNotificationsButton.style.display = 'none';
        }
    }
});

applySettings();
attachEventListeners();