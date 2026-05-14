from flask import Blueprint, jsonify
from datetime import datetime, timedelta
from sqlalchemy import func, extract, and_
from ..models import Product, Invoice, InvoiceItem
from ..database import db
from ..services import stock_service

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/kpis', methods=['GET'])
def get_kpis():
    """Get key performance indicators for the dashboard."""
    
    # Total products count
    total_products = db.session.query(func.count(Product.id)).scalar()
    
    # Inventory alerts (products below 10 units)
    low_stock_count = db.session.query(func.count(Product.id))\
        .filter(Product.quantity < 10)\
        .scalar()
    
    # Current month revenue
    current_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_revenue = db.session.query(func.sum(Invoice.total))\
        .filter(Invoice.date >= current_month)\
        .scalar() or 0
    
    # Total invoices count
    total_invoices = db.session.query(func.count(Invoice.id)).scalar()
    
    return jsonify({
        'total_products': total_products,
        'low_stock_alerts': low_stock_count,
        'monthly_revenue': float(monthly_revenue),
        'total_invoices': total_invoices
    })

@dashboard_bp.route('/top-products', methods=['GET'])
def get_top_products():
    """Get top 5 products by sales volume and revenue."""
    
    # Top by quantity sold
    top_by_quantity = db.session.query(
        Product.name,
        func.sum(InvoiceItem.quantity).label('total_sold')
    ).join(InvoiceItem, Product.id == InvoiceItem.product_id)\
     .group_by(Product.id)\
     .order_by(func.sum(InvoiceItem.quantity).desc())\
     .limit(5)\
     .all()
    
    # Top by revenue
    top_by_revenue = db.session.query(
        Product.name,
        func.sum(InvoiceItem.line_total).label('total_revenue')
    ).join(InvoiceItem, Product.id == InvoiceItem.product_id)\
     .group_by(Product.id)\
     .order_by(func.sum(InvoiceItem.line_total).desc())\
     .limit(5)\
     .all()
    
    return jsonify({
        'by_quantity': [{'name': name, 'total': total} for name, total in top_by_quantity],
        'by_revenue': [{'name': name, 'total': float(total)} for name, total in top_by_revenue]
    })

@dashboard_bp.route('/sales-trends', methods=['GET'])
def get_sales_trends():
    """Get sales data for charts - last 12 months revenue."""
    
    twelve_months_ago = datetime.now() - timedelta(days=365)
    
    monthly_sales = db.session.query(
        extract('year', Invoice.date).label('year'),
        extract('month', Invoice.date).label('month'),
        func.sum(Invoice.total).label('total')
    ).filter(Invoice.date >= twelve_months_ago)\
     .group_by('year', 'month')\
     .order_by('year', 'month')\
     .all()
    
    # Format as {month: 'MM-YYYY', revenue: float}
    formatted_sales = [
        {
            'month': f"{int(row.month):02d}-{int(row.year)}",
            'revenue': float(row.total or 0)
        }
        for row in monthly_sales
    ]
    
    return jsonify(formatted_sales)

@dashboard_bp.route('/inventory-alerts', methods=['GET'])
def get_inventory_alerts():
    """Get products with low stock levels."""
    
    low_stock_products = Product.query\
        .filter(Product.quantity < 10)\
        .order_by(Product.quantity.asc())\
        .limit(10)\
        .all()
    
    alerts = []
    for product in low_stock_products:
        history = stock_service.get_product_stock_history(product.id, limit=5)
        alerts.append({
            'product_id': product.id,
            'product_name': product.name,
            'current_stock': product.quantity,
            'recent_movements': [
                {
                    'date': movement.created_at.strftime('%Y-%m-%d'),
                    'quantity': movement.quantity,
                    'type': movement.movement_type
                }
                for movement in history
            ]
        })
    
    return jsonify(alerts)
