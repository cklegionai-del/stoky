from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle
from reportlab.lib import colors
from typing import Dict

def generate_invoice_pdf(invoice_data: Dict) -> BytesIO:
    """Generate a PDF invoice from invoice data."""
    
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []
    
    # Add invoice header
    story.append(Paragraph("INVOICE", styles['Heading1']))
    story.append(Paragraph(f"Invoice #: {invoice_data['invoice_id']}", styles['Normal']))
    story.append(Paragraph(f"Date: {invoice_data['date']}", styles['Normal']))
    story.append(Paragraph(f"Due Date: {invoice_data['due_date']}", styles['Normal']))
    story.append(Paragraph(" ", styles['Normal']))  # Spacer
    
    # Add invoice items table
    items_data = [
        ["Product", "Quantity", "Unit Price", "Total"]
    ]
    for item in invoice_data['items']:
        items_data.append([
            item['product_name'],
            str(item['quantity']),
            f"${item['unit_price']:.2f}",
            f"${item['line_total']:.2f}"
        ])
    
    items_table = Table(items_data, colWidths=[250, 75, 100, 100])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    story.append(items_table)
    story.append(Paragraph(" ", styles['Normal']))  # Spacer
    
    # Add totals
    totals_data = [
        ["Subtotal:", f"${invoice_data['subtotal']:.2f}"],
        ["Tax (10%):", f"${invoice_data['tax']:.2f}"],
        ["Total:", f"${invoice_data['total']:.2f}"]
    ]
    
    totals_table = Table(totals_data, colWidths=[400, 100])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('FONTNAME', (0, -1), (1, -1), 'Helvetica-Bold')
    ]))
    story.append(totals_table)
    
    doc.build(story)
    buffer.seek(0)
    return buffer
