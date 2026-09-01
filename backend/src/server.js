const express = require('express');
const app = express();
const PORT = 5000;

// Middleware to parse JSON requests
app.use(express.json());

app.get ('/', (req, res) => {
  res.json({'message': 'Hello, World!'});
});
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});