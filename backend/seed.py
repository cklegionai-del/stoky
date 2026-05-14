import asyncio
from datetime import datetime
from typing import List, Dict

from app.database import engine, async_session
from app.models.database import Product, StockMovement
from sqlalchemy.ext.asyncio import AsyncSession

PHARMACY_PRODUCTS = [
    {
        "name": "Doliprane 1000mg",
        "description": "Paracetamol 1000mg tablet, pain and fever relief",
        "price": 3.5,
        "cost_price": 2.8,
        "barcode": "3400934765432",
    },
    {
        "name": "Aspégic 500mg",
        "description": "Aspirin 500mg effervescent tablet",
        "price": 6.25,
        "cost_price": 5.0,
        "barcode": "3400934821831",
    },
    {
        "name": "Flagyl 500mg",
        "description": "Metronidazole 500mg tablet, antibiotic",
        "price": 8.75,
        "cost_price": 7.0,
        "barcode": "3400934218765",
    },
    {
        "name": "Augmentin 1g",
        "description": "Amoxicillin + Clavulanic acid, antibiotic",
        "price": 22.5,
        "cost_price": 18.0,
        "barcode": "3400935876543",
    },
    {
        "name": "Smecta",
        "description": "Diosmectite, anti-diarrheal powder",
        "price": 5.8,
        "cost_price": 4.5,
        "barcode": "3400935321456",
    },
    {
        "name": "Efferalgan Vitamin C",
        "description": "Paracetamol + Vitamin C effervescent tablet",
        "price": 7.9,
        "cost_price": 6.2,
        "barcode": "3400936547321",
    },
    {
        "name": "Niflugel 5%",
        "description": "Ibuprofen topical gel for pain relief",
        "price": 15.2,
        "cost_price": 12.0,
        "barcode": "3400937654328",
    },
    {
        "name": "Dexeryl Crème",
        "description": "Emollient cream for dry skin",
        "price": 18.3,
        "cost_price": 14.5,
        "barcode": "3400938765437",
    },
    {
        "name": "Actifed Rhume",
        "description": "Cold and flu syrup",
        "price": 13.5,
        "cost_price": 10.8,
        "barcode": "3400939876546",
    },
    {
        "name": "Gaviscon Menthe",
        "description": "Antacid liquid for heartburn relief",
        "price": 11.9,
        "cost_price": 9.5,
        "barcode": "3400930987657",
    },
]

async def seed_products(session: AsyncSession):
    """Seed pharmacy products with initial stock"""
    
    # Delete existing products first
    await session.execute(Product.__table__.delete())
    
    products: List[Product] = []
    for product_data in PHARMACY_PRODUCTS:
        product = Product(
            name=product_data["name"],
            description=product_data["description"],
            price=product_data["price"],
            cost_price=product_data["cost_price"],
            barcode=product_data["barcode"],
            created_at=datetime.utcnow(),
        )
        products.append(product)
        session.add(product)
    
    await session.commit()
    
    # Add initial stock movements
    for product in products:
        movement = StockMovement(
            product_id=product.id,
            quantity=50,  # Initial stock of 50 units
            movement_type="in",
            movement_date=datetime.utcnow(),
            notes="Initial stock"
        )
        session.add(movement)
    
    await session.commit()
    print(f"Successfully seeded {len(products)} pharmacy products")

async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Product.metadata.create_all)
        await conn.run_sync(StockMovement.metadata.create_all)
    
    async with async_session() as session:
        await seed_products(session)

if __name__ == "__main__":
    asyncio.run(main())
