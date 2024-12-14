from flask import Flask, render_template, request, jsonify
import os
import sqlite3
from flask_cors import CORS
from database import get_db_connection, create_tables  # Importing from database.py

app = Flask(__name__)
CORS(app)


# Initialize the database on application start.Run table creation logic when the app starts
create_tables()

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
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM payments")
        records = cursor.fetchall()  # Fetch all rows

        # Convert each row to a dictionary manually
        result = [dict(zip([column[0] for column in cursor.description], row)) for row in records]

        conn.close()
        return jsonify(result), 200
    except Exception as e:
        print("Error occurred while fetching records:", str(e))
        return jsonify({"error": str(e)}), 500

@app.route('/api/records/<int:id>', methods=['GET'])
def get_record(id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM payments WHERE id = ?", (id,))
        record = cursor.fetchone()
        conn.close()

        if record:
            # Convert the tuple to a dictionary by mapping column names to their values
            columns = [col[0] for col in cursor.description]
            record_dict = dict(zip(columns, record))
            return jsonify(record_dict), 200

        return jsonify({"error": "Record not found"}), 404
    except Exception as e:
        print("Error occurred:", str(e))
        return jsonify({"error": str(e)}), 500


# Get all payments or filter by due date
@app.route('/api/payments', methods=['GET'])
def get_payments():
    due_date = request.args.get('due_date')
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        if due_date:
            cursor.execute('SELECT * FROM payments WHERE due_date = ?', (due_date,))
        else:
            cursor.execute('SELECT * FROM payments')

        payments = cursor.fetchall()  # Fetch all rows

        # Convert each row to a dictionary
        result = [dict(zip([column[0] for column in cursor.description], row)) for row in payments]

        conn.close()
        return jsonify(result), 200
    except Exception as e:
        print("Error occurred while fetching payments:", str(e))
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


# Run the application
if __name__ == '__main__':
    app.run(debug=True)
