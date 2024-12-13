from flask import Flask, render_template, request, jsonify
import os
import sqlite3
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DATABASE = 'tax_tracker.db'


# Database Connection
def get_db_connection():
    print(f"Connecting to database: {DATABASE}")
    full_path = os.path.abspath(DATABASE)
    print("Database full path:", full_path)  # Debugging
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


# Serve Frontend
@app.route('/')
def welcome():
    return render_template('welcome.html')


@app.route('/addentry')
def payment_page():
    return render_template('add_tax_record.html')


@app.route('/editentry')
def dashboard():
    return render_template('edit_delete_record.html')


@app.route('/filterpayments')
def filter_payment_page():
    return render_template('filter_payments.html')

# API Endpoints

# Insert a new record
@app.route('/api/records', methods=['POST'])
def insert_record():
    data = request.json
    print("Received Data:", data)  # Debugging
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO payments (company, amount, payment_date, status, due_date)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['company'], data['amount'], data['payment_date'], data['status'], data['due_date']))
        conn.commit()
        conn.close()
        return jsonify({"message": "Record inserted successfully."}), 201
    except sqlite3.Error as e:
        print("SQLite error:", e)
        return jsonify({"error": str(e)}), 500


# Get all records
@app.route('/api/records', methods=['GET'])
def get_records():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM payments")
    records = cursor.fetchall()
    conn.close()
    return jsonify([dict(row) for row in records])


# Get a specific record by ID
@app.route('/api/records/<int:id>', methods=['GET'])
def get_record(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM payments WHERE id = ?", (id,))
        record = cursor.fetchone()
        conn.close()
        if record:
            return jsonify(dict(record)), 200
        return jsonify({"error": "Record not found"}), 404
    except Exception as e:
        print("Error occurred:", str(e))
        return jsonify({"error": str(e)}), 500


# Update a record
@app.route('/api/records/<int:id>', methods=['PUT'])
def update_record(id):
    try:
        data = request.json
        if not all(key in data for key in ['amount', 'payment_date', 'due_date']):
            return jsonify({"error": "Missing required fields"}), 400
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE payments
            SET amount = ?, payment_date = ?, due_date = ?
            WHERE id = ?
        ''', (data['amount'], data['payment_date'], data['due_date'], id))
        conn.commit()
        conn.close()
        return jsonify({"message": "Record updated successfully."}), 200
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": "An error occurred while updating the record"}), 500


# Delete a record
@app.route('/api/records/<int:id>', methods=['DELETE'])
def delete_record(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM payments WHERE id = ?", (id,))
        conn.commit()
        conn.close()
        if cursor.rowcount == 0:
            return jsonify({"error": "Record not found"}), 404
        return jsonify({"message": "Record deleted successfully."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Get all payments or filter by due date
@app.route('/api/payments', methods=['GET'])
def get_payments():
    due_date = request.args.get('due_date')
    conn = get_db_connection()
    if due_date:
        payments = conn.execute('SELECT * FROM payments WHERE due_date = ?', (due_date,)).fetchall()
    else:
        payments = conn.execute('SELECT * FROM payments').fetchall()
    conn.close()
    return jsonify([dict(payment) for payment in payments])


# Run the application
if __name__ == '__main__':
    app.run(debug=True)
