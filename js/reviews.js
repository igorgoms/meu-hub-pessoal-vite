// js/reviews.js

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
                <div id="reviews-list-container" class="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
                    </div>
            </div>
        </div>
    `;

    setupStarRating();
    document.getElementById('new-review-form').addEventListener('submit', handleNewReviewSubmit);
    await loadReviews();
}

function setupStarRating() {
    const stars = document.querySelectorAll('.star-rating .star-icon');
    const ratingInput = document.getElementById('review-rating');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            ratingInput.value = star.dataset.value;
            updateStarDisplay(ratingInput.value);
        });
        star.addEventListener('mouseover', () => updateStarDisplay(star.dataset.value, true));
    });
    document.querySelector('.star-rating').addEventListener('mouseout', () => updateStarDisplay(ratingInput.value));
}

function updateStarDisplay(value, isHover = false) {
    const stars = document.querySelectorAll('.star-rating .star-icon');
    stars.forEach(star => {
        star.classList.toggle('hover', isHover && star.dataset.value <= value);
        star.classList.toggle('selected', !isHover && star.dataset.value <= value);
        star.classList.replace(star.dataset.value <= value ? 'bi-star' : 'bi-star-fill', star.dataset.value <= value ? 'bi-star-fill' : 'bi-star');
    });
}


async function loadReviews() {
    const container = document.getElementById('reviews-list-container');
    container.innerHTML = '<p>Carregando...</p>';
    const { data: reviews, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); return; }

    container.innerHTML = '';
    reviews.forEach(review => {
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            starsHTML += `<i class="bi ${i <= review.rating ? 'bi-star-fill' : 'bi-star'} selected"></i> `;
        }
        const col = document.createElement('div');
        col.className = 'col';
        col.innerHTML = `
            <div class="card h-100">
                <img src="${review.image_url}" class="card-img-top" alt="${review.title}">
                <div class="card-body">
                    <h5 class="card-title">${review.title}</h5>
                    <h6 class="card-subtitle mb-2 text-body-secondary">${review.category}</h6>
                    <p class="card-text">${starsHTML}</p>
                    <p class="card-text small">${review.review_text}</p>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

async function handleNewReviewSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const btn = form.querySelector('button');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span> Enviando...';

    try {
        const title = form.querySelector('#review-title').value;
        const category = form.querySelector('#review-category').value;
        const rating = form.querySelector('#review-rating').value;
        const review_text = form.querySelector('#review-text').value;
        const imageFile = form.querySelector('#review-image').files[0];

        if (!imageFile || rating === '0') throw new Error("Avaliação e imagem são obrigatórias.");

        const filePath = `public/${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage.from('review-images').upload(filePath, imageFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('review-images').getPublicUrl(filePath);
        const image_url = urlData.publicUrl;

        const { error: insertError } = await supabase.from('reviews').insert({ title, category, rating, review_text, image_url });
        if (insertError) throw insertError;
        
        form.reset();
        updateStarDisplay(0);
        await loadReviews();
    } catch (error) {
        console.error('Erro ao salvar resenha:', error);
        alert(`Erro: ${error.message}`);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Salvar Resenha';
    }
}