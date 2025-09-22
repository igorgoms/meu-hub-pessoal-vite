// js/kanban.js
import { supabase } from './supabase-client.js';
import Sortable from 'sortablejs';

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
    const content = document.getElementById('new-task-content').value;
    const color = document.getElementById('new-task-color').value;

    if (!content.trim()) return;

    const { error } = await supabase.from('kanban_tasks').insert({ content, color, status: 'A Fazer' });

    if (error) {
        console.error('Erro ao adicionar tarefa:', error);
    } else {
        document.getElementById('new-task-form').reset();
        // Fecha o modal do Bootstrap
        const modalElement = document.getElementById('newTaskModal');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();
        // Recarrega as tarefas
        await loadKanbanTasks();
    }
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