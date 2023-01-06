var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var http = require('http');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

//
var WebSocket = require("ws");

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection',  function connection(ws) {
  ws.sala = "";
  ws.id = "";
  let recipiente = "";

  ws.on('open', function(data) {
    let datos = data.toString();
    let vectorDatos = datos.split("*^*")
    ws.sala = vectorDatos[0];
    ws.id = vectorDatos[1];
  })

  ws.on('message', function(message) {
    let mensaje = message.toString();
    if (mensaje[0] == "-") {
      if (mensaje.length > 1) {
        recipiente = mensaje.slice(1, mensaje.length);
      }
    } else if (mensaje[0] == "+") {
      mensaje = mensaje.slice(1, mensaje.length);
      wss.broadcast(ws.id, ws.sala, mensaje, recipiente);
      recipiente = "";
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
