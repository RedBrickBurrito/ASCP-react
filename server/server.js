const cors = require('cors');
const app = require('express')();
const { ok } = require('assert');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const bigInt = require('big-integer');

app.use(cors());

// Argumentos de linea de comandos
var myArgs = process.argv.slice(2);

// Puerto es el primer argumento que se pasa
const port = process.env.PORT || myArgs[0];

// Servidor HTTP
const http = require('http').createServer(app);

// Servidor para socket.io, aquí RECIBIMOS mensajes
// Nos aseguramos que podemos recibir referencias cruzadas
const io = require('socket.io')(http, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('client connected');
  socket.on('disconnect', () => {
    console.log('cliente disconnected');
  });

  socket.on('enviar-mensaje', (msg) => {
    socket.emit('Mensaje ASCP', msg);
  });

  socket.on('Mensaje ASCP', (msg) => {
    switch (msg.function) {
      case 1:
        const message = decodeDesECB(msg.data, sharedKey);
        console.log('mensaje recibido ', msg.data);
        console.log('mensaje desencriptado ', message);
        socket.broadcast.emit('recibir-mensaje', {
          function: 1,
          data: message,
        });
        break;
      case 2:
        isAlice = false;
        othersKey = msg.data.y;
        console.log(
          'se inicio una comunicacion por parte de alice con llave publica ',
          othersKey
        );
        socket.broadcast.emit('set-bob', msg.data.y);
        break;
      case 3:
        othersKey = msg.data.y;
        console.log('se recibio la llave publica de bob ', othersKey);
        computeSharedKey();
        socket.broadcast.emit('shared-key', sharedKey);
        break;
      default:
        return;
    }
  });
});

// Cliente
const ioc = require('socket.io-client');

// Se usa para ENVIAR mensajes
var socketOut = null;

// Funcion para encriptar
const encodeDesECB = (textToEncode, keyString) => {
  if (keyString === null) return textToEncode;

  var keyBuffer = Buffer.from(keyString.toString().substring(0, 8));

  var cipher = crypto.createCipheriv('des-ecb', keyBuffer, '');

  var c = cipher.update(textToEncode, 'utf8', 'base64');
  c += cipher.final('base64');

  return c;
};

const decodeDesECB = (textToDecode, keyString) => {
  if (keyString === null) return textToDecode;

  const keyBuffer = Buffer.from(keyString.toString().substring(0, 8));

  const cipher = crypto.createDecipheriv('des-ecb', keyBuffer, '');

  let c = cipher.update(textToDecode, 'base64', 'utf8');
  try {
    c += cipher.final('utf8');
  } catch (e) {
    console.error(e);
    return 'No se pudo desencriptar el texto ' + textToDecode;
  }

  return c;
};

// Diffie-Hellman
const ALPHA = bigInt(17123207);
const Q = bigInt(2426697107);
var isAlice = null;
var othersKey = '';
var secretKey = '';
var sharedKey = '';

const computePublicKey = (y, a = ALPHA, q = Q) => {
  console.log('y', y);
  if (y >= q) {
    return;
  }
  return fastExp(a, y, q);
};

const computeSharedKey = (a = ALPHA, q = Q) => {
  const bigIntKey = bigInt(othersKey);
  const bigSecretKey = bigInt(secretKey);
  sharedKey = fastExp(bigIntKey, bigSecretKey, q);
  console.log('la llave compartida es ', sharedKey);
};

const fastExp = (base, exp, q) => {
  if (exp.equals(0)) {
    return 1;
  } else {
    if (exp.mod(2) == 0) {
      return fastExp(base.multiply(base).mod(q), exp.divide(2), q);
    } else {
      return base.multiply(fastExp(base, exp.minus(1), q)).mod(q);
    }
  }
};

// Permitimos JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.raw());

// Conectar a otro host
app.get('/conectar', (req, res) => {
  socketOut = ioc.connect(req.query.host);
  res.send('Host ' + req.query.host);
});

// Enviar mensaje al host al que se encuentra conectado
// Recibir llave para protocolo diffie helman
app.post('/enviar_mensaje', (req, res) => {
  const message = encodeDesECB(req.body.data, sharedKey);
  console.log('mensaje sin encriptar ', req.body.data);
  console.log('mensaje encriptado ', message);
  res.status(200).send('Mensaje: ' + message);
  socketOut.emit('Mensaje ASCP', {
    function: req.body.function,
    data: message,
  });
});

app.post('/init_comm', async (req, res) => {
  const { y } = req.body.data;
  const publicKey = computePublicKey(bigInt(y));
  secretKey = y;

  if (!publicKey) {
    res.status(400).send('No se recibio una llave valida.');
  } else {
    socketOut.emit('Mensaje ASCP', {
      function: 2,
      data: { q: Q, a: ALPHA, y: publicKey },
    });
    isAlice = true;
    res.sendStatus(200);
  }
});

app.post('/key_comp', (req, res) => {
  const { y } = req.body.data;
  const publicKey = computePublicKey(bigInt(y));
  secretKey = y;

  if (!publicKey) {
    res.status(400).send('No se recibio una llave valida.');
  } else {
    socketOut.emit('Mensaje ASCP', {
      function: 3,
      data: { q: Q, a: ALPHA, y: publicKey },
    });
    computeSharedKey();
    res.sendStatus(200);
  }
});

// Escuchar en el puerto especificado en la línea de comandos
http.listen(port, () => {
  console.log(`Escuchando en http://localhost:${port}/`);
});
