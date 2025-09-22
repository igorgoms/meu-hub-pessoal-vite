// js/flashcards.js

import { supabase } from './supabase-client.js';
import * as bootstrap from 'bootstrap';

let currentDeckId = null;

export async function initFlashcards() {
    const flashcardsSection = document.getElementById('flashcards-section');
    flashcardsSection.innerHTML = `
        <div class="row">
            <div class="col-lg-4">
                <div class="card">
                    <div class="card-header fw-bold">
                        Meus Grupos
                    </div>
                    <ul class="list-group list-group-flush" id="decks-list"></ul>
                    <div class="card-footer">
                        <form id="new-deck-form">
                            <div class="input-group">
                                <input type="text" id="new-deck-name" class="form-control" placeholder="Nome do novo grupo" required>
                                <button class="btn btn-primary" type="submit">Criar</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div class="col-lg-8" id="deck-view" class="d-none">
                </div>
        </div>
    `;

    document.getElementById('new-deck-form').addEventListener('submit', handleNewDeckSubmit);
    flashcardsSection.addEventListener('click', handleFlashcardClicks);
    await loadDecks();
}

async function loadDecks() {
    const decksList = document.getElementById('decks-list');
    decksList.innerHTML = '<li class="list-group-item">Carregando...</li>';
    const { data: decks, error } = await supabase.from('flashcard_decks').select('*').order('created_at');
    if (error) { console.error('Erro:', error); return; }

    decksList.innerHTML = '';
    decks.forEach(deck => {
        const deckElement = document.createElement('li');
        deckElement.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center';
        deckElement.dataset.deckId = deck.id;
        deckElement.innerHTML = `
            <span class="deck-name flex-grow-1" style="cursor: pointer;">${deck.name}</span>
            <button class="btn btn-sm btn-outline-danger border-0 delete-deck-btn" title="Excluir grupo">
                <i class="bi bi-trash"></i>
            </button>
        `;
        deckElement.querySelector('.deck-name').onclick = () => showDeckView(deck);
        decksList.appendChild(deckElement);
    });
}

async function handleNewDeckSubmit(event) {
    event.preventDefault();
    const deckNameInput = document.getElementById('new-deck-name');
    const { error } = await supabase.from('flashcard_decks').insert({ name: deckNameInput.value });
    if (!error) {
        deckNameInput.value = '';
        await loadDecks();
    }
}

function showDeckView(deck) {
    currentDeckId = deck.id;
    const deckView = document.getElementById('deck-view');
    deckView.classList.remove('d-none');
    
    document.querySelectorAll('#decks-list .list-group-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`#decks-list .list-group-item[data-deck-id='${deck.id}']`)?.classList.add('active');

    deckView.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h2>${deck.name}</h2>
            <button class="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#new-flashcard-collapse">
                <i class="bi bi-plus-lg"></i> Adicionar Novo Card
            </button>
        </div>
        
        <div class="collapse" id="new-flashcard-collapse">
            <div class="card card-body mb-3">
                <form id="new-flashcard-form">
                    <div class="row g-2">
                        <div class="col-md-6 mb-2">
                           <label class="form-label">Frente</label>
                           <textarea id="front-content" class="form-control" required></textarea>
                        </div>
                        <div class="col-md-6 mb-2">
                           <label class="form-label">Verso</label>
                           <textarea id="back-content" class="form-control" required></textarea>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-success mt-2">Salvar Card</button>
                </form>
            </div>
        </div>

        <div id="flashcards-list" class="row g-3"></div>
    `;

    document.getElementById('new-flashcard-form').addEventListener('submit', handleNewFlashcardSubmit);
    loadFlashcards(deck.id);
}

async function loadFlashcards(deckId) {
    const flashcardsList = document.getElementById('flashcards-list');
    flashcardsList.innerHTML = '<p class="text-muted col-12">Carregando cards...</p>';
    const { data: cards, error } = await supabase.from('flashcards').select('*').eq('deck_id', deckId).order('created_at');
    if (error) { console.error(error); return; }

    flashcardsList.innerHTML = '';
    if (cards.length === 0) {
        flashcardsList.innerHTML = '<p class="text-muted col-12">Nenhum card neste grupo ainda. Adicione um novo!</p>';
    }

    cards.forEach(card => {
        const cardCol = document.createElement('div');
        // A MÁGICA DO GRID ACONTECE AQUI:
        cardCol.className = 'col-sm-6 col-lg-4'; 
        cardCol.innerHTML = `
            <div class="flashcard-container">
                <div class="flashcard-inner">
                    <div class="flashcard-front card card-body text-center d-flex justify-content-center align-items-center">
                        <p class="m-0">${card.front_content}</p>
                    </div>
                    <div class="flashcard-back card card-body text-center d-flex justify-content-center align-items-center">
                         <p class="m-0">${card.back_content}</p>
                    </div>
                </div>
                <button class="btn btn-sm btn-danger delete-card-btn" data-card-id="${card.id}" title="Excluir card">
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
    event.preventDefault();
    const front = document.getElementById('front-content').value;
    const back = document.getElementById('back-content').value;
    const { error } = await supabase.from('flashcards').insert({ front_content: front, back_content: back, deck_id: currentDeckId });
    if (!error) {
        document.getElementById('new-flashcard-form').reset();
        const collapseElement = document.getElementById('new-flashcard-collapse');
        const bsCollapse = bootstrap.Collapse.getInstance(collapseElement) || new bootstrap.Collapse(collapseElement, { toggle: false });
        bsCollapse.hide();
        await loadFlashcards(currentDeckId);
    }
}

async function handleFlashcardClicks(event) {
    const deleteDeckBtn = event.target.closest('.delete-deck-btn');
    const deleteCardBtn = event.target.closest('.delete-card-btn');

    if (deleteDeckBtn) {
        const deckId = deleteDeckBtn.dataset.deckId;
        if (confirm('Tem certeza que deseja apagar este grupo? TODOS os cards dentro dele serão perdidos.')) {
            await supabase.from('flashcards').delete().eq('deck_id', deckId);
            await supabase.from('flashcard_decks').delete().eq('id', deckId);
            await loadDecks();
            document.getElementById('deck-view').classList.add('d-none');
        }
    }

    if (deleteCardBtn) {
        const cardId = deleteCardBtn.dataset.cardId;
        if (confirm('Tem certeza que deseja apagar este card?')) {
            await supabase.from('flashcards').delete().eq('id', cardId);
            deleteCardBtn.closest('.col-sm-6').remove();
        }
    }
}