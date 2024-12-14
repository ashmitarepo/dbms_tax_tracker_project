import sqlite3
import os

# Database file name
DATABASE = 'tax_tracker.db'

# Function to create a database connection
def get_db_connection():
    try:
        conn = sqlite3.connect(DATABASE)
        print(f"Connected to database: {DATABASE}")
        return conn
    except sqlite3.Error as e:
        print(f"Error connecting to database: {e}")
        return None

# Function to check if a table exists
def table_exists(table_name):
    conn = get_db_connection()
    if conn is None:
        return False

    cursor = conn.cursor()
    cursor.execute('''
        SELECT name FROM sqlite_master WHERE type='table' AND name=?
    ''', (table_name,))
    exists = cursor.fetchone() is not None
    conn.close()
    return exists

# Function to create the tables if they don't already exist
def create_tables():
    if table_exists('payments'):
        print("Table 'payments' already exists. Skipping table creation.")
        return

    conn = get_db_connection()
    if conn is None:
        return

    cursor = conn.cursor()

    # Create payments table
    try:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS payments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company TEXT NOT NULL,
                amount REAL NOT NULL,
                payment_date TEXT,
                status TEXT NOT NULL CHECK(status IN ('paid', 'unpaid')),
                due_date DATE NOT NULL
            )
        ''')
        print("Table 'payments' created successfully.")
    except sqlite3.Error as e:
        print(f"Error creating table 'payments': {e}")

    # Commit changes and close connection
    conn.commit()
    conn.close()

# Main function
if __name__ == "__main__":
    # Check and create table if necessary
    create_tables()
