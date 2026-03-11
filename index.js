import express from 'express';
import dotenv from 'dotenv';
import messageRoutes from './routes/messageRoutes.js';
import userRoutes from './routes/userRoutes.js'
import raRoutes from './routes/raRoutes.js'
import MsgLogRoutes from './routes/msgLogRoutes.js'
import db from "./config/db.js"

dotenv.config();
db();
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Message service is running successfully');
});

app.use('/api/messages', messageRoutes);
app.use('/api/auth', userRoutes);
app.use('/api/auth', raRoutes);
app.use('/api/msglog',MsgLogRoutes);
app.get("/",(req,res)=>{
  res.send("app is running successfully");
})
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
