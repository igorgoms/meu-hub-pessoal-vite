// js/flashcards.js

let currentDeckId = null;

async function initFlashcards() {
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
            <div class="col-md-8" id="deck-view" class="d-none">
                </div>
        </div>
    `;

    document.getElementById('new-deck-form').addEventListener('submit', handleNewDeckSubmit);
    await loadDecks();
}

async function loadDecks() {
    const decksList = document.getElementById('decks-list');
    decksList.innerHTML = '<li class="list-group-item">Carregando...</li>';
    const { data: decks, error } = await supabase.from('flashcard_decks').select('*');
    if (error) { console.error('Erro:', error); return; }

    decksList.innerHTML = '';
    decks.forEach(deck => {
        const deckElement = document.createElement('a');
        deckElement.href = '#';
        deckElement.className = 'list-group-item list-group-item-action';
        deckElement.textContent = deck.name;
        deckElement.onclick = () => showDeckView(deck);
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
    // Encontra o item de lista pelo texto e o ativa (uma abordagem simples)
    const activeItem = Array.from(document.querySelectorAll('#decks-list a')).find(el => el.textContent === deck.name);
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
            <div class="flashcard">
                <div class="flashcard-inner">
                    <div class="flashcard-front card"><div class="card-body d-flex align-items-center justify-content-center">${card.front_content}</div></div>
                    <div class="flashcard-back card"><div class="card-body d-flex align-items-center justify-content-center">${card.back_content}</div></div>
                </div>
            </div>`;
        cardCol.querySelector('.flashcard').addEventListener('click', (e) => {
            e.currentTarget.querySelector('.flashcard-inner').classList.toggle('is-flipped');
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
        await loadFlashcards(currentDeckId);
    }
}