/**
 * HORIZON BUDGET - GESTION & PROJECTION FINANCIÈRE EXACTE
 */

const editSVG = `<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;
const deleteSVG = `<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;

const defaultState = {
    settings: {
        payDay: 25,
        payReceivedThisMonth: false,
        horizon: 12,
        savingsRate: 50
    },
    checkingAccounts: [
        { id: 1, label: "BoursoBank Principal", amount: 1250.00 }
    ],
    incomes: [
        { id: 1, label: "Salaire Mensuel", amount: 2400.00 }
    ],
    expenses: [
        { id: 1, label: "Loyer & Charges", amount: 800.00, category: "Logement" },
        { id: 2, label: "Abonnements / Internet", amount: 50.00, category: "Abonnements" }
    ],
    savingsAccounts: [
        { id: 1, label: "Livret A", current: 5000.00, target: 12000.00, interestRate: 3.0 }
    ],
    projects: [],
    oneTimeTransfers: {}
};

let state = loadInitialState();
let currentEditTarget = null; // { arrayName, id }
let currentTransferMonthKey = null;

function loadInitialState() {
    const saved = localStorage.getItem('budgetData_v3');
    if (!saved) return defaultState;
    try {
        return JSON.parse(saved);
    } catch (e) {
        return defaultState;
    }
}

function saveState() {
    localStorage.setItem('budgetData_v3', JSON.stringify(state));
    render();
}

// MANAGEMENT ONGLETS
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(targetTab).classList.add('active');
    });
});

// PARAMÈTRES
const payDayInput = document.getElementById('pay-day');
const payReceivedSelect = document.getElementById('pay-received');
const horizonInput = document.getElementById('horizon');
const savingsRateInput = document.getElementById('savings-rate');

function syncInputs() {
    payDayInput.value = state.settings.payDay;
    payReceivedSelect.value = state.settings.payReceivedThisMonth ? "true" : "false";
    horizonInput.value = state.settings.horizon;
    savingsRateInput.value = state.settings.savingsRate;
}

payDayInput.addEventListener('change', e => { state.settings.payDay = parseInt(e.target.value) || 25; saveState(); });
payReceivedSelect.addEventListener('change', e => { state.settings.payReceivedThisMonth = (e.target.value === "true"); saveState(); });
horizonInput.addEventListener('change', e => { state.settings.horizon = parseInt(e.target.value) || 12; saveState(); });
savingsRateInput.addEventListener('change', e => { state.settings.savingsRate = parseFloat(e.target.value) || 0; saveState(); });

// FORMULAIRES DE CRÉATION
document.getElementById('form-checking').addEventListener('submit', e => {
    e.preventDefault();
    state.checkingAccounts.push({
        id: Date.now(),
        label: document.getElementById('checking-label').value,
        amount: parseFloat(document.getElementById('checking-amount').value)
    });
    e.target.reset();
    saveState();
});

document.getElementById('form-income').addEventListener('submit', e => {
    e.preventDefault();
    state.incomes.push({
        id: Date.now(),
        label: document.getElementById('income-label').value,
        amount: parseFloat(document.getElementById('income-amount').value)
    });
    e.target.reset();
    saveState();
});

document.getElementById('form-expense').addEventListener('submit', e => {
    e.preventDefault();
    state.expenses.push({
        id: Date.now(),
        label: document.getElementById('expense-label').value,
        amount: parseFloat(document.getElementById('expense-amount').value),
        category: document.getElementById('expense-category').value
    });
    e.target.reset();
    saveState();
});

document.getElementById('form-savings').addEventListener('submit', e => {
    e.preventDefault();
    state.savingsAccounts.push({
        id: Date.now(),
        label: document.getElementById('savings-label').value,
        current: parseFloat(document.getElementById('savings-current').value),
        target: parseFloat(document.getElementById('savings-target').value),
        interestRate: parseFloat(document.getElementById('savings-rate-interest').value) || 0
    });
    e.target.reset();
    saveState();
});

document.getElementById('form-project-page').addEventListener('submit', e => {
    e.preventDefault();
    state.projects.push({
        id: Date.now(),
        label: document.getElementById('project-label-p').value,
        amount: parseFloat(document.getElementById('project-amount-p').value),
        date: document.getElementById('project-date-p').value,
        source: document.getElementById('project-source-p').value
    });
    e.target.reset();
    saveState();
});

// ACTION SUPPRESSION
function removeItem(arrayName, id) {
    state[arrayName] = state[arrayName].filter(item => item.id !== id);
    saveState();
}

// MODALE D'ÉDITION ÉLÉMENTS
const modalOverlay = document.getElementById('edit-modal');
const modalBody = document.getElementById('modal-body');

function openEditModal(arrayName, id) {
    const item = state[arrayName].find(i => i.id === id);
    if (!item) return;

    currentEditTarget = { arrayName, id };
    modalBody.innerHTML = '';

    if (arrayName === 'checkingAccounts' || arrayName === 'incomes') {
        modalBody.innerHTML = `
            <div class="form-group">
                <label>Nom / Libellé :</label>
                <input type="text" id="modal-field-1" value="${item.label}">
            </div>
            <div class="form-group">
                <label>Montant (€) :</label>
                <input type="number" step="0.01" id="modal-field-2" value="${item.amount}">
            </div>
        `;
    } else if (arrayName === 'expenses') {
        modalBody.innerHTML = `
            <div class="form-group">
                <label>Intitulé :</label>
                <input type="text" id="modal-field-1" value="${item.label}">
            </div>
            <div class="form-group">
                <label>Montant (€) :</label>
                <input type="number" step="0.01" id="modal-field-2" value="${item.amount}">
            </div>
        `;
    } else if (arrayName === 'savingsAccounts') {
        modalBody.innerHTML = `
            <div class="form-group">
                <label>Support d'épargne :</label>
                <input type="text" id="modal-field-1" value="${item.label}">
            </div>
            <div class="form-group">
                <label>Solde actuel (€) :</label>
                <input type="number" step="0.01" id="modal-field-2" value="${item.current}">
            </div>
            <div class="form-group">
                <label>Objectif visé (€) :</label>
                <input type="number" step="0.01" id="modal-field-3" value="${item.target}">
            </div>
            <div class="form-group">
                <label>Taux d'intérêt (%) :</label>
                <input type="number" step="0.1" id="modal-field-4" value="${item.interestRate !== undefined ? item.interestRate : 0}">
            </div>
        `;
    }

    modalOverlay.classList.add('active');
}

function closeModal() {
    modalOverlay.classList.remove('active');
    currentEditTarget = null;
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);

document.getElementById('modal-save-btn').addEventListener('click', () => {
    if (!currentEditTarget) return;

    const { arrayName, id } = currentEditTarget;
    const item = state[arrayName].find(i => i.id === id);

    if (arrayName === 'checkingAccounts' || arrayName === 'incomes' || arrayName === 'expenses') {
        item.label = document.getElementById('modal-field-1').value;
        item.amount = parseFloat(document.getElementById('modal-field-2').value) || item.amount;
    } else if (arrayName === 'savingsAccounts') {
        item.label = document.getElementById('modal-field-1').value;
        item.current = parseFloat(document.getElementById('modal-field-2').value) || item.current;
        item.target = parseFloat(document.getElementById('modal-field-3').value) || item.target;
        item.interestRate = parseFloat(document.getElementById('modal-field-4').value) || 0;
    }

    closeModal();
    saveState();
});

// MODALE DE VIREMENT EXCEPTIONNEL
const transferModal = document.getElementById('transfer-modal');
const transferDesc = document.getElementById('transfer-modal-desc');
const transferInput = document.getElementById('transfer-amount-input');

function addOneTimeTransfer(monthKey) {
    currentTransferMonthKey = monthKey;
    const currentVal = state.oneTimeTransfers[monthKey] || 0;
    
    transferDesc.innerText = `Virement exceptionnel compte courant vers épargne pour le mois ${monthKey} (€) :`;
    transferInput.value = currentVal > 0 ? currentVal : '';
    
    transferModal.classList.add('active');
    setTimeout(() => transferInput.focus(), 100);
}

function closeTransferModal() {
    transferModal.classList.remove('active');
    currentTransferMonthKey = null;
}

document.getElementById('transfer-modal-close').addEventListener('click', closeTransferModal);
document.getElementById('transfer-cancel-btn').addEventListener('click', closeTransferModal);

document.getElementById('transfer-save-btn').addEventListener('click', () => {
    if (!currentTransferMonthKey) return;

    const val = parseFloat(transferInput.value);
    if (!isNaN(val) && val > 0) {
        state.oneTimeTransfers[currentTransferMonthKey] = val;
    } else {
        delete state.oneTimeTransfers[currentTransferMonthKey];
    }

    closeTransferModal();
    saveState();
});

// RENDU DE L'APPLICATION
function render() {
    renderList('list-checkings', state.checkingAccounts, 'checkingAccounts');
    renderList('list-incomes', state.incomes, 'incomes');
    renderList('list-expenses', state.expenses, 'expenses', item => `${item.label} [${item.category}] : -${item.amount.toFixed(2)} €`);
    renderList('list-savings', state.savingsAccounts, 'savingsAccounts', item => {
        const rateInfo = item.interestRate !== undefined ? ` (${item.interestRate}%)` : '';
        return `${item.label}${rateInfo} : ${item.current.toFixed(2)} € / ${item.target.toFixed(2)} €`;
    });

    const totalChecking = state.checkingAccounts.reduce((sum, item) => sum + item.amount, 0);
    const totalIncome = state.incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = state.expenses.reduce((sum, item) => sum + item.amount, 0);

    const leftover = totalIncome - totalExpense;
    const monthlySavings = leftover > 0 ? (leftover * state.settings.savingsRate) / 100 : 0;

    document.getElementById('metric-total-checking').innerText = `${totalChecking.toFixed(2)} €`;
    document.getElementById('metric-income').innerText = `+${totalIncome.toFixed(2)} €`;
    document.getElementById('metric-expense').innerText = `-${totalExpense.toFixed(2)} €`;
    
    const leftoverEl = document.getElementById('metric-leftover');
    leftoverEl.innerText = `${leftover.toFixed(2)} €`;
    leftoverEl.className = `metric-value ${leftover >= 0 ? 'text-success' : 'text-danger'}`;

    document.getElementById('metric-savings-monthly').innerText = `+${monthlySavings.toFixed(2)} €`;

    // BARRE DE PROGRESSION ÉPARGNE
    const totalCurrentSavings = state.savingsAccounts.reduce((sum, item) => sum + item.current, 0);
    const totalTargetSavings = state.savingsAccounts.reduce((sum, item) => sum + item.target, 0);
    const progressPct = totalTargetSavings > 0 ? Math.min(Math.round((totalCurrentSavings / totalTargetSavings) * 100), 100) : 0;

    const progressBar = document.getElementById('savings-progress-bar');
    progressBar.style.width = `${progressPct}%`;
    progressBar.innerText = `${progressPct}%`;
    document.getElementById('progress-text').innerText = `${totalCurrentSavings.toFixed(2)} € / ${totalTargetSavings.toFixed(2)} €`;

    renderProjectionTable(totalChecking, totalIncome, totalExpense, monthlySavings, totalCurrentSavings);
    renderProjectsPage();
}

function renderList(elementId, items, arrayName, customFormatter = null) {
    const listEl = document.getElementById(elementId);
    listEl.innerHTML = '';
    items.forEach(item => {
        const li = document.createElement('li');
        const text = customFormatter ? customFormatter(item) : `${item.label} : ${item.amount.toFixed(2)} €`;
        li.innerHTML = `
            <span>${text}</span>
            <div class="item-actions">
                <button class="icon-btn edit-btn" onclick="openEditModal('${arrayName}', ${item.id})" title="Modifier">
                    ${editSVG}
                </button>
                <button class="icon-btn delete-btn" onclick="removeItem('${arrayName}', ${item.id})" title="Supprimer">
                    ${deleteSVG}
                </button>
            </div>
        `;
        listEl.appendChild(li);
    });
}

function renderProjectsPage() {
    const container = document.getElementById('projects-container');
    container.innerHTML = '';

    if (state.projects.length === 0) {
        container.innerHTML = '<p class="section-desc">Aucun projet planifié pour le moment.</p>';
        return;
    }

    state.projects.forEach(p => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <div>
                <div class="project-header">
                    <span class="project-title">${p.label}</span>
                    <span class="project-badge">${p.date}</span>
                </div>
                <p class="section-desc">Coût : <strong>${p.amount.toFixed(2)} €</strong></p>
                <p class="section-desc">Financement : <strong>${p.source === 'checking' ? 'Compte Courant' : 'Épargne'}</strong></p>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 0.4rem; margin-top: 1rem;">
                <button class="icon-btn delete-btn" onclick="removeItem('projects', ${p.id})" title="Supprimer">${deleteSVG}</button>
            </div>
        `;
        container.appendChild(card);
    });
}

/**
 * CALCUL ET AFFICHAGE DE LA PROJECTION
 */
function renderProjectionTable(totalChecking, monthlyIncome, monthlyExpense, monthlySavings, initialSavings) {
    const tbody = document.getElementById('projection-tbody');
    tbody.innerHTML = '';

    let currentCheckingBalance = totalChecking;
    let currentSavingsBalance = initialSavings;

    let dateCursor = new Date();

    for (let i = 0; i < state.settings.horizon; i++) {
        const year = dateCursor.getFullYear();
        const monthStr = String(dateCursor.getMonth() + 1).padStart(2, '0');
        const monthKey = `${year}-${monthStr}`;

        const isCurrentMonth = (i === 0);
        let incomeAppliedThisMonth = 0;

        if (isCurrentMonth) {
            incomeAppliedThisMonth = state.settings.payReceivedThisMonth ? 0 : monthlyIncome;
        } else {
            incomeAppliedThisMonth = monthlyIncome;
        }

        const startChecking = currentCheckingBalance;

        const monthProjects = state.projects.filter(p => p.date === monthKey);
        let projectNotes = [];
        let checkingProjectCost = 0;
        let savingsProjectCost = 0;

        monthProjects.forEach(p => {
            projectNotes.push(`${p.label} (-${p.amount}€)`);
            if (p.source === 'checking') checkingProjectCost += p.amount;
            if (p.source === 'savings') savingsProjectCost += p.amount;
        });

        const oneTimeTransfer = state.oneTimeTransfers[monthKey] || 0;
        if (oneTimeTransfer > 0) projectNotes.push(`Épargne ponctuelle (+${oneTimeTransfer}€)`);

        const endChecking = startChecking + incomeAppliedThisMonth - monthlyExpense - monthlySavings - checkingProjectCost - oneTimeTransfer;
        currentSavingsBalance = currentSavingsBalance + monthlySavings + oneTimeTransfer - savingsProjectCost;

        const tr = document.createElement('tr');
        if (isCurrentMonth) tr.className = 'current-month';

        const btnClass = oneTimeTransfer > 0 ? 'btn-table-action has-value' : 'btn-table-action';
        const btnLabel = oneTimeTransfer > 0 ? `Modif (${oneTimeTransfer} €)` : '+ Épargner';

        tr.innerHTML = `
            <td><strong>${isCurrentMonth ? 'Mois en cours' : `${state.settings.payDay}/${monthStr}/${year}`}</strong></td>
            <td>${startChecking.toFixed(2)} €</td>
            <td class="text-success">${incomeAppliedThisMonth > 0 ? '+' + incomeAppliedThisMonth.toFixed(2) + ' €' : 'Inclus (0.00 €)'}</td>
            <td class="text-danger">-${monthlyExpense.toFixed(2)} €</td>
            <td class="text-primary">-${monthlySavings.toFixed(2)} €</td>
            <td>${projectNotes.join(', ') || '-'}</td>
            <td style="font-weight:700" class="${endChecking < 0 ? 'text-danger' : ''}">${endChecking.toFixed(2)} €</td>
            <td><strong>${currentSavingsBalance.toFixed(2)} €</strong></td>
            <td>
                <button class="${btnClass}" onclick="addOneTimeTransfer('${monthKey}')">
                    ${btnLabel}
                </button>
            </td>
        `;

        tbody.appendChild(tr);

        currentCheckingBalance = endChecking;
        dateCursor.setMonth(dateCursor.getMonth() + 1);
    }
}

// INITIALISATION DE L'APPLICATION
syncInputs();
render();


// ==========================================================================
// FONCTIONS DE GESTION DES DONNÉES : EXPORT / IMPORT / RÉINITIALISATION
// (Placées en toute fin de script)
// ==========================================================================

// Exporter les données vers un fichier JSON
document.getElementById('export-btn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `horizon_budget_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

// Importer un fichier JSON
document.getElementById('import-file').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
        try {
            state = JSON.parse(event.target.result);
            syncInputs();
            saveState();
        } catch (err) {
            alert("Fichier JSON invalide.");
        }
    };
    reader.readAsText(file);
});

// Réinitialiser toutes les données
document.getElementById('reset-btn').addEventListener('click', () => {
    if (confirm("Voulez-vous vraiment réinitialiser toutes les données ?")) {
        localStorage.removeItem('budgetData_v3');
        state = defaultState;
        syncInputs();
        saveState();
    }
});
