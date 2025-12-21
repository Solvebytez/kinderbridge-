# Daycare Concierge Backend

## 🗄️ MongoDB Setup Instructions

### 1. **Install Dependencies**
```bash
npm install
```

### 2. **Set Up MongoDB Atlas**
- Your cluster is already created: `ASHITCONSULTING`
- Database: `daycare_concierge`
- Collections: `daycares`, `users`, `messages`, `favorites`

### 3. **Run Database Setup Script**
```bash
node setup-mongodb.js
```

This will:
- ✅ Connect to your MongoDB Atlas cluster
- ✅ Create the database and collections
- ✅ Insert sample daycare data
- ✅ Create performance indexes
- ✅ Test the connection

### 4. **Start the Server**
```bash
npm run dev
```

## 🔧 **Configuration**

Your MongoDB connection is configured in `config.env`:
- **URI**: `mongodb+srv://ashvaksheik:x1AN2mXixKFKzKdM@ashitconsulting.it8rdg.mongodb.net/daycare_concierge`
- **Database**: `daycare_concierge`
- **Port**: `5000`

## 📊 **API Endpoints**

- `GET /api/daycares` - Get all daycares
- `GET /api/daycares/search` - Search with filters
- `GET /api/daycares/:id` - Get specific daycare
- `GET /api/daycares/locations/all` - Get all cities
- `GET /api/daycares/stats/overview` - Get statistics

## 🚀 **Features**

- **MongoDB Integration**: Real database instead of static JSON
- **Advanced Search**: Full-text search with filters
- **Performance**: Optimized indexes for fast queries
- **Scalable**: Ready for production use

## 🔍 **Sample Data**

The setup script includes 5 sample daycares with:
- Complete information (name, city, price, rating, features)
- Age ranges and availability options
- Contact details and descriptions
- Security and certification info
