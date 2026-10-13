require('dotenv').config();
const { DataSource } = require('typeorm');
const bcrypt = require('bcrypt');
const { randomUUID } = require('crypto');

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

ds.initialize()
  .then(async () => {
    // Check existing admin
    const admins = await ds.query(
      `SELECT id, "firstName", "lastName", email, role FROM users WHERE role = 'admin'`
    );

    if (admins.length > 0) {
      console.log('Admin already exists:', JSON.stringify(admins, null, 2));
      await ds.destroy();
      return;
    }

    // Create admin
    const id = randomUUID();
    // Never a default password: the repository is public.
    const email = process.env.ADMIN_EMAIL || 'admin@finanscozum.com';
    const password = process.env.ADMIN_PASSWORD;
    if (!password || password.length < 12) {
      console.error('ADMIN_PASSWORD (en az 12 karakter) ortam değişkeni gerekli.');
      process.exit(1);
    }
    const hash = await bcrypt.hash(password, 12);

    await ds.query(
      `INSERT INTO users (id, "firstName", "lastName", email, "passwordHash", role, "isActive")
       VALUES ($1, $2, $3, $4, $5, 'admin', true)`,
      [id, 'Admin', 'User', email, hash]
    );

    console.log('Admin user created!');
    console.log('Email:', email);
    console.log('Password: (ADMIN_PASSWORD ortam değişkenindeki değer)');

    await ds.destroy();
  })
  .catch((e) => {
    console.error('DB Error:', e.message);
    process.exit(1);
  });

