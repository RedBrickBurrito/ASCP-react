const cors = require('cors');
const app = require('express')();
const { ok } = require('assert');
const bodyParser = require('body-parser');
const crypto = require('crypto');

app.use(cors());

// Argumentos de linea de comandos
var myArgs = process.argv.slice(2);

// Puerto es el primer argumento que se pasa
const port = process.env.PORT || myArgs[0];

// Servidor HTTP
const http = require('http').createServer(app);

// Servidor para socket.io, aquí RECIBIMOS mensajes
// Nos aseguramos que podemos recibir referencias cruzadas
const io = require('socket.io')(http);

io.on('connection', (socket) => {
  console.log('client connected');
  socket.on('disconnect', () => {
    console.log('cliente disconnected');
  });

  socket.on('enviar-mensaje', (msg) => {
    console.log('se recibio un mensaje desde el front', msg);
    socket.emit('Mensaje ASCP', msg);
  });

  socket.on('Mensaje ASCP', (msg) => {
    console.log('se recibio un mensaje desde el back: ', msg);
    socket.broadcast.emit('recibir-mensaje', msg);
  });

  socket.on('test', (msg) => {
    console.log('se recibio el mensaje en test: ', msg);
  });
});

// Cliente
const ioc = require('socket.io-client');

// Se usa para ENVIAR mensajes
var socketOut = null;
var key = null;

// Funcion para encriptar
const encodeDesECB = (textToEncode, keyString) => {
  if (keyString === null) return textToEncode;

  var keyBuffer = Buffer.from(keyString);

  var cipher = crypto.createCipheriv('des-ecb', keyBuffer, '');

  var c = cipher.update(textToEncode, 'utf8', 'base64');
  c += cipher.final('base64');

  return c;
};

// Permitimos JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

// Conectar a otro host
app.get('/conectar', (req, res) => {
  socketOut = ioc.connect(req.query.host);
  console.log(socketOut);
  res.send('Host ' + req.query.host);
});

// Enviar mensaje al host al que se encuentra conectado
// Recibir llave para protocolo diffie helman
app.post('/enviar_mensaje', (req, res) => {
  if (req.body.function === 1) {
    const message = encodeDesECB(req.body.data, key);
    console.log('mensaje sin encriptar ', req.body.data);
    console.log('mensaje encriptado ', message);
    res.status(200).send('Mensaje: ' + message);
    socketOut.emit('Mensaje ASCP', {
      function: req.body.function,
      data: message,
    });
  } else if (req.body.function === 2) {
    key = req.body.data;
    console.log('llave ', key);
    res.send('Llave: ' + req.body.data);
  }
});

// Escuchar en el puerto especificado en la línea de comandos
http.listen(port, () => {
  console.log(`Escuchando en http://localhost:${port}/`);
});
