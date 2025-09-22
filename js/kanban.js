// js/kanban.js
import { supabase } from './supabase-client.js';
import Sortable from 'sortablejs';
import * as bootstrap from 'bootstrap';

export async function initKanban() {
    const board = document.getElementById('kanban-board');
    board.innerHTML = ''; // Limpa o quadro
    const columns = ['A Fazer', 'Em Progresso', 'Concluído', 'Cancelado'];

    // 1. Criar as colunas com classes do Bootstrap
    columns.forEach(columnName => {
        const columnDiv = document.createElement('div');
        columnDiv.className = 'col-md-3 kanban-column';
        columnDiv.innerHTML = `
            <div class="card bg-body-tertiary">
                <div class="card-header">${columnName}</div>
                <div class="card-body kanban-tasks" id="col-${columnName.replace(/ /g, '-')}"></div>
            </div>
        `;
        board.appendChild(columnDiv);
    });
    
    // 2. Lógica do formulário do Modal
    const newTaskForm = document.getElementById('new-task-form');
    newTaskForm.addEventListener('submit', handleNewTaskSubmit);

    // 3. Carregar as tarefas e configurar o drag-and-drop
    await loadKanbanTasks();
    setupDragAndDrop();
}

async function loadKanbanTasks() {
    const { data: tasks, error } = await supabase.from('kanban_tasks').select('*');
    if (error) {
        console.error('Erro ao buscar tarefas:', error);
        return;
    }
    
    // Limpa todas as colunas antes de adicionar as tarefas
    document.querySelectorAll('.kanban-tasks').forEach(col => col.innerHTML = '');

    tasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = 'card mb-2';
        taskCard.dataset.id = task.id;
        taskCard.style.borderLeftColor = task.color;
        taskCard.innerHTML = `<div class="card-body p-2">${task.content}</div>`;
        
        const columnElement = document.getElementById(`col-${task.status.replace(/ /g, '-')}`);
        if (columnElement) {
            columnElement.appendChild(taskCard);
        }
    });
}

async function handleNewTaskSubmit(event) {
    event.preventDefault();
    console.log("1. Formulário de nova tarefa enviado.");

    const contentInput = document.getElementById('new-task-content');
    const colorSelect = document.getElementById('new-task-color');
    
    const content = contentInput.value.trim();
    const color = colorSelect.value;
    console.log("2. Conteúdo a ser salvo:", content);

    if (!content) return;

    // Desabilitar o botão para evitar cliques duplos
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Salvando...';

    console.log("3. Enviando dados para o Supabase...");
    const { data, error } = await supabase.from('kanban_tasks').insert({
        content: content,
        status: 'A Fazer',
        color: color
    });

    if (error) {
        console.error("4. ERRO retornado pelo Supabase:", error);
        alert("Ocorreu um erro ao criar a tarefa. Verifique o console do navegador para mais detalhes.");
        // Reabilitar o botão em caso de erro
        submitButton.disabled = false;
        submitButton.textContent = 'Salvar Tarefa';
        return; 
    }

    console.log("5. Tarefa inserida com SUCESSO!", data);
    
    document.getElementById('new-task-form').reset();
    const modalElement = document.getElementById('newTaskModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    modalInstance.hide();
    
    await loadKanbanTasks();

    // Reabilitar o botão ao final
    submitButton.disabled = false;
    submitButton.textContent = 'Salvar Tarefa';
}

function setupDragAndDrop() {
    const taskContainers = document.querySelectorAll('.kanban-tasks');
    taskContainers.forEach(container => {
        new Sortable(container, {
            group: 'kanban',
            animation: 150,
            onEnd: async (evt) => {
                const taskId = evt.item.dataset.id;
                const newStatus = evt.to.id.replace('col-', '').replace(/-/g, ' ');
                
                const { error } = await supabase.from('kanban_tasks').update({ status: newStatus }).eq('id', taskId);

                if (error) {
                    console.error("Erro ao atualizar tarefa:", error);
                    evt.from.appendChild(evt.item); // Reverte a mudança visual se der erro
                }
            },
        });
    });
}