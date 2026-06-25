let userRatings = {};
let customFlavors = { e: [], t: [], h: [], m: [] };
let currentFlavorId = null;
let currentPrefix = "";
let pageStaticFlavors = [];
let tempRatings = { geruch: 0, geschmack: 0, balance: 0, intensitaet: 0 };

function loadStorageData() {
    try {
        const r = localStorage.getItem('holy_ratings');
        if (r) userRatings = JSON.parse(r) || {};
    } catch(e) { userRatings = {}; }

    try {
        const c = localStorage.getItem('holy_custom_flavors');
        if (c) {
            const parsed = JSON.parse(c);
            if (parsed && typeof parsed === 'object' && parsed.e) customFlavors = parsed;
        }
    } catch(e) { customFlavors = { e: [], t: [], h: [], m: [] }; }
}

function initPage(prefix, staticFlavorsList) {
    currentPrefix = prefix;
    pageStaticFlavors = staticFlavorsList;
    
    document.addEventListener("DOMContentLoaded", function() {
        loadStorageData();
        renderFlavors();
        setupStarEvents();
    });
}

function renderFlavors() {
    const container = document.getElementById('app-content');
    if(!container) return;
    container.innerHTML = '';

    const addedFlavors = customFlavors[currentPrefix] || [];
    const allFlavors = [...pageStaticFlavors, ...addedFlavors];

    allFlavors.forEach(f => {
        const card = document.createElement('div');
        card.className = 'flavor-card';
        card.onclick = () => openModal(f.id, f.name, f.desc);
        
        const isCustom = f.id.includes('_custom_');
        const isRated = userRatings[f.id] && (userRatings[f.id].geschmack > 0 || userRatings[f.id].fazit);
        
        let rightSideHTML = '<div class="card-right">';
        rightSideHTML += `<div class="status-badge" style="display: ${isRated ? 'block' : 'none'}">${isRated ? (userRatings[f.id].geschmack || 0) + ' ★' : ''}</div>`;
        
        if (isCustom) {
            rightSideHTML += `<button class="btn-delete-flavor" onclick="deleteCustomFlavor(event, '${f.id}')">🗑️</button>`;
        }
        rightSideHTML += '</div>';

        card.innerHTML = `<div class="flavor-info"><h3>${f.name}</h3><p>${f.desc}</p></div>${rightSideHTML}`;
        container.appendChild(card);
    });
}

function openModal(id, name, desc) {
    currentFlavorId = id;
    document.getElementById('modalFlavorName').innerText = name;
    document.getElementById('modalFlavorDesc').innerText = desc;
    const existing = userRatings[id] || { geruch: 0, geschmack: 0, balance: 0, intensitaet: 0, fazit: "" };
    tempRatings = { ...existing };
    document.getElementById('modalFazit').value = existing.fazit || "";
    
    document.querySelectorAll('.stars').forEach(sc => {
        const metric = sc.getAttribute('data-metric');
        updateStarsVisual(sc, tempRatings[metric] || 0);
    });
    
    const isRated = userRatings[id] && (userRatings[id].geschmack > 0 || userRatings[id].geruch > 0 || userRatings[id].fazit);
    document.getElementById('deleteBtn').style.display = isRated ? 'block' : 'none';
    document.getElementById('modalOverlay').style.display = 'flex';
}

function closeModal() { document.getElementById('modalOverlay').style.display = 'none'; }
function openAddFlavorModal() { document.getElementById('addFlavorOverlay').style.display = 'flex'; }
function closeAddFlavorModal() { document.getElementById('addFlavorOverlay').style.display = 'none'; }

function saveCustomFlavor() {
    const name = document.getElementById('newFlavorName').value.trim();
    const desc = document.getElementById('newFlavorDesc').value.trim();
    if(!name) { alert("Bitte gib einen Namen ein."); return; }

    const uniqueId = currentPrefix + "_custom_" + Date.now();
    if(!customFlavors[currentPrefix]) customFlavors[currentPrefix] = [];
    customFlavors[currentPrefix].push({ id: uniqueId, name: name, desc: desc || "Selbst hinzugefügt" });
    
    localStorage.setItem('holy_custom_flavors', JSON.stringify(customFlavors));
    closeAddFlavorModal();
    renderFlavors();
}

function deleteCustomFlavor(event, id) {
    event.stopPropagation();
    if(confirm("Sorte wirklich dauerhaft löschen?")) {
        if(customFlavors[currentPrefix]) {
            customFlavors[currentPrefix] = customFlavors[currentPrefix].filter(f => f.id !== id);
            localStorage.setItem('holy_custom_flavors', JSON.stringify(customFlavors));
        }
        if(userRatings[id]) {
            delete userRatings[id];
            localStorage.setItem('holy_ratings', JSON.stringify(userRatings));
        }
        renderFlavors();
    }
}

function setupStarEvents() {
    document.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', function(e) {
            e.stopPropagation();
            const val = parseInt(this.getAttribute('data-value'));
            const container = this.parentElement;
            const metric = container.getAttribute('data-metric');
            tempRatings[metric] = val;
            updateStarsVisual(container, val);
        });
    });
}

function updateStarsVisual(container, value) {
    container.querySelectorAll('.star').forEach(s => {
        const sVal = parseInt(s.getAttribute('data-value'));
        s.classList.toggle('active', sVal <= value);
    });
}

function saveRatings() {
    tempRatings.fazit = document.getElementById('modalFazit').value;
    userRatings[currentFlavorId] = { ...tempRatings };
    localStorage.setItem('holy_ratings', JSON.stringify(userRatings));
    closeModal(); renderFlavors();
}

function deleteRatings() {
    if(confirm("Bewertung wirklich löschen?")) {
        delete userRatings[currentFlavorId];
        localStorage.setItem('holy_ratings', JSON.stringify(userRatings));
        closeModal(); renderFlavors();
    }
}
