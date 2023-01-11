var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var http = require('http');
var cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
//
app.use(cors());
//

//
var WebSocket = require("ws");

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection',  function connection(ws) {

  ws.sala = "";
  ws.id = "";
  let recipiente = "";

  ws.on('message', function(message) {
    let mensaje = message.toString();
    if (mensaje[0] == "*") {

      let datos = mensaje.slice(1, mensaje.length);
      let vectorDatos = datos.split("*^*")
      ws.sala = vectorDatos[0];
      ws.id = vectorDatos[1];

    } else if (mensaje[0] == "-") {

      if (mensaje.length > 1) {
        recipiente = mensaje.slice(1, mensaje.length);
      }

    } else if (mensaje[0] == "+") {

      mensaje = mensaje.slice(1, mensaje.length);
      wss.broadcast(ws.id, ws.sala, mensaje, recipiente);
      recipiente = "";

    } else if (mensaje[0] == "~") {

      mensaje = mensaje.slice(1, mensaje.length);
      wss.broadcast("Servidor", ws.sala, mensaje, "");

    }
  });
});

wss.broadcast = function broadcast(emisor, sala, msg, recipiente) {
  console.log(sala + "| " +  emisor + ": "  + msg + " => " + recipiente);
  if (recipiente == "") {
    wss.clients.forEach(function each(client) {
      if (client.sala == sala) {
        client.send(emisor + ": " + msg);
      }
    });
  } else {
    wss.clients.forEach(function each(client) {
      if (client.sala == sala) {
        if (client.id == emisor || client.id == recipiente) {
          client.send("[Privado]" + emisor + ": " + msg);
        }
      }
    });
  }
};

server.listen(5001, function listening() {
  console.log("Escuchando en: " + server.address().port);
})
//

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

//--

app.get('/crear-sala', function(req, res) {
  console.log("Generando código...");
  let codigo = crearSala();
  let existe = buscarSala(codigo);

  while (existe) {
    console.log("El código ya existe, volviendo a generar...");
    codigo = crearSala();
    existe = buscarSala(codigo);
  }

  console.log("Codigo generado: " + codigo);
  res.json({ exito: true, codigo: codigo});
});

function crearSala () {
  let codigo = "";
  let letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  
  for (let i = 0; i < 6; i++) {
    if (i < 3) {
      let numero = Math.floor(Math.random() * 10);
      codigo = codigo + numero;
    } else {
      let letra = letras[Math.floor(Math.random() * letras.length)];
      codigo = codigo + letra;
    }
  }

  return codigo;
}

function buscarSala (codigo) {

  let existe = false;

  wss.clients.forEach(function each(client) {
    if (codigo == client.sala) {
      existe = true;
    }
  })

  return existe;
}

app.post('/buscar-sala', function(req, res) {
  let codigo = req.body.codigo;
  console.log("Buscando la sala con el código: " + codigo);
  let existe = buscarSala(codigo);

  if (existe) {
    res.json({exito: true});
  } else {
    res.json({exito: false});
  }
})


//--

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
