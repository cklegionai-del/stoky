from datetime import datetime
from typing import Optional
from ..models import StockMovement, Product
from ..database import db

def record_stock_movement(
    product_id: int, 
    quantity: int, 
    movement_type: str, 
    notes: Optional[str] = None
) -> StockMovement:
    """Record a stock movement (in or out) and update product quantity.
    
    Args:
        product_id: ID of the product being moved
        quantity: Number of units (positive for inbound, negative for outbound)
        movement_type: Type of movement ('purchase', 'sale', 'return', etc.)
        notes: Optional notes about the movement
        
    Returns:
        The created StockMovement record
        
    Raises:
        ValueError: If quantity would make stock negative
    """
    # Get product with pessimistic lock to prevent concurrent updates
    product = Product.query.with_for_update().get(product_id)
    if not product:
        raise ValueError(f"Product {product_id} not found")

    # Validate stock level won't go negative
    new_quantity = product.quantity + quantity
    if new_quantity < 0:
        raise ValueError(f"Insufficient stock. Current: {product.quantity}, Attempted change: {quantity}")

    # Create movement record
    movement = StockMovement(
        product_id=product_id,
        quantity=quantity,
        movement_type=movement_type,
        notes=notes,
        created_at=datetime.utcnow()
    )
    
    # Update product quantity
    product.quantity = new_quantity
    
    db.session.add(movement)
    db.session.add(product)
    db.session.commit()
    
    return movement

def get_product_stock_history(product_id: int, limit: int = 100) -> list[StockMovement]:
    """Get recent stock movement history for a product.
    
    Args:
        product_id: ID of the product
        limit: Maximum number of records to return
        
    Returns:
        List of StockMovement records ordered newest first
    """
    return (
        StockMovement.query
        .filter_by(product_id=product_id)
        .order_by(StockMovement.created_at.desc())
        .limit(limit)
        .all()
    )

def get_current_stock_level(product_id: int) -> int:
    """Get current stock level for a product.
    
    Args:
        product_id: ID of the product
        
    Returns:
        Current quantity in stock (0 if product not found)
    """
    product = Product.query.get(product_id)
    return product.quantity if product else 0
