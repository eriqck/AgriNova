# API Examples

Base URL: `http://localhost:4000/api/v1`

## Register Farmer

`POST /users/register`

```json
{
  "fullName": "Jane Wanjiku",
  "phone": "+254712345678",
  "email": "jane@example.com",
  "password": "StrongPassword123!",
  "role": "FARMER",
  "county": "Kiambu",
  "subCounty": "Limuru"
}
```

## Login

`POST /users/login`

```json
{
  "phone": "+254712345678",
  "password": "StrongPassword123!"
}
```

Use the returned token as:

`Authorization: Bearer <jwt>`

## Create Farm

`POST /farms`

```json
{
  "farmName": "Wanjiku Fresh Produce",
  "county": "Kiambu",
  "subCounty": "Limuru",
  "village": "Bibirioni",
  "acreage": 4.5,
  "soilType": "Loam",
  "latitude": -1.1123456,
  "longitude": 36.654321
}
```

## Create Product

`POST /products`

```json
{
  "name": "Capsicum",
  "category": "Vegetable",
  "unitOfMeasure": "crate",
  "description": "Green capsicum for wholesale buyers"
}
```

## Create Listing

`POST /listings`

```json
{
  "farmId": 1,
  "productId": 1,
  "title": "Grade A Maize - 3 Tons",
  "description": "Dry maize stored after harvest",
  "quantityAvailable": 3000,
  "unit": "kg",
  "pricePerUnit": 42,
  "minimumOrderQuantity": 500,
  "qualityGrade": "Grade A",
  "harvestDate": "2026-03-12",
  "availableFrom": "2026-03-28",
  "availableUntil": "2026-04-20",
  "status": "ACTIVE"
}
```

## Place Order

`POST /orders`

```json
{
  "listingId": 1,
  "quantity": 1000,
  "deliveryAddress": "Westlands, Nairobi",
  "deliveryNotes": "Deliver between 8am and 3pm"
}
```

## Initialize Payment

`POST /payments/initialize`

The backend calculates the amount from the order record.

```json
{
  "orderId": 1,
  "provider": "PAYSTACK",
  "metadata": {
    "buyerEmail": "buyer@example.com"
  }
}
```

## List Membership Plans

`GET /membership-plans`

## Create Membership Signup

`POST /memberships`

```json
{
  "planCode": "PRO_FARMER"
}
```

## Initialize Membership Payment

`POST /memberships/12/initialize-payment`

```json
{
  "callbackUrl": "http://localhost:3000/membership/callback"
}
```

## Verify Membership Payment

`GET /memberships/payments/verify/MEM-12-1234567890`

## Verify Payment

`GET /payments/verify/PAY-1-1234567890`

## Assign Delivery

`POST /deliveries`

```json
{
  "orderId": 1,
  "transporterName": "Kamau Logistics",
  "transporterPhone": "+254700111222",
  "vehicleRegistration": "KDA 123X",
  "pickupLocation": "Limuru, Kiambu",
  "dropoffLocation": "Westlands, Nairobi",
  "notes": "Handle bags carefully"
}
```

## Move Delivery To Delivered

`PATCH /deliveries/1/status`

```json
{
  "status": "DELIVERED"
}
```
