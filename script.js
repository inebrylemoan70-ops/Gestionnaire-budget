let state = {
    payDay: 25,
    checkings: [{ id: 1, name: 'Compte Principal', balance: 1000 }],
    monthsToProject: 12,
    savingsRate: 50,
    incomes: [],
    expenses: [],
    savings: [],
    projects: []
};

let editingIds = { checking: null, income: null, expense: null, savings: null, project: null };

const payDayInput = document.getElementById('payDay');
const monthsInput = document.getElementById('monthsToProject');
const savingsRateInput = document.getElementById('savingsRate');

const checkingName = document.getElementById('checkingName');
const checkingBalance = document.getElementById('checkingBalance');
const incomeName = document.getElementById('incomeName');
const incomeAmount = document.getElementById('incomeAmount');
const expenseName = document.getElementById('expenseName');
const expenseAmount = document.getElementById('expenseAmount');
const savingsName = document.getElementById('savingsName');
const savingsBalance = document.getElementById('savingsBalance');
const savingsTarget = document.getElementById('savingsTarget');
const projectName = document.getElementById('projectName');
const projectAmount = document.getElementById('projectAmount');
const projectMonthSelect = document.getElementById('projectMonthSelect');
const projectSourceSelect = document.getElementById('projectSourceSelect');

function loadData() {
    const savedData = localStorage.getItem('budgetApp_v5_data');
    if (savedData) {
        try {
            state = JSON.parse(savedData);
            if (!state.checkings) state.checkings = [{ id: Date.now(), name: 'Compte Courant', balance: 1000 }];
            payDayInput.value = state.payDay ?? 25;
            monthsInput.value = state.monthsToProject ?? 12;
            savingsRateInput.value = state.savingsRate ?? 50;
        } catch (e) {
            console.error("Erreur de chargement", e);
        }
    }
    updateMonthSelectOptions();
    render();
}

function saveData() {
    state.payDay = parseInt(payDayInput.value) || 25;
    state.monthsToProject = parseInt(monthsInput.value) || 1;
    state.savingsRate = Math.min(100, Math.max(0, parseFloat(savingsRateInput.value) || 0));
    localStorage.setItem('budgetApp_v5_data', JSON.stringify(state));
    updateMonthSelectOptions();
    render();
}

function updateMonthSelectOptions() {
    const today = new Date();
    projectMonthSelect.innerHTML = '';
    
    // Générer la liste à partir du mois EN COURS (index 0)
    for (let i = 0; i <= state.monthsToProject; i++) {
        const futureDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const monthLabel = futureDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        const monthValue = `${futureDate.getFullYear()}-${futureDate.getMonth() + 1}`;
        const option = document.createElement('option');
        option.value = monthValue;
        option.textContent = (i === 0 ? "Mois en cours - " : "") + monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
        projectMonthSelect.appendChild(option);
    }
}

function handleSaveItem(type, fields, btnId, cancelBtnId) {
    const name = fields.nameInput.value.trim();
    if (!name) { alert("Veuillez saisir un libellé."); return; }

    const isDuplicate = state[type].find(item => item.name.toLowerCase() === name.toLowerCase() && item.id !== editingIds[type]);
    if (isDuplicate) { alert(`Le nom "${name}" existe déjà.`); return; }

    const itemData = { id: editingIds[type] || Date.now(), name };
    if (fields.amountInput) itemData.amount = parseFloat(fields.amountInput.value) || 0;
    if (fields.balanceInput) itemData.balance = parseFloat(fields.balanceInput.value) || 0;
    if (fields.targetInput) itemData.target = parseFloat(fields.targetInput.value) || 0;
    if (fields.monthSelect) itemData.month = fields.monthSelect.value;
    if (fields.sourceSelect) itemData.source = fields.sourceSelect.value;

    if (editingIds[type]) {
        const idx = state[type].findIndex(i => i.id === editingIds[type]);
        state[type][idx] = itemData;
    } else {
        state[type].push(itemData);
    }

    resetForm(type, fields, btnId, cancelBtnId);
    saveData();
}

function startEdit(type, id, fields, btnId, cancelBtnId) {
    const item = state[type].find(i => i.id === id);
    if (!item) return;
    editingIds[type] = id;

    fields.nameInput.value = item.name;
    if (fields.amountInput) fields.amountInput.value = item.amount;
    if (fields.balanceInput) fields.balanceInput.value = item.balance;
    if (fields.targetInput) fields.targetInput.value = item.target;
    if (fields.monthSelect) fields.monthSelect.value = item.month;
    if (fields.sourceSelect) fields.sourceSelect.value = item.source;

    document.getElementById(btnId).textContent = "Mettre à jour";
    document.getElementById(cancelBtnId).style.display = "inline-block";
}

function resetForm(type, fields, btnId, cancelBtnId, defaultBtnText = "Ajouter") {
    editingIds[type] = null;
    fields.nameInput.value = '';
    if (fields.amountInput) fields.amountInput.value = '';
    if (fields.balanceInput) fields.balanceInput.value = '';
    if (fields.targetInput) fields.targetInput.value = '';
    document.getElementById(btnId).textContent = defaultBtnText;
    document.getElementById(cancelBtnId).style.display = "none";
}

document.getElementById('addCheckingBtn').onclick = () => handleSaveItem('checkings', { nameInput: checkingName, balanceInput: checkingBalance }, 'addCheckingBtn', 'cancelEditCheckingBtn');
document.getElementById('cancelEditCheckingBtn').onclick = () => resetForm('checkings', { nameInput: checkingName, balanceInput: checkingBalance }, 'addCheckingBtn', 'cancelEditCheckingBtn', 'Ajouter / Mettre à jour');

document.getElementById('addIncomeBtn').onclick = () => handleSaveItem('incomes', { nameInput: incomeName, amountInput: incomeAmount }, 'addIncomeBtn', 'cancelEditIncomeBtn');
document.getElementById('cancelEditIncomeBtn').onclick = () => resetForm('incomes', { nameInput: incomeName, amountInput: incomeAmount }, 'addIncomeBtn', 'cancelEditIncomeBtn');

document.getElementById('addExpenseBtn').onclick = () => handleSaveItem('expenses', { nameInput: expenseName, amountInput: expenseAmount }, 'addExpenseBtn', 'cancelEditExpenseBtn');
document.getElementById('cancelEditExpenseBtn').onclick = () => resetForm('expenses', { nameInput: expenseName, amountInput: expenseAmount }, 'addExpenseBtn', 'cancelEditExpenseBtn');

document.getElementById('addSavingsBtn').onclick = () => handleSaveItem('savings', { nameInput: savingsName, balanceInput: savingsBalance, targetInput: savingsTarget }, 'addSavingsBtn', 'cancelEditSavingsBtn');
document.getElementById('cancelEditSavingsBtn').onclick = () => resetForm('savings', { nameInput: savingsName, balanceInput: savingsBalance, targetInput: savingsTarget }, 'addSavingsBtn', 'cancelEditSavingsBtn', 'Ajouter le compte');

document.getElementById('addProjectBtn').onclick = () => handleSaveItem('projects', { nameInput: projectName, amountInput: projectAmount, monthSelect: projectMonthSelect, sourceSelect: projectSourceSelect }, 'addProjectBtn', 'cancelEditProjectBtn');
document.getElementById('cancelEditProjectBtn').onclick = () => resetForm('projects', { nameInput: projectName, amountInput: projectAmount, monthSelect: projectMonthSelect, sourceSelect: projectSourceSelect }, 'addProjectBtn', 'cancelEditProjectBtn', 'Planifier l\'achat');

function removeItem(type, id) {
    state[type] = state[type].filter(item => item.id !== id);
    saveData();
}

payDayInput.addEventListener('input', saveData);
monthsInput.addEventListener('input', saveData);
savingsRateInput.addEventListener('input', saveData);

function formatCurrency(v) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v);
}

// Export / Import
document.getElementById('exportBtn').onclick = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `budget_sauvegarde_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
};

document.getElementById('importBtn').onclick = () => document.getElementById('importFile').click();
document.getElementById('importFile').onchange = (e) => {
    const fileReader = new FileReader();
    fileReader.onload = (event) => {
        try {
            state = JSON.parse(event.target.result);
            saveData();
            alert("Données importées avec succès !");
        } catch (err) {
            alert("Fichier JSON invalide.");
        }
    };
    if (e.target.files[0]) fileReader.readAsText(e.target.files[0]);
};

function render() {
    const totalCheckingCurrent = state.checkings.reduce((sum, item) => sum + item.balance, 0);
    const totalIncome = state.incomes.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = state.expenses.reduce((sum, item) => sum + item.amount, 0);
    const monthlyNet = totalIncome - totalExpense;
    const monthlySavingsAmount = monthlyNet > 0 ? (monthlyNet * (state.savingsRate / 100)) : 0;
    const currentCheckingNet = monthlyNet - monthlySavingsAmount;

    const totalSavingsCurrent = state.savings.reduce((sum, item) => sum + (item.balance || 0), 0);
    const totalSavingsTarget = state.savings.reduce((sum, item) => sum + (item.target || 0), 0);

    document.getElementById('totalCheckingCurrent').textContent = formatCurrency(totalCheckingCurrent);
    const netEl = document.getElementById('monthlyNet');
    netEl.textContent = formatCurrency(monthlyNet);
    netEl.className = `metric-value ${monthlyNet >= 0 ? 'positive' : 'negative'}`;

    document.getElementById('monthlySavings').textContent = formatCurrency(monthlySavingsAmount);
    document.getElementById('totalSavingsCurrent').textContent = formatCurrency(totalSavingsCurrent);
    document.getElementById('totalSavingsTarget').textContent = formatCurrency(totalSavingsTarget);

    const globalProgress = totalSavingsTarget > 0 ? Math.min(100, (totalSavingsCurrent / totalSavingsTarget) * 100) : 0;
    document.getElementById('globalProgressPercent').textContent = `${globalProgress.toFixed(1)}%`;
    document.getElementById('globalProgressBar').style.width = `${globalProgress}%`;

    renderGenericList('checkingList', 'checkings', item => `Solde: ${formatCurrency(item.balance)}`, (id) => startEdit('checkings', id, { nameInput: checkingName, balanceInput: checkingBalance }, 'addCheckingBtn', 'cancelEditCheckingBtn'));
    renderGenericList('incomeList', 'incomes', item => `+${formatCurrency(item.amount)}`, (id) => startEdit('incomes', id, { nameInput: incomeName, amountInput: incomeAmount }, 'addIncomeBtn', 'cancelEditIncomeBtn'));
    renderGenericList('expenseList', 'expenses', item => `-${formatCurrency(item.amount)}`, (id) => startEdit('expenses', id, { nameInput: expenseName, amountInput: expenseAmount }, 'addExpenseBtn', 'cancelEditExpenseBtn'));
    renderSavingsList();
    renderProjectList();

    renderProjection(totalCheckingCurrent, currentCheckingNet, monthlySavingsAmount, totalSavingsCurrent);
}

function renderGenericList(elementId, type, valueFormatter, editFn) {
    const container = document.getElementById(elementId);
    container.innerHTML = state[type].map(item => `
        <li>
            <span><strong>${item.name}</strong> (${valueFormatter(item)})</span>
            <div class="action-btns">
                <button class="edit-btn" onclick="(${editFn})(${item.id})">Modifier</button>
                <button class="delete-btn" onclick="removeItem('${type}', ${item.id})">Supprimer</button>
            </div>
        </li>
    `).join('');
}

function renderSavingsList() {
    const container = document.getElementById('savingsList');
    container.innerHTML = state.savings.map(item => {
        const progress = item.target > 0 ? Math.min(100, (item.balance / item.target) * 100).toFixed(1) : null;
        return `
            <li>
                <div class="item-info">
                    <strong>${item.name}</strong>
                    <span class="item-subtext">Solde: ${formatCurrency(item.balance)} ${item.target > 0 ? `/ Objectif: ${formatCurrency(item.target)} (${progress}%)` : ''}</span>
                </div>
                <div class="action-btns">
                    <button class="edit-btn" onclick="startEdit('savings', ${item.id}, { nameInput: savingsName, balanceInput: savingsBalance, targetInput: savingsTarget }, 'addSavingsBtn', 'cancelEditSavingsBtn')">Modifier</button>
                    <button class="delete-btn" onclick="removeItem('savings', ${item.id})">Supprimer</button>
                </div>
            </li>
        `;
    }).join('');
}

function renderProjectList() {
    const container = document.getElementById('projectList');
    container.innerHTML = state.projects.map(item => {
        const [year, month] = item.month.split('-');
        const dateObj = new Date(year, month - 1, 1);
        const monthLabel = dateObj.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        const sourceLabel = item.source === 'checking' ? 'Compte courant' : 'Épargne';

        return `
            <li>
                <div class="item-info">
                    <strong>${item.name}</strong>
                    <span class="item-subtext">Prévu en ${monthLabel} via <span class="badge-source">${sourceLabel}</span></span>
                </div>
                <div class="action-btns">
                    <strong class="negative">-${formatCurrency(item.amount)}</strong>
                    <button class="edit-btn" onclick="startEdit('projects', ${item.id}, { nameInput: projectName, amountInput: projectAmount, monthSelect: projectMonthSelect, sourceSelect: projectSourceSelect }, 'addProjectBtn', 'cancelEditProjectBtn')">Modifier</button>
                    <button class="delete-btn" onclick="removeItem('projects', ${item.id})">Supprimer</button>
                </div>
            </li>
        `;
    }).join('');
}

function renderProjection(totalCheckingCurrent, currentCheckingNet, monthlySavingsAmount, initialSavingsTotal) {
    const projectionBody = document.getElementById('projectionBody');
    projectionBody.innerHTML = '';

    let currentBalance = totalCheckingCurrent;
    let accumulatedSavings = initialSavingsTotal;
    const today = new Date();

    // Boucle à partir du MOIS EN COURS (i = 0)
    for (let i = 0; i <= state.monthsToProject; i++) {
        const futureDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const monthKey = `${futureDate.getFullYear()}-${futureDate.getMonth() + 1}`;
        const monthName = futureDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

        const monthProjects = state.projects.filter(p => p.month === monthKey);
        let monthCheckingProjectsTotal = 0;

        monthProjects.forEach(project => {
            if (project.source === 'checking') {
                monthCheckingProjectsTotal += project.amount;
            } else {
                accumulatedSavings -= project.amount;
            }
        });

        let balanceBeforePay = 0;
        let balanceAfterPay = 0;

        if (i === 0) {
            // Mois en cours : Solde actuel - dépenses/projets du mois avant la paie
            balanceBeforePay = currentBalance - monthCheckingProjectsTotal;
            balanceAfterPay = balanceBeforePay + currentCheckingNet;
            accumulatedSavings += monthlySavingsAmount;
            currentBalance = balanceAfterPay;
        } else {
            // Mois futurs
            balanceBeforePay = currentBalance - monthCheckingProjectsTotal;
            currentBalance = balanceBeforePay + currentCheckingNet;
            accumulatedSavings += monthlySavingsAmount;
            balanceAfterPay = currentBalance;
        }

        const totalPatrimony = currentBalance + accumulatedSavings;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <strong>${monthName.charAt(0).toUpperCase() + monthName.slice(1)}</strong>
                ${i === 0 ? ' <span class="badge-source">En cours</span>' : ''}
            </td>
            <td class="${monthCheckingProjectsTotal > 0 ? 'negative' : ''}">
                ${monthCheckingProjectsTotal > 0 ? '-' + formatCurrency(monthCheckingProjectsTotal) : '-'}
            </td>
            <td style="color: ${balanceBeforePay >= 0 ? 'var(--text-main)' : 'var(--danger)'}">
                ${formatCurrency(balanceBeforePay)} <small style="color:var(--text-muted);">(Avant le ${state.payDay})</small>
            </td>
            <td style="font-weight: 600; color: ${balanceAfterPay >= 0 ? 'var(--text-main)' : 'var(--danger)'}">
                ${formatCurrency(balanceAfterPay)}
            </td>
            <td>${formatCurrency(accumulatedSavings)}</td>
            <td style="font-weight: 600;">${formatCurrency(totalPatrimony)}</td>
        `;
        projectionBody.appendChild(row);
    }
}

loadData();
