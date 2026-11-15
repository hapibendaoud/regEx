
const STORAGE_KEY = 'tawassoul_participants';
let participants = [];
let currentFilter = 'All';
let searchQuery = '';

const participantForm = document.getElementById('participant-form');
const nameInput = document.getElementById('full-name');
const trainingSelect = document.getElementById('training');
const emailInput = document.getElementById('email');

const nameError = document.getElementById('name-error');
const emailError = document.getElementById('email-error');

const listElement = document.getElementById('list');
const emptyState = document.getElementById('empty-state');

const totalCountEl = document.getElementById('total-count');
const selectedCountEl = document.getElementById('selected-count');

const searchInput = document.getElementById('search-input');
const filterButtons = document.querySelectorAll('.btn-filter');
const deleteSelectedBtn = document.getElementById('delete-selected-btn');
const selectAllCheckbox = document.getElementById('select-all-checkbox');

const NAME_REGEX = /^(?=(?:.*[A-Za-zÀ-ÖØ-öø-ÿ]){3,})[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/;


function validerEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(email.trim());
    }
    
    function setFieldError(inputEl, errorEl, message) {
    if (message) {
        errorEl.textContent = message;
        inputEl.classList.remove('border-gray-300', 'bg-white');
        inputEl.classList.add('border-red-600', 'bg-red-50');
    } else {
        errorEl.textContent = '';
        inputEl.classList.remove('border-red-600', 'bg-red-50');
        inputEl.classList.add('border-gray-300', 'bg-white');
    }
    }


    function validateNameField() {
    const value = nameInput.value.trim();
    if (!value) {
        setFieldError(nameInput, nameError, 'Full name is required.');
        return false;
    }
    if (!NAME_REGEX.test(value)) {
        setFieldError(nameInput, nameError, 'Enter at least 3 alphabetical characters (letters only).');
        return false;
    }
    setFieldError(nameInput, nameError, '');
    return true;
    }


    function validateEmailField() {
    const value = emailInput.value.trim();
    if (!value) {
        setFieldError(emailInput, emailError, 'Email address is required.');
        return false;
    }
    if (!validerEmail(value)) {
        setFieldError(emailInput, emailError, 'Please enter a valid email address (e.g., name@domain.com).');
        return false;
    }
    setFieldError(emailInput, emailError, '');
    return true;
    }

    function saveToLocalStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(participants));
    }

    function loadFromLocalStorage() {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
        try {
        participants = JSON.parse(storedData);
        } catch (error) {
        console.error('Failed to parse participants from localStorage:', error);
        participants = [];
        }
    }
    }

    // ============================================================================
    // DOM RENDERING & COUNTERS
    // ============================================================================
    function updateCounters() {
    const total = participants.length;
    const selected = participants.filter((p) => p.selected).length;

    totalCountEl.textContent = total;
    selectedCountEl.textContent = selected;
    deleteSelectedBtn.disabled = selected === 0;
    }

    function getBadgeClasses(training) {
    switch (training) {
        case 'Office':
        return 'bg-blue-100 text-blue-800';
        case 'Web':
        return 'bg-emerald-100 text-emerald-800';
        case 'Languages':
        return 'bg-amber-100 text-amber-900';
        default:
        return 'bg-gray-200 text-ink';
    }
    }


    function createParticipantListItem(participant) {
    const li = document.createElement('li');
    li.dataset.id = participant.id;
    li.className = `flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-lg border transition ${
        participant.selected
        ? 'bg-brand-light border-brand'
        : 'bg-surface border-transparent'
    }`;

    const leftDiv = document.createElement('div');
    leftDiv.className = 'flex items-center gap-3.5 min-w-0 flex-1';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = participant.selected;
    checkbox.className = 'w-6 h-6 md:w-4 md:h-4 accent-brand rounded cursor-pointer shrink-0';
    checkbox.setAttribute('aria-label', `Select ${participant.name}`);
    checkbox.addEventListener('change', () => toggleParticipantSelection(participant.id));

    const infoDiv = document.createElement('div');
    infoDiv.className = 'flex flex-col min-w-0';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'font-semibold text-sm sm:text-base text-ink break-words';
    nameSpan.textContent = participant.name;

    const emailSpan = document.createElement('span');
    emailSpan.className = 'text-xs sm:text-sm text-gray-600 break-all';
    emailSpan.textContent = participant.email;

    infoDiv.appendChild(nameSpan);
    infoDiv.appendChild(emailSpan);
    leftDiv.appendChild(checkbox);
    leftDiv.appendChild(infoDiv);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-gray-200 shrink-0';

    const badge = document.createElement('span');
    badge.className = `text-xs font-semibold px-3 py-1 rounded-full ${getBadgeClasses(participant.training)}`;
    badge.textContent = participant.training;

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'min-h-[44px] md:min-h-0 px-3 py-1.5 text-xs sm:text-sm font-semibold text-red-600 hover:bg-red-100 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600 transition cursor-pointer';
    deleteBtn.textContent = 'Delete';
    deleteBtn.setAttribute('aria-label', `Delete ${participant.name}`);
    deleteBtn.addEventListener('click', () => deleteParticipant(participant.id));

    actionsDiv.appendChild(badge);
    actionsDiv.appendChild(deleteBtn);

    li.appendChild(leftDiv);
    li.appendChild(actionsDiv);

    return li;
}

function getFilteredParticipants() {
    return participants.filter((p) => {
    const matchesTraining = currentFilter === 'All' || p.training === currentFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(query) || p.email.toLowerCase().includes(query);
    return matchesTraining && matchesSearch;
    });
}

function renderList() {
    listElement.innerHTML = '';
    const filtered = getFilteredParticipants();

    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
        selectAllCheckbox.checked = false;
        selectAllCheckbox.disabled = true;
    } else {
        emptyState.classList.add('hidden');
        selectAllCheckbox.disabled = false;
        filtered.forEach((participant) => {
        const li = createParticipantListItem(participant);
        listElement.appendChild(li);
        });
        selectAllCheckbox.checked = filtered.every((p) => p.selected);
    }

    updateCounters();
}

function ajouterElement() {
    const isNameValid = validateNameField();
    const isEmailValid = validateEmailField();

        if (!isNameValid || !isEmailValid) {
            return;
        }

        const newParticipant = {
            id: Date.now().toString(),
            name: nameInput.value.trim(),
            training: trainingSelect.value,
            email: emailInput.value.trim(),
            selected: false
    };

    participants.unshift(newParticipant);
    saveToLocalStorage();
    renderList();
    participantForm.reset();
    setFieldError(nameInput, nameError, '');
    setFieldError(emailInput, emailError, '');
    nameInput.focus();
}

function toggleParticipantSelection(id) {
    const participant = participants.find((p) => p.id === id);
    if (participant) {
        participant.selected = !participant.selected;
        saveToLocalStorage();
        renderList();
    }
}

function deleteParticipant(id) {
    participants = participants.filter((p) => p.id !== id);
    saveToLocalStorage();
    renderList();
}

function deleteSelectedParticipants() {
    participants = participants.filter((p) => !p.selected);
    saveToLocalStorage();
    renderList();
}

nameInput.addEventListener('input', validateNameField);
emailInput.addEventListener('input', validateEmailField);

participantForm.addEventListener('submit', (event) => {
    event.preventDefault();
    ajouterElement();
});

searchInput.addEventListener('input', (event) => {
    searchQuery = event.target.value.trim();
    renderList();
});

filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
        filterButtons.forEach((b) => {
        b.classList.remove('bg-brand', 'text-white', 'border-brand');
        b.classList.add('bg-white', 'text-ink', 'border-gray-300');
        });
        btn.classList.remove('bg-white', 'text-ink', 'border-gray-300');
        btn.classList.add('bg-brand', 'text-white', 'border-brand');

        currentFilter = btn.dataset.filter;
        renderList();
    });
});

deleteSelectedBtn.addEventListener('click', deleteSelectedParticipants);

selectAllCheckbox.addEventListener('change', (event) => {
    const isChecked = event.target.checked;
    const visibleIds = new Set(getFilteredParticipants().map((p) => p.id));

    participants.forEach((p) => {
        if (visibleIds.has(p.id)) {
        p.selected = isChecked;
        }
    });

    saveToLocalStorage();
    renderList();
});

document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    renderList();
});