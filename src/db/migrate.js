require('dotenv').config();
const db = require('./pool');
 
async function migrate() {
  console.log('Running migrations...');
 
  await db.query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
 
    -- Users
    CREATE TABLE IF NOT EXISTS users (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name        VARCHAR(255)        NOT NULL,
      email       VARCHAR(255) UNIQUE NOT NULL,
      password    VARCHAR(255)        NOT NULL,
      role        VARCHAR(50)         NOT NULL DEFAULT 'customer',
      created_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW()
    );
 
    -- Products
    CREATE TABLE IF NOT EXISTS products (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name        VARCHAR(255)        NOT NULL,
      description TEXT,
      price       NUMERIC(10,2)       NOT NULL,
      category    VARCHAR(100)        NOT NULL,
      emoji       VARCHAR(10),
      tag         VARCHAR(50),
      stock       INTEGER             NOT NULL DEFAULT 100,
      active      BOOLEAN             NOT NULL DEFAULT TRUE,
      created_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW()
    );
 
    -- Orders
    CREATE TABLE IF NOT EXISTS orders (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status      VARCHAR(50)    NOT NULL DEFAULT 'pending',
      total       NUMERIC(10,2)  NOT NULL,
      created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
    );
 
    -- Order Items
    CREATE TABLE IF NOT EXISTS order_items (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      order_id    UUID           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id  UUID           NOT NULL REFERENCES products(id),
      quantity    INTEGER        NOT NULL,
      unit_price  NUMERIC(10,2)  NOT NULL
    );
 
    -- Refresh tokens (for secure auth)
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token       TEXT        NOT NULL UNIQUE,
      expires_at  TIMESTAMPTZ NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
 
    -- Updated_at trigger
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $$ LANGUAGE plpgsql;
 
    DROP TRIGGER IF EXISTS update_users_updated_at    ON users;
    DROP TRIGGER IF EXISTS update_products_updated_at ON products;
    DROP TRIGGER IF EXISTS update_orders_updated_at   ON orders;
 
    CREATE TRIGGER update_users_updated_at    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    CREATE TRIGGER update_orders_updated_at   BEFORE UPDATE ON orders   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
 
    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_orders_user_id    ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
  `);
 
  console.log('✅ Migrations complete.');
  process.exit(0);
}
 
migrate().catch(err => { console.error('Migration failed:', err); process.exit(1); });