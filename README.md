# Farm-to-Market Connect (Agritech Platform)

Nigeria's premium farm-to-market marketplace connecting smallholder farmers with buyers.

## Tech Stack
- Node.js, Express, MongoDB (Mongoose)
- Pure HTML5, CSS3, Vanilla JavaScript
- JWT auth, Helmet, rate limiting, mongo-sanitize

## Setup
\\\powershell
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run seed
npm run dev
\\\
Open http://localhost:5000

## Demo Accounts
- Admin: admin@farmconnect.ng / Admin@1234
- Farmer: ibrahim@farmconnect.ng / Farmer@1234
- Buyer: buyer@farmconnect.ng / Buyer@1234

## API Overview
- Auth: /api/auth/{register,login,me,profile,password}
- Produce: /api/produce (GET, POST, PUT, DELETE)
- Categories: /api/categories
- Market Prices: /api/market-prices
- Enquiries: /api/enquiries
- Favorites: /api/favorites
- Notifications: /api/notifications
- Admin: /api/admin/*
- Health: /api/health

## Render Deployment
1. Push to GitHub
2. Create MongoDB Atlas cluster, allow network 0.0.0.0/0
3. Render → New Web Service → connect repo
4. Build: \
pm install\, Start: \
pm start\
5. Environment: NODE_ENV=production, PORT=auto, MONGODB_URI, JWT_SECRET, CLIENT_URL
6. Deploy. Verify /api/health.

## Security
- Bcrypt password hashing, JWT, Helmet, rate limiting, mongo-sanitize, role guards
- Secrets in .env, never committed

## Architecture
MVC: models / controllers / routes / middleware / utils / public frontend.
