const path       = require('path');
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const basicAuth  = require('express-basic-auth'); 
const authRoutes = require('./routes/auth');
const dealsRoutes= require('./routes/deals');  
const historyRoutes = require('./routes/history');
const profileRoutes = require('./routes/profile');
const supportRoutes = require('./routes/support');
const chatRouter = require('./routes/chat');

require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api', historyRoutes);
app.use('/api', profileRoutes);
app.use('/api', supportRoutes);
app.use('/api/admin', require('./routes/admin'));
app.use('/api/chat', chatRouter);

app.use('/admin.html', basicAuth({
  users: { 'admin': 'mypassword' },  
  challenge: true,
  realm: 'AdminPanel'
}));
app.use('/api/chat', require('./routes/chat'));


const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(publicPath, 'dashboard.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/moneymoo';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
