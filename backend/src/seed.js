const bcrypt = require('bcryptjs');
const pool = require('./db');


async function seedAdmin() {
  const passwordHash = await bcrypt.hash('admin', 10);
  await pool.query(
    `INSERT INTO users (username, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (username) DO NOTHING`,
    ['admin', passwordHash]
  );
}

async function seedAdminWithRetry(retries = 10, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await seedAdmin();
      console.log('Usuário admin verificado/criado com sucesso.');
      return;
    } catch (err) {
      console.warn(
        `Tentativa ${attempt}/${retries} de conectar ao banco falhou: ${err.message}`
      );
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

module.exports = seedAdminWithRetry;
