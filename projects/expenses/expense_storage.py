"""Expense Receipt Storage Module - SQLite CRUD operations."""
import sqlite3
import json
import uuid
import os
from datetime import datetime
from typing import Dict, List, Optional, Any

# Database path
DB_PATH = os.path.expanduser("~/projects/bim/expenses/receipts.db")


def get_db_connection() -> sqlite3.Connection:
    """Get database connection with row factory."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Initialize the database with receipts table."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS receipts (
            id TEXT PRIMARY KEY,
            receipt_number TEXT,
            date TEXT NOT NULL,
            vendor TEXT,
            description TEXT,
            original_amount REAL NOT NULL,
            original_currency TEXT NOT NULL,
            fx_rate REAL NOT NULL,
            amount_eur REAL NOT NULL,
            category TEXT NOT NULL,
            image_path TEXT,
            month_key TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            edit_history TEXT
        )
    """)
    
    # Create indexes for common queries
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_month ON receipts(month_key)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_status ON receipts(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_category ON receipts(category)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_date ON receipts(date)")
    
    conn.commit()
    conn.close()


def generate_id() -> str:
    """Generate a unique receipt ID."""
    return f"RZE-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"


def _row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    """Convert SQLite row to dictionary."""
    result = dict(row)
    # Parse edit_history JSON if present
    if result.get('edit_history'):
        try:
            result['edit_history'] = json.loads(result['edit_history'])
        except json.JSONDecodeError:
            result['edit_history'] = []
    else:
        result['edit_history'] = []
    return result


def store_receipt(receipt: Dict[str, Any]) -> Dict[str, Any]:
    """Store a new receipt in the database.
    
    Args:
        receipt: Dictionary with receipt data
        
    Returns:
        Stored receipt with generated ID
    """
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Generate ID if not provided
    receipt_id = receipt.get('id') or generate_id()
    
    # Extract month_key from date
    date_str = receipt['date']
    month_key = date_str[:7]  # YYYY-MM
    
    now = datetime.now().isoformat()
    
    cursor.execute("""
        INSERT INTO receipts (
            id, receipt_number, date, vendor, description,
            original_amount, original_currency, fx_rate, amount_eur,
            category, image_path, month_key, status,
            created_at, updated_at, edit_history
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        receipt_id,
        receipt.get('receipt_number', ''),
        date_str,
        receipt.get('vendor', ''),
        receipt.get('description', ''),
        receipt['original_amount'],
        receipt['original_currency'],
        receipt['fx_rate'],
        receipt['amount_eur'],
        receipt['category'],
        receipt.get('image_path', ''),
        month_key,
        'active',
        now,
        now,
        json.dumps([{"action": "created", "timestamp": now}])
    ))
    
    conn.commit()
    conn.close()
    
    return get_receipt_by_id(receipt_id)


def get_receipt_by_id(receipt_id: str) -> Optional[Dict[str, Any]]:
    """Get a receipt by its ID.
    
    Args:
        receipt_id: The receipt ID
        
    Returns:
        Receipt dictionary or None if not found
    """
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM receipts WHERE id = ?", (receipt_id,))
    row = cursor.fetchone()
    conn.close()
    
    return _row_to_dict(row) if row else None


def get_receipts_by_month(month_key: str, status: str = 'active') -> List[Dict[str, Any]]:
    """Get all receipts for a specific month.
    
    Args:
        month_key: Month in YYYY-MM format
        status: Filter by status ('active', 'deleted', or 'all')
        
    Returns:
        List of receipt dictionaries sorted by date
    """
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if status == 'all':
        cursor.execute(
            "SELECT * FROM receipts WHERE month_key = ? ORDER BY date ASC",
            (month_key,)
        )
    else:
        cursor.execute(
            "SELECT * FROM receipts WHERE month_key = ? AND status = ? ORDER BY date ASC",
            (month_key, status)
        )
    
    rows = cursor.fetchall()
    conn.close()
    
    return [_row_to_dict(row) for row in rows]


def search_receipts(month_key: Optional[str] = None, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Search receipts with filters.
    
    Args:
        month_key: Optional month filter (YYYY-MM)
        filters: Dictionary of filter criteria (category, vendor, description, status)
        
    Returns:
        List of matching receipt dictionaries
    """
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    filters = filters or {}
    conditions = []
    params = []
    
    if month_key:
        conditions.append("month_key = ?")
        params.append(month_key)
    
    if 'category' in filters:
        conditions.append("category = ?")
        params.append(filters['category'])
    
    if 'vendor' in filters:
        conditions.append("vendor LIKE ?")
        params.append(f"%{filters['vendor']}%")
    
    if 'description' in filters:
        conditions.append("description LIKE ?")
        params.append(f"%{filters['description']}%")
    
    if 'status' in filters:
        conditions.append("status = ?")
        params.append(filters['status'])
    else:
        conditions.append("status = 'active'")
    
    query = "SELECT * FROM receipts"
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += " ORDER BY date ASC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [_row_to_dict(row) for row in rows]


def get_month_summary(month_key: str) -> Dict[str, Any]:
    """Get summary statistics for a month.
    
    Args:
        month_key: Month in YYYY-MM format
        
    Returns:
        Dictionary with summary data
    """
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get counts and totals by category
    cursor.execute("""
        SELECT 
            category,
            COUNT(*) as count,
            SUM(amount_eur) as total_eur,
            SUM(original_amount) as total_original,
            original_currency
        FROM receipts 
        WHERE month_key = ? AND status = 'active'
        GROUP BY category, original_currency
    """, (month_key,))
    
    category_rows = cursor.fetchall()
    
    # Get overall totals
    cursor.execute("""
        SELECT 
            COUNT(*) as total_count,
            SUM(amount_eur) as total_eur
        FROM receipts 
        WHERE month_key = ? AND status = 'active'
    """, (month_key,))
    
    total_row = cursor.fetchone()
    conn.close()
    
    categories = {}
    for row in category_rows:
        categories[row['category']] = {
            'count': row['count'],
            'total_eur': round(row['total_eur'], 2),
            'total_original': round(row['total_original'], 2),
            'currency': row['original_currency']
        }
    
    return {
        'month_key': month_key,
        'total_count': total_row['total_count'] or 0,
        'total_eur': round(total_row['total_eur'] or 0, 2),
        'by_category': categories
    }


def list_months() -> List[str]:
    """Get list of all months that have receipts.
    
    Returns:
        List of month keys (YYYY-MM) sorted descending
    """
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT DISTINCT month_key 
        FROM receipts 
        ORDER BY month_key DESC
    """)
    
    rows = cursor.fetchall()
    conn.close()
    
    return [row['month_key'] for row in rows]


def update_receipt(receipt_id: str, fields: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update a receipt's fields.
    
    Args:
        receipt_id: The receipt ID
        fields: Dictionary of fields to update
        
    Returns:
        Updated receipt dictionary or None if not found
    """
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if receipt exists
    cursor.execute("SELECT * FROM receipts WHERE id = ?", (receipt_id,))
    if not cursor.fetchone():
        conn.close()
        return None
    
    # Build update query
    allowed_fields = [
        'receipt_number', 'date', 'vendor', 'description',
        'original_amount', 'original_currency', 'fx_rate', 'amount_eur',
        'category', 'image_path', 'status'
    ]
    
    updates = []
    params = []
    edit_log = []
    
    for field, value in fields.items():
        if field in allowed_fields:
            updates.append(f"{field} = ?")
            params.append(value)
            edit_log.append({"field": field, "new_value": value})
    
    if not updates:
        conn.close()
        return get_receipt_by_id(receipt_id)
    
    # Update month_key if date changed
    if 'date' in fields:
        month_key = fields['date'][:7]
        updates.append("month_key = ?")
        params.append(month_key)
    
    # Add updated_at and edit_history
    now = datetime.now().isoformat()
    updates.append("updated_at = ?")
    params.append(now)
    
    # Get existing edit history and append
    cursor.execute("SELECT edit_history FROM receipts WHERE id = ?", (receipt_id,))
    row = cursor.fetchone()
    history = []
    if row and row['edit_history']:
        try:
            history = json.loads(row['edit_history'])
        except json.JSONDecodeError:
            pass
    
    history.append({
        "action": "updated",
        "timestamp": now,
        "changes": edit_log
    })
    
    updates.append("edit_history = ?")
    params.append(json.dumps(history))
    
    # Add receipt_id to params
    params.append(receipt_id)
    
    query = f"UPDATE receipts SET {', '.join(updates)} WHERE id = ?"
    cursor.execute(query, params)
    conn.commit()
    conn.close()
    
    return get_receipt_by_id(receipt_id)


def soft_delete_receipt(receipt_id: str) -> Optional[Dict[str, Any]]:
    """Soft delete a receipt (mark as deleted).
    
    Args:
        receipt_id: The receipt ID
        
    Returns:
        Updated receipt dictionary or None if not found
    """
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM receipts WHERE id = ?", (receipt_id,))
    if not cursor.fetchone():
        conn.close()
        return None
    
    now = datetime.now().isoformat()
    
    # Get existing edit history
    cursor.execute("SELECT edit_history FROM receipts WHERE id = ?", (receipt_id,))
    row = cursor.fetchone()
    history = []
    if row and row['edit_history']:
        try:
            history = json.loads(row['edit_history'])
        except json.JSONDecodeError:
            pass
    
    history.append({"action": "soft_deleted", "timestamp": now})
    
    cursor.execute("""
        UPDATE receipts 
        SET status = 'deleted', updated_at = ?, edit_history = ?
        WHERE id = ?
    """, (now, json.dumps(history), receipt_id))
    
    conn.commit()
    conn.close()
    
    return get_receipt_by_id(receipt_id)


def undo_delete_receipt(receipt_id: str) -> Optional[Dict[str, Any]]:
    """Restore a soft-deleted receipt.
    
    Args:
        receipt_id: The receipt ID
        
    Returns:
        Updated receipt dictionary or None if not found
    """
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM receipts WHERE id = ?", (receipt_id,))
    if not cursor.fetchone():
        conn.close()
        return None
    
    now = datetime.now().isoformat()
    
    # Get existing edit history
    cursor.execute("SELECT edit_history FROM receipts WHERE id = ?", (receipt_id,))
    row = cursor.fetchone()
    history = []
    if row and row['edit_history']:
        try:
            history = json.loads(row['edit_history'])
        except json.JSONDecodeError:
            pass
    
    history.append({"action": "restored", "timestamp": now})
    
    cursor.execute("""
        UPDATE receipts 
        SET status = 'active', updated_at = ?, edit_history = ?
        WHERE id = ?
    """, (now, json.dumps(history), receipt_id))
    
    conn.commit()
    conn.close()
    
    return get_receipt_by_id(receipt_id)


def hard_delete_receipt(receipt_id: str) -> bool:
    """Permanently delete a receipt.
    
    Args:
        receipt_id: The receipt ID
        
    Returns:
        True if deleted, False if not found
    """
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("DELETE FROM receipts WHERE id = ?", (receipt_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    
    return deleted


if __name__ == "__main__":
    # Quick test
    init_db()
    # Database initialized


import sys
import json

import sys
import json

if __name__ == "__main__":
    from datetime import datetime
    
    init_db()
    
    if len(sys.argv) < 2:
        print("Usage: expense_storage.py <command> [args]")
        sys.exit(0)
    
    cmd = sys.argv[1]
    
    if cmd == "list":
        month = sys.argv[2] if len(sys.argv) > 2 else datetime.now().strftime("%Y-%m")
        receipts = get_receipts_by_month(month)
        print(json.dumps(receipts, default=str))
    
    elif cmd == "add":
        if len(sys.argv) < 3:
            print("Usage: expense_storage.py add <json>")
            sys.exit(1)
        data = json.loads(sys.argv[2])
        stored = store_receipt(data)
        print(json.dumps(stored, default=str))
    
    elif cmd == "get":
        if len(sys.argv) < 3:
            print("Usage: expense_storage.py get <id>")
            sys.exit(1)
        receipt = get_receipt_by_id(sys.argv[2])
        print(json.dumps(receipt, default=str))
    
    elif cmd == "delete":
        if len(sys.argv) < 3:
            print("Usage: expense_storage.py delete <id>")
            sys.exit(1)
        result = soft_delete_receipt(sys.argv[2])
        print(json.dumps({"deleted": result}, default=str))
    
    elif cmd == "update":
        if len(sys.argv) < 4:
            print("Usage: expense_storage.py update <id> <json_fields>")
            sys.exit(1)
        fields = json.loads(sys.argv[3])
        updated = update_receipt(sys.argv[2], fields)
        print(json.dumps(updated, default=str))
    
    else:
        print(f"Unknown command: {cmd}")
        print("Commands: list, add, get, delete, update")
