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

// הגדרות Firebase שלך (המידע הספציפי לפרויקט שלך)
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

// Settings Modal Elements
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
let isPWA = false; // דגל חדש לזיהוי האם האתר רץ כ-PWA

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

// עדכון נושא האתר
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

// שמירת ההגדרות ב-LocalStorage
function saveSettings() {
    localStorage.setItem('settings', JSON.stringify(settings));
}

// --- ניהול נתונים (Firebase / Local Storage) ---
async function loadUserData() {
    if (isGuestMode) {
        transactions = JSON.parse(localStorage.getItem('guestTransactions')) || [];
        goals = JSON.parse(localStorage.getItem('guestGoals')) || [];
        console.log("Loading guest data from LocalStorage.");
    } else if (currentUser) {
        console.log("Loading user data from Firestore...");
        const userId = currentUser.uid;

        // טעינת טרנזקציות
        const transactionsRef = collection(db, 'users', userId, 'transactions');
        const transactionsSnapshot = await getDocs(transactionsRef);
        transactions = transactionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // טעינת יעדים
        const goalsRef = collection(db, 'users', userId, 'goals');
        const goalsSnapshot = await getDocs(goalsRef);
        goals = goalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        console.log("User data loaded successfully.");
    }
    updateUI();
}

async function saveTransaction(transaction) {
    if (isGuestMode) {
        transaction.id = Date.now().toString(); // סימולציה של ID
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
        goal.id = Date.now().toString(); // סימולציה של ID
        goals.push(goal);
        localStorage.setItem('guestGoals', JSON.stringify(goals));
    } else if (currentUser) {
        const userId = currentUser.uid;
        try {
            await addDoc(collection(db, 'users', userId, 'goals'), goal);
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

// פונקציה להצגת טבלת פעולות
function renderTransactionsTable(transactionsToRender) {
    transactionsTableBody.innerHTML = '';
    transactionsToRender.forEach(t => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${t.date}</td>
            <td class="${t.type}">${t.amount.toFixed(2)} ₪</td>
            <td>${t.type === 'income' ? 'הכנסה' : 'הוצאה'}</td>
            <td>${t.description || ''}</td>
            <td>
                <button class="button danger small-button delete-transaction" data-id="${t.id}">מחק</button>
            </td>
        `;
        transactionsTableBody.appendChild(row);
    });
}

// פונקציה להצגת רשימת יעדים
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

// פונקציה לעדכון יתרות
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

// ניווט
homeButton.addEventListener('click', () => showPage(homePage));
myMoneyButton.addEventListener('click', () => showPage(budgetManagementPage));
graphsButton.addEventListener('click', () => showPage(graphsPage));
settingsButton.addEventListener('click', () => {
    if (currentUser) {
        userEmailDisplay.textContent = currentUser.email;
        userPasswordInput.value = "********";
    }
    settingsModal.style.display = 'flex';
});

// כניסה/הרשמה
startGuestButton.addEventListener('click', () => {
    isGuestMode = true;
    showPage(homePage);
    loadUserData();
    showMessage(authMessage, `ברוך הבא, אורח!`, 'success');
});
registerButton.addEventListener('click', async () => {
    const email = authEmailInput.value;
    const password = authPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (password !== confirmPassword) {
        showMessage(authMessage, 'הסיסמאות אינן תואמות!', 'error');
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
showLoginFormButton.addEventListener('click', () => {
    registerFields.style.display = 'none';
    loginFields.style.display = 'block';
});
showRegisterFormButton.addEventListener('click', () => {
    registerFields.style.display = 'block';
    loginFields.style.display = 'none';
});

// פונקציית התנתקות
logoutButton.addEventListener('click', async () => {
    await signOut(auth);
    showPage(welcomePage);
    document.body.classList.remove('logged-in');
    showMessage(authMessage, 'התנתקת בהצלחה.', 'success');
});

// פונקציית הצגת סיסמה
showPasswordButton.addEventListener('click', () => {
    if (userPasswordInput.type === 'password') {
        userPasswordInput.type = 'text';
        showPasswordButton.textContent = 'הסתר';
    } else {
        userPasswordInput.type = 'password';
        showPasswordButton.textContent = 'הצג';
    }
});

// פונקציות נוספות: הוספת פעולה, הוספת יעד, סינון וכו'
addTransactionButton.addEventListener('click', async () => {
    const type = transactionTypeSelect.value;
    const amount = parseFloat(transactionAmountInput.value);
    const description = transactionDescriptionInput.value;
    const date = transactionDateInput.value;

    if (!amount || !date) {
        showMessage(transactionMessage, 'אנא מלא סכום ותאריך', 'error');
        return;
    }

    const newTransaction = {
        id: Date.now().toString(), // יצירת ID זמני לפעולות אורח
        type,
        amount,
        description,
        date
    };

    // הוספת הפעולה לרשימה הנוכחית
    transactions.push(newTransaction);
    // שמירת הנתונים ב-LocalStorage או ב-Firebase
    if (isGuestMode) {
        localStorage.setItem('guestTransactions', JSON.stringify(transactions));
    } else if (currentUser) {
        const userId = currentUser.uid;
        try {
            const docRef = await addDoc(collection(db, 'users', userId, 'transactions'), newTransaction);
            newTransaction.id = docRef.id; // עדכון ה-ID מהשרת
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    }
    updateUI(); // קריאה לפונקציה שמעדכנת את הממשק (כולל הטבלה)
    showMessage(transactionMessage, 'פעולה נוספה בהצלחה!', 'success');
    transactionAmountInput.value = '';
    transactionDescriptionInput.value = '';
    transactionDateInput.value = '';
});

addGoalButton.addEventListener('click', async () => {
    const name = goalNameInput.value;
    const amount = parseFloat(goalAmountInput.value);

    if (!name || !amount) {
        showMessage(goalMessage, 'אנא מלא שם וסכום ליעד', 'error');
        return;
    }

    const newGoal = {
        name,
        amount,
        saved: 0
    };
    await addGoal(newGoal);
    showMessage(goalMessage, 'יעד נוסף בהצלחה!', 'success');
    goalNameInput.value = '';
    goalAmountInput.value = '';
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


filterButton.addEventListener('click', () => {
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
resetFilterButton.addEventListener('click', () => {
    renderTransactionsTable(transactions);
    updatePeriodSummary(transactions);
    startDateInput.value = '';
    endDateInput.value = '';
});

// --- התאמה אישית של עיצוב ---
closeModalButton.addEventListener('click', () => settingsModal.style.display = 'none');
themeDarkRadio.addEventListener('change', () => {
    settings.theme = 'dark';
    applySettings();
    saveSettings();
});
themeLightRadio.addEventListener('change', () => {
    settings.theme = 'light';
    applySettings();
    saveSettings();
});
mainColorInput.addEventListener('input', (e) => {
    settings.mainColor = e.target.value;
    applySettings();
    saveSettings();
});
accentColorInput.addEventListener('input', (e) => {
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

    if (isPWA) {
        notificationStatus.textContent = 'ניתן לאפשר התראות! לחץ על הכפתור למטה.';
        enableNotificationsButton.style.display = 'block';
    } else {
        notificationStatus.textContent = 'כדי לקבל התראות, הוסף את האתר למסך הבית שלך.';
        enableNotificationsButton.style.display = 'none';
    }
});

enableNotificationsButton.addEventListener('click', () => {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                notificationStatus.textContent = 'התראות אושרו בהצלחה! 🎉';
                enableNotificationsButton.style.display = 'none';
                // ניתן לשלוח התראת מבחן
                new Notification('הכסף שלי', { body: 'התראות אפליקציה הופעלו בהצלחה!' });
            } else {
                notificationStatus.textContent = 'התראות נדחו או לא ניתנו. 😔';
            }
        });
    } else {
        notificationStatus.textContent = 'התראות לא נתמכות בדפדפן זה.';
    }
});

// --- אימות וניהול משתמשים (Firebase) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        isGuestMode = false;
        console.log("משתמש מחובר:", currentUser.email);
        homeGreeting.textContent = `שלום, ${currentUser.email}!`;
        showPage(homePage);
        loadUserData();
        document.body.classList.add('logged-in'); // הוספת מחלקה לגוף הדף
    } else {
        currentUser = null;
        isGuestMode = false;
        console.log("משתמש לא מחובר.");
        showPage(welcomePage);
        document.body.classList.remove('logged-in'); // הסרת המחלקה
    }
});

applySettings();