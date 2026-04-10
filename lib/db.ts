import mysql from 'mysql2/promise';

let connection: mysql.Connection | null = null;

export async function getDb(): Promise<mysql.Connection> {
  if (connection) {
    try {
      await connection.ping();
      return connection;
    } catch {
      connection = null;
    }
  }

  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    connection = await mysql.createConnection(dbUrl);
  } else {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3307'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hotel_db',
    });
  }

  await initSchema(connection);
  return connection;
}

async function initSchema(db: mysql.Connection) {
  await db.execute(`CREATE TABLE IF NOT EXISTS rooms (
    room_number VARCHAR(10) PRIMARY KEY,
    room_type VARCHAR(20),
    price_per_day DOUBLE,
    available BOOLEAN DEFAULT TRUE
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    contact VARCHAR(15),
    room_number VARCHAR(10),
    check_in_date DATE
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT,
    room_number VARCHAR(10),
    check_in_date DATE,
    check_out_date DATE,
    status VARCHAR(20),
    total_bill DOUBLE DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'UNPAID'
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS users (
    userid INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS housekeeping (
    room_number VARCHAR(10) PRIMARY KEY,
    status VARCHAR(20) DEFAULT 'CLEAN',
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS customer_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    customer_id INT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    contact VARCHAR(15),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    customer_account_id INT,
    amount DOUBLE NOT NULL,
    method VARCHAR(30) NOT NULL,
    status VARCHAR(20) DEFAULT 'COMPLETED',
    transaction_ref VARCHAR(60),
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id)
  )`);

  try { await db.execute(`ALTER TABLE bookings ADD COLUMN total_bill DOUBLE DEFAULT 0`); } catch {}
  try { await db.execute(`ALTER TABLE bookings ADD COLUMN payment_status VARCHAR(20) DEFAULT 'UNPAID'`); } catch {}

  const [rooms] = await db.execute('SELECT COUNT(*) as cnt FROM rooms') as any[];
  if (rooms[0].cnt === 0) {
    await db.execute(`INSERT INTO rooms (room_number, room_type, price_per_day, available) VALUES
      ('101','SINGLE',1500,TRUE),('102','SINGLE',1500,TRUE),('103','SINGLE',1800,TRUE),
      ('201','DOUBLE',2800,TRUE),('202','DOUBLE',2800,TRUE),('203','DOUBLE',3200,TRUE),
      ('301','DELUXE',5500,TRUE),('302','DELUXE',5500,TRUE),('303','DELUXE',7000,TRUE)`);
  }

  const [users] = await db.execute('SELECT COUNT(*) as cnt FROM users') as any[];
  if (users[0].cnt === 0) {
    await db.execute(`INSERT INTO users (username, password, role) VALUES
      ('admin','hotel123','ADMIN'),
      ('staff','staff123','STAFF'),
      ('manager','mgr123','MANAGER')`);
  }
}
