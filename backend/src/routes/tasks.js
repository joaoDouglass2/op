const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const VALID_STATUSES = ['todo', 'doing', 'done'];


router.use(authMiddleware);


router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM tasks ORDER BY created_at ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar tarefas:', err);
    res.status(500).json({ error: 'Erro ao buscar tarefas' });
  }
});

router.post('/', async (req, res) => {
  const { title, description } = req.body || {};

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Título é obrigatório' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tasks (title, description, status)
       VALUES ($1, $2, 'todo') RETURNING *`,
      [title.trim(), description ? description.trim() : '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao criar tarefa:', err);
    res.status(500).json({ error: 'Erro ao criar tarefa' });
  }
});


router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body || {};

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Status inválido' });
  }

  try {
    const result = await pool.query(
      `UPDATE tasks SET
         title       = COALESCE($1, title),
         description = COALESCE($2, description),
         status      = COALESCE($3, status)
       WHERE id = $4
       RETURNING *`,
      [title, description, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar tarefa:', err);
    res.status(500).json({ error: 'Erro ao atualizar tarefa' });
  }
});

// Remove uma tarefa
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }

    res.json({ message: 'Tarefa removida com sucesso' });
  } catch (err) {
    console.error('Erro ao remover tarefa:', err);
    res.status(500).json({ error: 'Erro ao remover tarefa' });
  }
});

module.exports = router;
