// js/reviews.js
import { supabase } from './supabase-client.js';
import * as bootstrap from 'bootstrap';

let reviewModal = null; // Variável para guardar a instância do modal

export async function initReviews() {
    const reviewsSection = document.getElementById('reviews-section');
    reviewsSection.innerHTML = `
        <div class="row">
            <div class="col-lg-4">
                <h3>Nova Resenha</h3>
                <form id="new-review-form" class="p-3 border bg-body-tertiary rounded">
                    <div class="mb-3">
                        <label for="review-title" class="form-label">Título</label>
                        <input type="text" class="form-control" id="review-title" required>
                    </div>
                    <div class="mb-3">
                        <label for="review-category" class="form-label">Categoria</label>
                        <select class="form-select" id="review-category" required>
                            <option value="" disabled selected>Selecione...</option>
                            <option value="Jogos">Jogos</option>
                            <option value="Livros">Livros</option>
                            <option value="Filmes">Filmes</option>
                            <option value="Séries">Séries</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Avaliação</label>
                        <div class="star-rating">
                            <i class="bi bi-star star-icon" data-value="1"></i>
                            <i class="bi bi-star star-icon" data-value="2"></i>
                            <i class="bi bi-star star-icon" data-value="3"></i>
                            <i class="bi bi-star star-icon" data-value="4"></i>
                            <i class="bi bi-star star-icon" data-value="5"></i>
                        </div>
                        <input type="hidden" id="review-rating" value="0" required>
                    </div>
                    <div class="mb-3">
                        <label for="review-image" class="form-label">Imagem da Capa</label>
                        <input class="form-control" type="file" id="review-image" accept="image/*" required>
                    </div>
                    <div class="mb-3">
                        <label for="review-text" class="form-label">Resenha</label>
                        <textarea class="form-control" id="review-text" rows="4" required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Salvar Resenha</button>
                </form>
            </div>
            <div class="col-lg-8">
                <h3>Minhas Resenhas</h3>
                <div id="reviews-list-container" class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4"></div>
            </div>
        </div>
    `;

    setupStarRating();
    document.getElementById('new-review-form').addEventListener('submit', handleNewReviewSubmit);
    document.getElementById('reviews-list-container').addEventListener('click', handleReviewCardClick);
    reviewModal = new bootstrap.Modal(document.getElementById('reviewDetailModal')); // Inicializa o modal
    await loadReviews();
}


function setupStarRating() { /* ... (função igual) ... */ }
function updateStarDisplay(value, isHover = false) { /* ... (função igual) ... */ }


let reviewsData = []; // Armazena os dados das resenhas para usar no modal

async function loadReviews() {
    const container = document.getElementById('reviews-list-container');
    container.innerHTML = '<p>Carregando...</p>';
    const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return; }

    reviewsData = data; // Salva os dados
    container.innerHTML = '';
    reviewsData.forEach((review, index) => {
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) { starsHTML += `<i class="bi ${i <= review.rating ? 'bi-star-fill' : 'bi-star'} selected"></i> `; }
        const col = document.createElement('div');
        col.className = 'col';
        col.innerHTML = `
            <div class="card h-100 review-card" data-index="${index}">
                <img src="${review.image_url}" class="card-img-top" alt="${review.title}">
                <div class="card-body">
                    <h5 class="card-title">${review.title}</h5>
                    <p class="card-text small text-body-secondary">${review.category}</p>
                    <p class="card-text">${starsHTML}</p>
                </div>
                <div class="card-footer d-flex justify-content-between">
                     <button class="btn btn-sm btn-outline-secondary view-review-btn">Ver Detalhes</button>
                     <button class="btn btn-sm btn-outline-danger delete-review-btn">
                        <i class="bi bi-trash"></i> Excluir
                     </button>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

async function handleNewReviewSubmit(event) { /* ... (função igual, mas adicione uma verificação de 'image_path') ... */
    // Sugestão: adicione uma coluna 'image_path' na sua tabela 'reviews' para facilitar a exclusão da imagem no Storage
    // Por enquanto, vamos manter a lógica de upload como está. A exclusão da imagem pode não funcionar sem o path.
}

function handleReviewCardClick(event) {
    const card = event.target.closest('.review-card');
    if (!card) return;

    const reviewIndex = card.dataset.index;
    const review = reviewsData[reviewIndex];

    if (event.target.closest('.view-review-btn')) {
        showReviewModal(review);
    }
    if (event.target.closest('.delete-review-btn')) {
        handleDeleteReview(review, card);
    }
}

function showReviewModal(review) {
    document.getElementById('reviewModalTitle').textContent = review.title;
    let starsHTML = '';
    for (let i = 1; i <= 5; i++) { starsHTML += `<i class="bi ${i <= review.rating ? 'bi-star-fill' : 'bi-star'} selected fs-4"></i> `; }
    
    const modalBody = document.getElementById('reviewModalBody');
    modalBody.innerHTML = `
        <img src="${review.image_url}" class="img-fluid rounded mb-3" alt="Capa de ${review.title}">
        <p><strong>Categoria:</strong> ${review.category}</p>
        <p><strong>Avaliação:</strong> ${starsHTML}</p>
        <hr>
        <p>${review.review_text}</p>
    `;
    reviewModal.show();
}

async function handleDeleteReview(review, cardElement) {
    if (confirm(`Tem certeza que deseja apagar a resenha de "${review.title}"?`)) {
        // Excluir do banco de dados
        const { error: dbError } = await supabase.from('reviews').delete().eq('id', review.id);

        if (dbError) {
            console.error('Erro ao apagar do banco de dados:', dbError);
            alert('Não foi possível apagar a resenha.');
            return;
        }

        // Tenta apagar a imagem do Storage (pode falhar se o path não for exato)
        try {
            const imagePath = new URL(review.image_url).pathname.split('/review-images/')[1];
            if (imagePath) {
                await supabase.storage.from('review-images').remove([imagePath]);
            }
        } catch (storageError) {
            console.warn("Não foi possível apagar a imagem do Storage. Isso pode acontecer se o path não foi encontrado.", storageError);
        }

        cardElement.parentElement.remove(); // Remove o card da tela
    }
}