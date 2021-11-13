const cors = require('cors');
const app = require('express')();
const { ok } = require('assert');
const bodyParser = require('body-parser');

app.use(cors());

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

// Argumentos de linea de comandos
var myArgs = process.argv.slice(2);

// Puerto es el primer argumento que se pasa
const port = process.env.PORT || myArgs[0];

// Se usa para ENVIAR mensajes
var socketOut = null;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Permitimos JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

app.post('/test', (req, res) => {
  console.log('Got body:', req.body);
  res.sendStatus(200);
});

// Conectar a otro host
app.get('/conectar', (req, res) => {
  console.log('host recibido: ', req.query.host);
  res.send('Host ' + req.query.host);
  socketOut = ioc.connect(req.query.host);
  console.log(socketOut);
});

// Enviar mensaje al host al que se encuentra conectado
app.get('/enviar_mensaje', (req, res) => {
  res.send('Mensaje ' + req.query.msg);
  socketOut.emit('Mensaje ASCP', req.query.msg);
});

//Enviar mensaje al host al que se encuentra conectado
app.post('/enviar_mensaje', (req, res) => {
  console.log('Got body:', req.body);
  res.send('Mensaje: ' + req.body.data);
  socketOut.emit('Mensaje ASCP', req.body);
});

// Escuchar en el puerto especificado en la línea de comandos
http.listen(port, () => {
  console.log(`Escuchando en http://localhost:${port}/`);
});
