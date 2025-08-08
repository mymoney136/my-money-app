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


// --- נתונים גלובליים ---
let transactions = [];
let goals = [];
let settings = JSON.parse(localStorage.getItem('settings')) || {
    theme: 'light',
    mainColor: '#007bff',
    accentColor: '#6c757d',
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
    root.style.setProperty('--main-color', settings.mainColor);
    root.style.setProperty('--accent-color', settings.accentColor);
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

    document.querySelector(`input[name="font"][value="${settings.font}"]`).checked = true;
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
                <strong>${g.name}</strong> - יעד: ${g.amount.toFixed(2)} ₪, נחסך: ${g.saved.toFixed(2)} ₪
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

    currentBalanceDisplayHome.textContent = `${balance.toFixed(2)} ₪`;
    currentBalanceDisplayMyMoney.textContent = `${balance.toFixed(2)} ₪`;
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

    periodIncomeSpan.textContent = `${periodIncome.toFixed(2)} ₪`;
    periodExpenseSpan.textContent = `${periodExpense.toFixed(2)} ₪`;
    periodBalanceSpan.textContent = `${periodBalance.toFixed(2)} ₪`;

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

// --- אירועי לחיצות (Event Listeners) ---
homeButton.addEventListener('click', () => showPage(homePage));
myMoneyButton.addEventListener('click', () => showPage(budgetManagementPage));
graphsButton.addEventListener('click', () => showPage(graphsPage));
settingsButton.addEventListener('click', () => {
    settingsModal.style.display = 'flex';
});

startGuestButton.addEventListener('click', () => {
    isGuestMode = true;
    showPage(homePage);
    loadUserData();
    showMessage(authMessage, `ברוך הבא, אורח!`, 'success');
    document.body.classList.add('logged-in');
    document.body.classList.add('guest-mode'); // הוספת מחלקה ייעודית למצב אורח
});

// ... (שאר הקוד של הרשמה, התחברות וכו')

// --- אימות וניהול משתמשים (Firebase) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        isGuestMode = false;
        homeGreeting.textContent = `שלום, ${currentUser.email}!`;
        showPage(homePage);
        loadUserData();
        document.body.classList.add('logged-in');
        document.body.classList.remove('guest-mode'); // הסרת מחלקת אורח
    } else {
        currentUser = null;
        if (!isGuestMode) { // אם לא במצב אורח, מציג את דף הכניסה
            showPage(welcomePage);
            document.body.classList.remove('logged-in');
            document.body.classList.remove('guest-mode');
        } else { // אם במצב אורח, לא משנה את התצוגה
            // שומר על מצב אורח פעיל
        }
    }
});

logoutButton.addEventListener('click', async () => {
    if (isGuestMode) {
        // התנתקות ממצב אורח
        isGuestMode = false;
        localStorage.removeItem('guestTransactions');
        localStorage.removeItem('guestGoals');
        showPage(welcomePage);
        document.body.classList.remove('logged-in');
        document.body.classList.remove('guest-mode');
        showMessage(authMessage, 'התנתקת ממצב אורח.', 'success');
    } else {
        // התנתקות ממשתמש רשום
        await signOut(auth);
        showPage(welcomePage);
        document.body.classList.remove('logged-in');
        document.body.classList.remove('guest-mode');
        showMessage(authMessage, 'התנתקת בהצלחה.', 'success');
    }
});


// ... (שאר הקוד של העיצוב וה-PWA)

// אתחל את הקוד ה-JavaScript הקיים:
applySettings();