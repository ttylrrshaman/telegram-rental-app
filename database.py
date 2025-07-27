import sqlite3
from contextlib import closing

DB_NAME = 'skins.db'

def init_db():
    with closing(sqlite3.connect(DB_NAME)) as conn:
        cursor = conn.cursor()
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            telegram_id INTEGER PRIMARY KEY,
            balance REAL DEFAULT 0.0
        )''')
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS skins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            image_url TEXT,
            available BOOLEAN DEFAULT 1
        )''')
        
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS rentals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            skin_id INTEGER,
            rent_time DATETIME DEFAULT CURRENT_TIMESTAMP,
            return_time DATETIME,
            FOREIGN KEY(user_id) REFERENCES users(telegram_id),
            FOREIGN KEY(skin_id) REFERENCES skins(id)
        )''')
        conn.commit()

def get_balance(telegram_id):
    with closing(sqlite3.connect(DB_NAME)) as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT balance FROM users WHERE telegram_id = ?', (telegram_id,))
        result = cursor.fetchone()
        return result[0] if result else 0.0

def update_balance(telegram_id, amount):
    with closing(sqlite3.connect(DB_NAME)) as conn:
        cursor = conn.cursor()
        cursor.execute('''
        INSERT OR IGNORE INTO users (telegram_id, balance) VALUES (?, 0)
        ''', (telegram_id,))
        cursor.execute('''
        UPDATE users SET balance = balance + ? WHERE telegram_id = ?
        ''', (amount, telegram_id))
        conn.commit()

def get_available_skins():
    with closing(sqlite3.connect(DB_NAME)) as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM skins WHERE available = 1')
        return cursor.fetchall()

def rent_skin(telegram_id, skin_id):
    with closing(sqlite3.connect(DB_NAME)) as conn:
        cursor = conn.cursor()
        # Проверка баланса и стоимости
        cursor.execute('SELECT price FROM skins WHERE id = ?', (skin_id,))
        price = cursor.fetchone()[0]
        balance = get_balance(telegram_id)
        
        if balance >= price:
            # Снимаем деньги
            update_balance(telegram_id, -price)
            
            # Арендуем скин
            cursor.execute('''
            INSERT INTO rentals (user_id, skin_id) VALUES (?, ?)
            ''', (telegram_id, skin_id))
            
            # Помечаем скин как недоступный
            cursor.execute('UPDATE skins SET available = 0 WHERE id = ?', (skin_id,))
            conn.commit()
            return True
        return False

# Инициализация БД при импорте
init_db()