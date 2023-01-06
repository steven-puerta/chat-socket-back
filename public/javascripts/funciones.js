let nombre = "";
let sala = "";

function inicializar () {

    nombre = document.getElementById("nombre").value;
    sala = document.getElementById("sala").value;

    let boton = document.getElementById("boton");
    boton.disabled = false;

    funcionBoton = function(event) {
        let mensaje = document.getElementById("mensaje").value;
        let recipiente = document.getElementById("objetivo").value;
        botonEnviar(mensaje, recipiente);
    }
    boton.addEventListener("click", funcionBoton);

    conectarWebsocket();

}

function botonEnviar (mensaje, recipiente) {
    enviar(mensaje, recipiente);
    let mensajeInput = document.getElementById("mensaje");
    mensajeInput.value = "";
}

async function conectarWebsocket () {

    let ip = "localhost";

    /*
    obetenerIp = async function(event) {
        //
        const respuesta = await fetch("/ip", {
            method: 'GET'
        });
        const respuestaRecibida = await respuesta.json();

        ip = respuestaRecibida.ip;
    }

    await obetenerIp();
    */

    websocket = new WebSocket("ws://" + ip + ":5001");

    websocket.onopen = function (evt) {
        onOpen(evt)
    };

    websocket.onclose = function (evt) {
        onClose(evt)
    };

    websocket.onmessage = function (evt) {
        onMessage(evt)
    };

    websocket.onerror = function (evt) {
        onError(evt)
    };
}

function onOpen (evt) {
    websocket.send("*"+ sala + "*^*" + nombre);
    const mensajeBienvenida = "~" + nombre + " ha entrado a la sala"
    websocket.send(mensajeBienvenida);
}

function onClose (evt) {
    document.getElementById("boton").disabled = true;
    setTimeout(function () {conectarWebsocket()}, 2000);
}

function onMessage (evt) {
    let chat = document.getElementById("chat");
    chat.innerHTML += evt.data + "\n"
}

function onError (evt) {
    console.log("Error: " + evt.data);
}

function enviar(mensaje, recipiente) {
    console.log("Emisor: " + nombre + ". Mensaje: " + mensaje + ". Recipiente: " + recipiente);
    websocket.send("-"+recipiente);
    websocket.send("+"+mensaje);
}