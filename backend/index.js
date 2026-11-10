'use strict';

const app = require('./app');

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`API escuchando en el puerto ${port}`);
});
