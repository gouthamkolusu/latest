import express from 'express';

const app = express();

app.get('/ping', (req, res) => {
  res.send('pong');
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Test server running on http://localhost:${PORT}`);
});
