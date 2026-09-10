// Structure Globale
const defaultState = {
    settings: {
        payDay: 25,
        horizon: 12,
        savingsRate: 50
    },
    initialChecking: 1000,
    incomes: [],
    expenses: [],
    savingsAccounts: [],
    projects: []
};

// Validation & Normalisation de la structure (Import / Export)
function validateAndCleanState(data) {
    if (!data || typeof data !== 'object') return defaultState;
    return {
        settings: {
            payDay: parseInt(data.settings?.payDay) || defaultState.settings.payDay,
            horizon: parseInt(data.settings?.horizon) || defaultState.settings.horizon,
            savingsRate: parseFloat(data.settings?.savingsRate) ?? defaultState.settings.savingsRate
        },
        initialChecking: parseFloat(data.initialChecking) || 0,
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

// Références DOM
const payDayInput = document.getElementById('pay-day');
const horizonInput = document.getElementById('horizon');
const savingsRateInput = document.getElementById('savings-rate');
const initialCheckingInput = document.getElementById('initial-checking');

function initInputs() {
    payDayInput.value = state.settings.payDay;
    horizonInput.value = state.settings.horizon;
    savingsRateInput.value = state.settings.savingsRate;
    initialCheckingInput.value = state.initialChecking;
}

// Événements Paramètres
payDayInput.addEventListener('change', (e) => { state.settings.payDay = parseInt(e.target.value) || 25; saveState(); });
horizonInput.addEventListener('change', (e) => { state.settings.horizon = parseInt(e.target.value) || 12; saveState(); });
savingsRateInput.addEventListener('change', (e) => { state.settings.savingsRate = parseFloat(e.target.value) || 0; saveState(); });
initialCheckingInput.addEventListener('change', (e) => { state.initialChecking = parseFloat(e.target.value) || 0; saveState(); });

// Formulaires d'ajout
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

    if (arrayName === 'incomes' || arrayName === 'expenses') {
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
    renderList('list-incomes', state.incomes, 'incomes');
    renderList('list-expenses', state.expenses, 'expenses');
    renderList('list-savings', state.savingsAccounts, 'savingsAccounts', item => `${item.label}: ${item.current.toFixed(2)}€ / Obj: ${item.target.toFixed(2)}€`);
    renderList('list-projects', state.projects, 'projects', item => `${item.label} (${item.date}) : ${item.amount.toFixed(2)}€ [${item.source === 'checking' ? 'C. Courant' : 'Épargne'}]`);

    const totalIncome = state.incomes.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = state.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const leftover = totalIncome - totalExpense;
    const monthlySavings = leftover > 0 ? (leftover * state.settings.savingsRate) / 100 : 0;

    document.getElementById('metric-income').innerText = `${totalIncome.toFixed(2)} €`;
    document.getElementById('metric-expense').innerText = `${totalExpense.toFixed(2)} €`;
    document.getElementById('metric-leftover').innerText = `${leftover.toFixed(2)} €`;
    document.getElementById('metric-savings-monthly').innerText = `${monthlySavings.toFixed(2)} €`;

    const totalCurrentSavings = state.savingsAccounts.reduce((acc, curr) => acc + curr.current, 0);
    const totalTargetSavings = state.savingsAccounts.reduce((acc, curr) => acc + curr.target, 0);
    const progressPct = totalTargetSavings > 0 ? Math.min(Math.round((totalCurrentSavings / totalTargetSavings) * 100), 100) : 0;
    
    const progressBar = document.getElementById('savings-progress-bar');
    progressBar.style.width = `${progressPct}%`;
    progressBar.innerText = `${progressPct}%`;
    document.getElementById('progress-text').innerText = `${totalCurrentSavings.toFixed(2)} € / ${totalTargetSavings.toFixed(2)} €`;

    renderProjectionTable(totalIncome, totalExpense, monthlySavings, totalCurrentSavings);
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
                <button class="btn-icon" onclick="editItem('${arrayName}', ${item.id})">✏️</button>
                <button class="btn-icon" onclick="removeItem('${arrayName}', ${item.id})">❌</button>
            </div>
        `;
        listEl.appendChild(li);
    });
}

function renderProjectionTable(income, expense, monthlySavings, initialSavings) {
    const tbody = document.getElementById('projection-tbody');
    tbody.innerHTML = '';

    let currentChecking = state.initialChecking;
    let currentSavings = initialSavings;
    
    const now = new Date();
    const currentDay = now.getDate();
    
    // 1. GESTION DU MOIS EN COURS (Avant la prochaine paie)
    const currentYear = now.getFullYear();
    const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');
    const currentMonthKey = `${currentYear}-${currentMonthStr}`;
    
    const currentMonthProjects = state.projects.filter(p => p.date === currentMonthKey);
    let currCheckingProjectCosts = 0;
    let currSavingsProjectCosts = 0;
    let currentMonthNotes = [];

    // Déterminer si le jour de paie est déjà passé ce mois-ci
    const payDayPassed = currentDay >= state.settings.payDay;

    if (!payDayPassed) {
        currentMonthProjects.forEach(p => {
            currentMonthNotes.push(`${p.label} (-${p.amount}€)`);
            if (p.source === 'checking') currCheckingProjectCosts += p.amount;
            if (p.source === 'savings') currSavingsProjectCosts += p.amount;
        });

        const startChecking = currentChecking;
        // Solde estimé juste avant d'encaisser la paie du mois
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

        // Mise à jour des soldes de départ pour les projections suivantes
        currentChecking = estimatedCheckingBeforePay;
        currentSavings -= currSavingsProjectCosts;
    }

    // 2. SIMULATION SUR L'HORIZON DE PROJECTION
    let simDate = new Date();

    for (let i = 0; i < state.settings.horizon; i++) {
        simDate.setMonth(simDate.getMonth() + (i === 0 && !payDayPassed ? 0 : 1));
        
        // Sauter le recalcul du mois en cours si la ligne dédiée a déjà été générée
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

        // Application de la paie et régulation des comptes
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

// Lancement au chargement
initInputs();
render();
