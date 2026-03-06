import express from 'express';
import dotenv from 'dotenv';
import messageRoutes from './routes/messageRoutes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Message service is running successfully');
});

app.use('/api/messages', messageRoutes);

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
