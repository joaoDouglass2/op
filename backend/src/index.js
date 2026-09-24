require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const seedAdminWithRetry = require('./seed');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);


app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});


app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno no servidor' });
});

const PORT = process.env.PORT || 5000;

seedAdminWithRetry()
  .catch((err) => {
    console.error('Não foi possível semear o usuário admin:', err);
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Backend rodando na porta ${PORT}`);
    });
  });
