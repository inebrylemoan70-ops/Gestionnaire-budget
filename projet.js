const STORAGE_KEY = 'budgetApp_v5_data';

let state = {
    payDay: 25,
    checkings: [],
    monthsToProject: 12,
    savingsRate: 50,
    incomes: [],
    expenses: [],
    savings: [],
    projects: [],
    advProjects: []
};

let editingAdvId = null;
let currentImageBase64 = "";

function loadData() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        try {
            state = JSON.parse(savedData);
            if (!state.advProjects) state.advProjects = [];
            if (!state.incomes) state.incomes = [];
            if (!state.expenses) state.expenses = [];
            if (!state.projects) state.projects = [];
        } catch (e) {
            console.error("Erreur de chargement", e);
        }
    }
    updateMonthOptions();
    renderAdvProjects();
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderAdvProjects();
}

function formatCurrency(v) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(v || 0);
}

function updateMonthOptions() {
    const select = document.getElementById('projectMonthSelect');
    if (!select) return;
    select.innerHTML = '';
    const today = new Date();
    
    for (let i = 0; i <= (state.monthsToProject || 12); i++) {
        const futureDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const monthLabel = futureDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        const monthValue = `${futureDate.getFullYear()}-${futureDate.getMonth() + 1}`;
        const option = document.createElement('option');
        option.value = monthValue;
        option.textContent = (i === 0 ? "Mois en cours - " : "") + monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
        select.appendChild(option);
    }
}

function toggleProjectFields() {
    const category = document.getElementById('projectCategory').value;
    document.getElementById('autoFields').style.display = category === 'auto' ? 'grid' : 'none';
    document.getElementById('immoFields').style.display = category === 'immo' ? 'grid' : 'none';
}

document.getElementById('advProjectImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => currentImageBase64 = event.target.result;
        reader.readAsDataURL(file);
    }
});

function saveAdvProject() {
    const name = document.getElementById('advProjectName').value.trim();
    const price = parseFloat(document.getElementById('advProjectPrice').value) || 0;
    const category = document.getElementById('projectCategory').value;
    const targetMonth = document.getElementById('projectMonthSelect').value;
    const sourceAccount = document.getElementById('paymentSourceSelect').value;

    if (!name || price <= 0) {
        alert("Veuillez renseigner un nom et un prix valide.");
        return;
    }

    const itemData = {
        id: editingAdvId || Date.now(),
        name,
        price,
        category,
        targetMonth,
        sourceAccount,
        image: currentImageBase64,
        autoYears: parseInt(document.getElementById('autoYears').value) || 3,
        autoRate: parseFloat(document.getElementById('autoDepreciationRate').value) || 15,
        immoRenov: parseFloat(document.getElementById('immoRenov').value) || 0,
        immoRent: parseFloat(document.getElementById('immoRent').value) || 0,
        immoCharges: parseFloat(document.getElementById('immoCharges').value) || 0,
        rentDestination: document.getElementById('rentDestinationSelect') ? document.getElementById('rentDestinationSelect').value : 'checking'
    };

    // Synchronisation avec les dépenses ponctuelles du dashboard
    const totalPurchaseCost = price + (category === 'immo' ? itemData.immoRenov : 0);
    const existingProjIdx = state.projects.findIndex(p => p.advId === itemData.id);
    
    const indexProjectData = {
        id: existingProjIdx !== -1 ? state.projects[existingProjIdx].id : Date.now(),
        advId: itemData.id,
        name: `Achat: ${name}`,
        amount: totalPurchaseCost,
        month: targetMonth,
        source: sourceAccount
    };

    if (existingProjIdx !== -1) {
        state.projects[existingProjIdx] = indexProjectData;
    } else {
        state.projects.push(indexProjectData);
    }

    // Synchronisation du loyer net avec les revenus récurrents du dashboard
    if (category === 'immo' && itemData.immoRent > 0) {
        const netRent = itemData.immoRent - itemData.immoCharges;
        const incomeName = `Loyer Net: ${name}`;
        const existingIncIdx = state.incomes.findIndex(i => i.advId === itemData.id);

        if (netRent > 0) {
            const incomeData = {
                id: existingIncIdx !== -1 ? state.incomes[existingIncIdx].id : Date.now() + 1,
                advId: itemData.id,
                name: incomeName,
                amount: netRent
            };
            if (existingIncIdx !== -1) state.incomes[existingIncIdx] = incomeData;
            else state.incomes.push(incomeData);
        }
    }

    if (editingAdvId) {
        const idx = state.advProjects.findIndex(p => p.id === editingAdvId);
        if (!itemData.image && state.advProjects[idx].image) itemData.image = state.advProjects[idx].image;
        state.advProjects[idx] = itemData;
    } else {
        state.advProjects.push(itemData);
    }

    resetAdvForm();
    saveData();
}

function startEditAdv(id) {
    const item = state.advProjects.find(p => p.id === id);
    if (!item) return;

    editingAdvId = id;
    document.getElementById('projectCategory').value = item.category;
    document.getElementById('advProjectName').value = item.name;
    document.getElementById('advProjectPrice').value = item.price;
    document.getElementById('projectMonthSelect').value = item.targetMonth;
    document.getElementById('paymentSourceSelect').value = item.sourceAccount;
    currentImageBase64 = item.image || "";

    toggleProjectFields();

    if (item.category === 'auto') {
        document.getElementById('autoYears').value = item.autoYears;
        document.getElementById('autoDepreciationRate').value = item.autoRate;
    } else if (item.category === 'immo') {
        document.getElementById('immoRenov').value = item.immoRenov;
        document.getElementById('immoRent').value = item.immoRent;
        document.getElementById('immoCharges').value = item.immoCharges;
        if (document.getElementById('rentDestinationSelect')) {
            document.getElementById('rentDestinationSelect').value = item.rentDestination || 'checking';
        }
    }

    document.getElementById('addAdvProjectBtn').textContent = "Mettre à jour le projet";
    document.getElementById('cancelAdvProjectBtn').style.display = "inline-block";
}

function resetAdvForm() {
    editingAdvId = null;
    currentImageBase64 = "";
    document.getElementById('advProjectName').value = '';
    document.getElementById('advProjectPrice').value = '';
    document.getElementById('advProjectImage').value = '';
    document.getElementById('immoRenov').value = '';
    document.getElementById('immoRent').value = '';
    document.getElementById('immoCharges').value = '';
    document.getElementById('addAdvProjectBtn').textContent = "Enregistrer le projet";
    document.getElementById('cancelAdvProjectBtn').style.display = "none";
}

function deleteAdvProject(id) {
    state.advProjects = state.advProjects.filter(p => p.id !== id);
    state.projects = state.projects.filter(p => p.advId !== id);
    state.incomes = state.incomes.filter(i => i.advId !== id);
    saveData();
}

function renderAdvProjects() {
    const container = document.getElementById('advProjectsContainer');
    container.innerHTML = '';

    if (state.advProjects.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted);">Aucun projet détaillé enregistré pour le moment.</p>';
        return;
    }

    state.advProjects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.borderLeft = '4px solid var(--primary)';
        card.style.marginBottom = '16px';

        let analysisHTML = '';
        const sourceLabel = project.sourceAccount === 'checking' ? 'Compte Courant' : 'Épargne';

        if (project.category === 'auto') {
            let estimatedValue = project.price;
            for (let yr = 1; yr <= project.autoYears; yr++) {
                const rate = yr === 1 ? 20 : project.autoRate;
                estimatedValue *= (1 - rate / 100);
            }
            const loss = project.price - estimatedValue;

            analysisHTML = `
                <div class="metrics-grid">
                    <div class="metric-box">
                        <span class="metric-label">Achat Prévu En</span>
                        <span class="metric-value">${project.targetMonth}</span>
                    </div>
                    <div class="metric-box">
                        <span class="metric-label">Prélevé sur</span>
                        <span class="metric-value">${sourceLabel}</span>
                    </div>
                    <div class="metric-box">
                        <span class="metric-label">Valeur revente (${project.autoYears} ans)</span>
                        <span class="metric-value positive">${formatCurrency(estimatedValue)}</span>
                    </div>
                    <div class="metric-box">
                        <span class="metric-label">Décote globale</span>
                        <span class="metric-value negative">-${formatCurrency(loss)}</span>
                    </div>
                </div>
            `;
        } else if (project.category === 'immo') {
            const totalCost = project.price + project.immoRenov;
            const netMonthly = project.immoRent - project.immoCharges;
            const paybackMonths = netMonthly > 0 ? Math.ceil(totalCost / netMonthly) : 0;
            const paybackYears = (paybackMonths / 12).toFixed(1);

            analysisHTML = `
                <div class="metrics-grid">
                    <div class="metric-box">
                        <span class="metric-label">Coût Total</span>
                        <span class="metric-value">${formatCurrency(totalCost)}</span>
                    </div>
                    <div class="metric-box">
                        <span class="metric-label">Prélevé sur</span>
                        <span class="metric-value">${sourceLabel} (${project.targetMonth})</span>
                    </div>
                    <div class="metric-box">
                        <span class="metric-label">Loyer Net / Mois</span>
                        <span class="metric-value positive">+${formatCurrency(netMonthly)}</span>
                    </div>
                    <div class="metric-box">
                        <span class="metric-label">Remboursement Total</span>
                        <span class="metric-value">${netMonthly > 0 ? `${paybackMonths} mois (~${paybackYears} ans)` : 'N/A'}</span>
                    </div>
                </div>
            `;
        }

        const imageHTML = project.image 
            ? `<img src="${project.image}" alt="${project.name}" style="width: 100%; max-width: 180px; height: 120px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">` 
            : `<div style="width: 100%; max-width: 180px; height: 120px; background: var(--bg-main); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 0.8rem;">Sans Image</div>`;

        card.innerHTML = `
            <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-start; margin-bottom: 12px;">
                ${imageHTML}
                <div style="flex: 1; min-width: 200px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="font-size: 1.1rem; font-weight: 700;">${project.name}</h3>
                        <span class="badge-source">${project.category.toUpperCase()}</span>
                    </div>
                    <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">Achat via ${sourceLabel} programmé pour le mois : ${project.targetMonth}</p>
                </div>
            </div>
            ${analysisHTML}
            <div class="action-btns" style="justify-content: flex-end; margin-top: 12px;">
                <button class="edit-btn" onclick="startEditAdv(${project.id})">Modifier</button>
                <button class="delete-btn" onclick="deleteAdvProject(${project.id})">Supprimer</button>
            </div>
        `;

        container.appendChild(card);
    });
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `budget_projets_sauvegarde_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
}

function importData(e) {
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
}

loadData();
