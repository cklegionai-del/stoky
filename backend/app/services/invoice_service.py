from datetime import datetime
from typing import List, Optional, Dict
from decimal import Decimal
from ..models import Invoice, InvoiceItem, Customer, Product
from ..database import db

def create_invoice(
    customer_id: int,
    items: List[Dict[str, int]],
    due_date: Optional[datetime] = None,
    notes: Optional[str] = None
) -> Invoice:
    """Create a new invoice with items and calculate totals.
    
    Args:
        customer_id: ID of the customer being invoiced
        items: List of dicts with 'product_id' and 'quantity'
        due_date: Optional due date (defaults to 30 days from now)
        notes: Optional invoice notes
        
    Returns:
        The created Invoice record
        
    Raises:
        ValueError: If customer doesn't exist or items are invalid
    """
    # Validate customer exists
    customer = Customer.query.get(customer_id)
    if not customer:
        raise ValueError(f"Customer {customer_id} not found")

    # Set default due date if not provided
    if not due_date:
        due_date = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
    # Create invoice base record
    invoice = Invoice(
        customer_id=customer_id,
        date=datetime.utcnow(),
        due_date=due_date,
        notes=notes,
        subtotal=Decimal('0'),
        tax=Decimal('0'),
        total=Decimal('0')
    )
    db.session.add(invoice)
    db.session.flush()  # Get invoice ID for items
    
    # Process each item
    for item_data in items:
        product_id = item_data['product_id']
        quantity = item_data['quantity']
        
        product = Product.query.get(product_id)
        if not product:
            raise ValueError(f"Product {product_id} not found")
            
        if quantity <= 0:
            raise ValueError(f"Invalid quantity {quantity} for product {product_id}")
            
        # Calculate line total
        line_total = product.price * Decimal(str(quantity))
        
        # Create invoice item
        invoice_item = InvoiceItem(
            invoice_id=invoice.id,
            product_id=product_id,
            quantity=quantity,
            unit_price=product.price,
            line_total=line_total
        )
        db.session.add(invoice_item)
        
        # Update invoice totals
        invoice.subtotal += line_total
    
    # Calculate tax and total (example: 10% tax)
    invoice.tax = invoice.subtotal * Decimal('0.10')
    invoice.total = invoice.subtotal + invoice.tax
    
    db.session.commit()
    return invoice

def get_invoice(invoice_id: int) -> Optional[Invoice]:
    """Get an invoice by ID."""
    return Invoice.query.get(invoice_id)

def get_invoice_with_items(invoice_id: int) -> Optional[Dict]:
    """Get an invoice with its items as a dictionary."""
    invoice = get_invoice(invoice_id)
    if not invoice:
        return None
        
    items = [
        {
            'product_id': item.product_id,
            'product_name': item.product.name if item.product else '',
            'quantity': item.quantity,
            'unit_price': float(item.unit_price),
            'line_total': float(item.line_total)
        }
        for item in invoice.items
    ]
    
    return {
        'invoice_id': invoice.id,
        'customer_id': invoice.customer_id,
        'date': invoice.date.isoformat(),
        'due_date': invoice.due_date.isoformat(),
        'subtotal': float(invoice.subtotal),
        'tax': float(invoice.tax),
        'total': float(invoice.total),
        'notes': invoice.notes,
        'items': items
    }
