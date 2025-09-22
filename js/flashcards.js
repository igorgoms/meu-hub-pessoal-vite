// js/flashcards.js

import { supabase } from './supabase-client.js';

let currentDeckId = null;

export async function initFlashcards() {
    // ... (esta função continua igual a que você já tem)
    const flashcardsSection = document.getElementById('flashcards-section');
    flashcardsSection.innerHTML = `
        <div class="row">
            <div class="col-md-4" id="decks-container">
                <h3>Meus Grupos</h3>
                <ul class="list-group" id="decks-list"></ul>
                <form id="new-deck-form" class="mt-3">
                    <div class="input-group">
                        <input type="text" id="new-deck-name" class="form-control" placeholder="Nome do novo grupo" required>
                        <button class="btn btn-outline-secondary" type="submit">Criar</button>
                    </div>
                </form>
            </div>
            <div class="col-md-8" id="deck-view" class="d-none"></div>
        </div>
    `;
    document.getElementById('new-deck-form').addEventListener('submit', handleNewDeckSubmit);
    flashcardsSection.addEventListener('click', handleFlashcardClicks);
    await loadDecks();
}

async function loadDecks() {
    const decksList = document.getElementById('decks-list');
    decksList.innerHTML = '<li class="list-group-item">Carregando...</li>';
    const { data: decks, error } = await supabase.from('flashcard_decks').select('*');
    if (error) { console.error('Erro:', error); return; }

    decksList.innerHTML = '';
    decks.forEach(deck => {
        const deckElement = document.createElement('div');
        deckElement.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        deckElement.innerHTML = `
            <span class="deck-name">${deck.name}</span>
            <button class="btn btn-sm btn-outline-danger border-0 delete-deck-btn" data-deck-id="${deck.id}">
                <i class="bi bi-trash"></i>
            </button>
        `;
        deckElement.querySelector('.deck-name').onclick = () => showDeckView(deck);
        decksList.appendChild(deckElement);
    });
}

async function handleNewDeckSubmit(event) {
    // ... (esta função continua igual)
    event.preventDefault();
    const deckNameInput = document.getElementById('new-deck-name');
    const { error } = await supabase.from('flashcard_decks').insert({ name: deckNameInput.value });
    if (!error) {
        deckNameInput.value = '';
        await loadDecks();
    }
}

function showDeckView(deck) {
    // ... (esta função continua igual)
    currentDeckId = deck.id;
    const deckView = document.getElementById('deck-view');
    deckView.classList.remove('d-none');
    document.querySelectorAll('#decks-list .list-group-item').forEach(item => item.classList.remove('active'));
    const activeItem = Array.from(document.querySelectorAll('#decks-list .list-group-item')).find(el => el.querySelector('.deck-name').textContent === deck.name);
    if(activeItem) activeItem.classList.add('active');

    deckView.innerHTML = `
        <h2>${deck.name}</h2>
        <div id="flashcards-list" class="row g-3"></div>
        <hr class="my-4">
        <h4>Adicionar Novo Card</h4>
        <form id="new-flashcard-form">
            <div class="row g-2">
                <div class="col-md-6"><textarea id="front-content" class="form-control" placeholder="Frente" required></textarea></div>
                <div class="col-md-6"><textarea id="back-content" class="form-control" placeholder="Verso" required></textarea></div>
            </div>
            <button type="submit" class="btn btn-primary mt-2">Adicionar Card</button>
        </form>
    `;
    document.getElementById('new-flashcard-form').addEventListener('submit', handleNewFlashcardSubmit);
    loadFlashcards(deck.id);
}

async function loadFlashcards(deckId) {
    const flashcardsList = document.getElementById('flashcards-list');
    flashcardsList.innerHTML = '<p>Carregando...</p>';
    const { data: cards, error } = await supabase.from('flashcards').select('*').eq('deck_id', deckId);
    if (error) { console.error(error); return; }

    flashcardsList.innerHTML = '';
    cards.forEach(card => {
        const cardCol = document.createElement('div');
        cardCol.className = 'col-sm-6 col-md-4';
        cardCol.innerHTML = `
            <div class="flashcard" data-card-id="${card.id}">
                <div class="flashcard-inner">
                    <div class="flashcard-front card h-100">
                        <div class="card-body d-flex align-items-center justify-content-center">${card.front_content}</div>
                    </div>
                    <div class="flashcard-back card h-100">
                        <div class="card-body d-flex align-items-center justify-content-center">${card.back_content}</div>
                    </div>
                </div>
                <button class="btn btn-sm btn-danger delete-card-btn position-absolute top-0 end-0 m-1" style="z-index: 10;">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>`;
        cardCol.querySelector('.flashcard-inner').addEventListener('click', (e) => {
            e.currentTarget.classList.toggle('is-flipped');
        });
        flashcardsList.appendChild(cardCol);
    });
}

async function handleNewFlashcardSubmit(event) {
    // ... (esta função continua igual)
    event.preventDefault();
    const front = document.getElementById('front-content').value;
    const back = document.getElementById('back-content').value;
    const { error } = await supabase.from('flashcards').insert({ front_content: front, back_content: back, deck_id: currentDeckId });
    if (!error) {
        document.getElementById('new-flashcard-form').reset();
        await loadFlashcards(currentDeckId);
    }
}

// Lógica central para os cliques de exclusão
async function handleFlashcardClicks(event) {
    const deleteDeckBtn = event.target.closest('.delete-deck-btn');
    const deleteCardBtn = event.target.closest('.delete-card-btn');

    if (deleteDeckBtn) {
        const deckId = deleteDeckBtn.dataset.deckId;
        if (confirm('Tem certeza que deseja apagar este grupo? TODOS os cards dentro dele serão perdidos.')) {
            // Primeiro, apaga todos os cards do grupo
            await supabase.from('flashcards').delete().eq('deck_id', deckId);
            // Depois, apaga o grupo
            await supabase.from('flashcard_decks').delete().eq('id', deckId);
            // Recarrega a lista de grupos
            await loadDecks();
            document.getElementById('deck-view').classList.add('d-none');
        }
    }

    if (deleteCardBtn) {
        const cardElement = deleteCardBtn.closest('.flashcard');
        const cardId = cardElement.dataset.cardId;
        if (confirm('Tem certeza que deseja apagar este card?')) {
            await supabase.from('flashcards').delete().eq('id', cardId);
            cardElement.parentElement.remove(); // Remove a coluna do card
        }
    }
}