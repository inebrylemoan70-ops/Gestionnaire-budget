// Structure Globale par défaut
const defaultState = {
    settings: {
        payDay: 25,
        horizon: 12,
        savingsRate: 50
    },
    checkingAccounts: [
        { id: 1, label: "Compte Principal", amount: 1000 }
    ],
    incomes: [],
    expenses: [],
    savingsAccounts: [],
    projects: []
};

// Icônes SVG sobres et épurées
const iconEditSVG = `
    <svg viewBox="0 0 24 24">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
`;

const iconDeleteSVG = `
    <svg viewBox="0 0 24 24">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
`;

// Validation, Rétrocompatibilité (pour anciens exports JSON)
function validateAndCleanState(data) {
    if (!data || typeof data !== 'object') return defaultState;
    
    let checkings = Array.isArray(data.checkingAccounts) ? data.checkingAccounts : [];
    if (checkings.length === 0 && typeof data.initialChecking === 'number') {
        checkings.push({ id: Date.now(), label: "Compte Principal", amount: data.initialChecking });
    }

    return {
        settings: {
            payDay: parseInt(data.settings?.payDay) || defaultState.settings.payDay,
            horizon: parseInt(data.settings?.horizon) || defaultState.settings.horizon,
            savingsRate: parseFloat(data.settings?.savingsRate) ?? defaultState.settings.savingsRate
        },
        checkingAccounts: checkings,
        incomes: Array.isArray(data.incomes) ? data.incomes : [],
        expenses: Array.isArray(data.expenses) ? data.expenses : [],
        savingsAccounts: Array.isArray(data.savingsAccounts) ? data.savingsAccounts : [],
        projects: Array.isArray(data.projects) ? data.projects : []
    };
}

let state = validateAndCleanState(JSON.parse(localStorage.getItem('budgetData')));

function saveState() {
    localStorage.setItem('budgetData', JSON.stringify(state));
    render();
}

// Références DOM Paramètres
const payDayInput = document.getElementById('pay-day');
const horizonInput = document.getElementById('horizon');
const savingsRateInput = document.getElementById('savings-rate');

function initInputs() {
    payDayInput.value = state.settings.payDay;
    horizonInput.value = state.settings.horizon;
    savingsRateInput.value = state.settings.savingsRate;
}

// Événements Paramètres
payDayInput.addEventListener('change', (e) => { state.settings.payDay = parseInt(e.target.value) || 25; saveState(); });
horizonInput.addEventListener('change', (e) => { state.settings.horizon = parseInt(e.target.value) || 12; saveState(); });
savingsRateInput.addEventListener('change', (e) => { state.settings.savingsRate = parseFloat(e.target.value) || 0; saveState(); });

// Formulaires d'ajout
document.getElementById('form-checking').addEventListener('submit', (e) => {
    e.preventDefault();
    state.checkingAccounts.push({
        id: Date.now(),
        label: document.getElementById('checking-label').value,
        amount: parseFloat(document.getElementById('checking-amount').value)
    });
    e.target.reset();
    saveState();
});

document.getElementById('form-income').addEventListener('submit', (e) => {
    e.preventDefault();
    state.incomes.push({
        id: Date.now(),
        label: document.getElementById('income-label').value,
        amount: parseFloat(document.getElementById('income-amount').value)
    });
    e.target.reset();
    saveState();
});

document.getElementById('form-expense').addEventListener('submit', (e) => {
    e.preventDefault();
    state.expenses.push({
        id: Date.now(),
        label: document.getElementById('expense-label').value,
        amount: parseFloat(document.getElementById('expense-amount').value)
    });
    e.target.reset();
    saveState();
});

document.getElementById('form-savings').addEventListener('submit', (e) => {
    e.preventDefault();
    state.savingsAccounts.push({
        id: Date.now(),
        label: document.getElementById('savings-label').value,
        current: parseFloat(document.getElementById('savings-current').value),
        target: parseFloat(document.getElementById('savings-target').value)
    });
    e.target.reset();
    saveState();
});

document.getElementById('form-project').addEventListener('submit', (e) => {
    e.preventDefault();
    state.projects.push({
        id: Date.now(),
        label: document.getElementById('project-label').value,
        amount: parseFloat(document.getElementById('project-amount').value),
        date: document.getElementById('project-date').value,
        source: document.getElementById('project-source').value
    });
    e.target.reset();
    saveState();
});

// Supprimer & Éditer
function removeItem(arrayName, id) {
    state[arrayName] = state[arrayName].filter(item => item.id !== id);
    saveState();
}

function editItem(arrayName, id) {
    const item = state[arrayName].find(i => i.id === id);
    if (!item) return;

    if (arrayName === 'checkingAccounts' || arrayName === 'incomes' || arrayName === 'expenses') {
        const newLabel = prompt("Modifier le nom :", item.label);
        const newAmount = prompt("Modifier le montant (€) :", item.amount);
        if (newLabel !== null && newAmount !== null) {
            item.label = newLabel || item.label;
            item.amount = parseFloat(newAmount) || item.amount;
        }
    } else if (arrayName === 'savingsAccounts') {
        const newLabel = prompt("Nom du compte :", item.label);
        const newCurrent = prompt("Solde Actuel (€) :", item.current);
        const newTarget = prompt("Objectif (€) :", item.target);
        if (newLabel !== null && newCurrent !== null && newTarget !== null) {
            item.label = newLabel || item.label;
            item.current = parseFloat(newCurrent) || item.current;
            item.target = parseFloat(newTarget) || item.target;
        }
    } else if (arrayName === 'projects') {
        const newLabel = prompt("Nom du projet :", item.label);
        const newAmount = prompt("Montant (€) :", item.amount);
        const newDate = prompt("Date (Format AAAA-MM) :", item.date);
        if (newLabel !== null && newAmount !== null && newDate !== null) {
            item.label = newLabel || item.label;
            item.amount = parseFloat(newAmount) || item.amount;
            item.date = newDate || item.date;
        }
    }
    saveState();
}

// RENDU UI & CALCULS
function render() {
    renderList('list-checkings', state.checkingAccounts, 'checkingAccounts');
    renderList('list-incomes', state.incomes, 'incomes');
    renderList('list-expenses', state.expenses, 'expenses');
    renderList('list-savings', state.savingsAccounts, 'savingsAccounts', item => `${item.label}: ${item.current.toFixed(2)}€ / Obj: ${item.target.toFixed(2)}€`);
    renderList('list-projects', state.projects, 'projects', item => `${item.label} (${item.date}) : ${item.amount.toFixed(2)}€ [${item.source === 'checking' ? 'C. Courant' : 'Épargne'}]`);

    const totalChecking = state.checkingAccounts.reduce((acc, curr) => acc + curr.amount, 0);
    const totalIncome = state.incomes.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = state.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const leftover = totalIncome - totalExpense;
    const monthlySavings = leftover > 0 ? (leftover * state.settings.savingsRate) / 100 : 0;

    document.getElementById('metric-total-checking').innerText = `${totalChecking.toFixed(2)} €`;
    document.getElementById('metric-income').innerText = `${totalIncome.toFixed(2)} €`;
    document.getElementById('metric-expense').innerText = `${totalExpense.toFixed(2)} €`;
    document.getElementById('metric-savings-monthly').innerText = `${monthlySavings.toFixed(2)} €`;

    const totalCurrentSavings = state.savingsAccounts.reduce((acc, curr) => acc + curr.current, 0);
    const totalTargetSavings = state.savingsAccounts.reduce((acc, curr) => acc + curr.target, 0);
    const progressPct = totalTargetSavings > 0 ? Math.min(Math.round((totalCurrentSavings / totalTargetSavings) * 100), 100) : 0;
    
    const progressBar = document.getElementById('savings-progress-bar');
    progressBar.style.width = `${progressPct}%`;
    progressBar.innerText = `${progressPct}%`;
    document.getElementById('progress-text').innerText = `${totalCurrentSavings.toFixed(2)} € / ${totalTargetSavings.toFixed(2)} €`;

    renderProjectionTable(totalChecking, totalIncome, totalExpense, monthlySavings, totalCurrentSavings);
}

function renderList(elementId, items, arrayName, customText = null) {
    const listEl = document.getElementById(elementId);
    listEl.innerHTML = '';
    items.forEach(item => {
        const li = document.createElement('li');
        const text = customText ? customText(item) : `${item.label} : ${item.amount.toFixed(2)} €`;
        li.innerHTML = `
            <span>${text}</span>
            <div class="item-actions">
                <button class="btn-icon edit-btn" onclick="editItem('${arrayName}', ${item.id})" title="Modifier">
                    ${iconEditSVG}
                </button>
                <button class="btn-icon delete-btn" onclick="removeItem('${arrayName}', ${item.id})" title="Supprimer">
                    ${iconDeleteSVG}
                </button>
            </div>
        `;
        listEl.appendChild(li);
    });
}

function renderProjectionTable(totalChecking, income, expense, monthlySavings, initialSavings) {
    const tbody = document.getElementById('projection-tbody');
    tbody.innerHTML = '';

    let currentChecking = totalChecking;
    let currentSavings = initialSavings;
    
    const now = new Date();
    const currentDay = now.getDate();
    
    const currentYear = now.getFullYear();
    const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');
    const currentMonthKey = `${currentYear}-${currentMonthStr}`;
    
    const currentMonthProjects = state.projects.filter(p => p.date === currentMonthKey);
    let currCheckingProjectCosts = 0;
    let currSavingsProjectCosts = 0;
    let currentMonthNotes = [];

    const payDayPassed = currentDay >= state.settings.payDay;

    if (!payDayPassed) {
        currentMonthProjects.forEach(p => {
            currentMonthNotes.push(`${p.label} (-${p.amount}€)`);
            if (p.source === 'checking') currCheckingProjectCosts += p.amount;
            if (p.source === 'savings') currSavingsProjectCosts += p.amount;
        });

        const startChecking = currentChecking;
        const estimatedCheckingBeforePay = currentChecking - expense - currCheckingProjectCosts;
        
        const trCurrent = document.createElement('tr');
        trCurrent.className = 'current-month';
        trCurrent.innerHTML = `
            <td><strong>Mois En Cours (${now.toLocaleDateString('fr-FR', {month: 'long'})})</strong></td>
            <td class="${startChecking < 0 ? 'negative' : ''}">${startChecking.toFixed(2)} €</td>
            <td class="${estimatedCheckingBeforePay < 0 ? 'negative' : 'positive'}">${estimatedCheckingBeforePay.toFixed(2)} €</td>
            <td>${(currentSavings - currSavingsProjectCosts).toFixed(2)} €</td>
            <td><strong>${(estimatedCheckingBeforePay + currentSavings - currSavingsProjectCosts).toFixed(2)} €</strong></td>
            <td><em>En attente de la paie du ${state.settings.payDay}</em> ${currentMonthNotes.join(', ')}</td>
        `;
        tbody.appendChild(trCurrent);

        currentChecking = estimatedCheckingBeforePay;
        currentSavings -= currSavingsProjectCosts;
    }

    let simDate = new Date();

    for (let i = 0; i < state.settings.horizon; i++) {
        simDate.setMonth(simDate.getMonth() + (i === 0 && !payDayPassed ? 0 : 1));
        
        if (i === 0 && !payDayPassed) {
            simDate.setMonth(simDate.getMonth() + 1);
        }

        const year = simDate.getFullYear();
        const monthStr = String(simDate.getMonth() + 1).padStart(2, '0');
        const monthKey = `${year}-${monthStr}`;
        const displayDate = `${state.settings.payDay}/${monthStr}/${year}`;

        const startChecking = currentChecking;
        const monthProjects = state.projects.filter(p => p.date === monthKey);
        
        let projectNotes = [];
        let checkingProjectCosts = 0;
        let savingsProjectCosts = 0;

        monthProjects.forEach(p => {
            projectNotes.push(`${p.label} (-${p.amount}€)`);
            if (p.source === 'checking') checkingProjectCosts += p.amount;
            if (p.source === 'savings') savingsProjectCosts += p.amount;
        });

        currentChecking += (income - expense - monthlySavings - checkingProjectCosts);
        currentSavings += (monthlySavings - savingsProjectCosts);

        const totalNetWorth = currentChecking + currentSavings;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${displayDate}</strong></td>
            <td class="${startChecking < 0 ? 'negative' : ''}">${startChecking.toFixed(2)} €</td>
            <td class="${currentChecking < 0 ? 'negative' : 'positive'}">${currentChecking.toFixed(2)} €</td>
            <td>${currentSavings.toFixed(2)} €</td>
            <td><strong>${totalNetWorth.toFixed(2)} €</strong></td>
            <td>${projectNotes.join(', ') || '-'}</td>
        `;
        tbody.appendChild(tr);
    }
}

// Export / Import / Reset
document.getElementById('export-btn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget_export_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            state = validateAndCleanState(JSON.parse(event.target.result));
            initInputs();
            saveState();
            alert("Données importées avec succès !");
        } catch (err) {
            alert("Fichier JSON invalide.");
        }
    };
    reader.readAsText(file);
    e.target.value = '';
});

document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm("Réinitialiser l'ensemble des données ?")) {
        localStorage.removeItem('budgetData');
        state = validateAndCleanState(defaultState);
        initInputs();
        saveState();
    }
});

// Lancement
initInputs();
render();
