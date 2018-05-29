
// A Painter application that uses MQTT to distribute draw events
// to all other devices running this app.

/* global Paho device */

var app = {}

var host = 'mqtt.evothings.com'
var port = 1884

app.connected = false
app.ready = false

app.uuid = getUUID()

app.nickname = 'Unknown'

function getUUID () {
  if (window.isCordovaApp) {
    var uuid = device.uuid
    if ((uuid.length) > 16) {
      // On iOS we get a uuid that is too long, strip it down to 16
      uuid = uuid.substring(uuid.length - 16, uuid.length)
    }
    return uuid
  } else {
    return guid()
  }
}

/**
* Generates a GUID string.
* @returns {String} The generated GUID.
* @example af8a8416-6e18-a307-bd9c-f2c947bbb3aa
* @author Slavik Meltser (slavik@meltser.info).
* @link http://slavik.meltser.info/?p=142
*/
function guid () {
  function _p8 (s) {
    var p = (Math.random().toString(16) + '000000000').substr(2, 8)
    return s ? '-' + p.substr(0, 4) + '-' + p.substr(4, 4) : p
  }
  return _p8() + _p8(true) + _p8(true) + _p8()
}

// Simple function to generate a color from the device UUID
app.generateColor = function (uuid) {
  var code = parseInt(uuid.split('-')[0], 16)
  var blue = (code >> 16) & 31
  var green = (code >> 21) & 31
  var red = (code >> 27) & 31
  return 'rgb(' + (red << 3) + ',' + (green << 3) + ',' + (blue << 3) + ')'
}

app.initialize = function () {
  document.addEventListener(
    'deviceready',
    app.onReady,
    false)
  }

  //
  app.start = function(){
    app.nickname = document.getElementById('name').value
    document.getElementById('start').innerHTML = ""
    document.getElementById('index').innerHTML =
    '<p> <span id="info">Not Connected</span> <button id="connect" onclick="app.setupConnection();">Reconnect</button> </p>' +
    '<input id="message" type="text" placeholder="Type a message">' +
    '<button id="join" class="green wide" onclick="app.setupCanvas();">Send</button><p><div id="chat"></div></p>';

    app.initialize()
  }

  app.onReady = function () {
    if (!app.ready) {
      app.color = app.generateColor(app.uuid) // Generate our own color from UUID
      app.pubTopic = 'chat5/' + app.uuid + '/evt' // We publish to our own device topic
      app.subTopic = 'chat5/+/evt' // We subscribe to all devices using "+" wildcard
      //app.setupCanvas()
      app.setupConnection()
      app.ready = true
    }
  }

  app.setupCanvas = function () {
    // Get message from input
    var message = document.getElementById('message').value;

    if (app.connected)
    {
      var msg = JSON.stringify({"name" : app.nickname, "message": message, color: app.color})
      document.getElementById('message').value = ""
      app.publish(msg)
    }
  }

  app.setupConnection = function () {

    app.status('Connecting to ' + host + ':' + port + ' as ' + app.uuid)
    app.client = new Paho.MQTT.Client(host, port, app.uuid)
    app.client.onConnectionLost = app.onConnectionLost
    app.client.onMessageArrived = app.onMessageArrived
    var last_will = new Paho.MQTT.Message(JSON.stringify({"name" : app.nickname, "message": "Good bye", color: app.color}));
    last_will.destinationName = 'chat5/' + app.uuid + '/evt' // e.g.  'music/' + app.uuid + '/evt'
    var options = {
      willMessage: last_will,
      useSSL: true,
      onSuccess: app.onConnect,
      onFailure: app.onConnectFailure
    }
    app.client.connect(options)
  }


  app.publish = function (json) {
    var message = new Paho.MQTT.Message(json)
    message.destinationName = app.pubTopic
    app.client.send(message)
  }

  app.subscribe = function () {
    app.client.subscribe(app.subTopic)
    console.log('Subscribed: ' + app.subTopic)
  }

  app.unsubscribe = function () {
    app.client.unsubscribe(app.subTopic)
    console.log('Unsubscribed: ' + app.subTopic)
  }

  app.onMessageArrived = function (message) {
    try {
      var o = JSON.parse(message.payloadString)
      document.getElementById('chat').innerHTML += "<br/>"+ o.name + ": "+ o.message;

    } catch (e) {
      console.log('Bad message: ' + message.payloadString)
    }
  }

  app.onConnect = function (context) {
    app.subscribe()
    app.status('Connected!')
    app.connected = true
  }

  app.onConnectFailure = function (e) {
    console.log('Failed to connect: ' + JSON.stringify(e))
  }

  app.onConnectionLost = function (responseObject) {
    app.status('Connection lost!')
    console.log('Connection lost: ' + responseObject.errorMessage)
    app.connected = false
  }

  app.status = function (s) {
    console.log(s)
    var info = document.getElementById('info')
    info.innerHTML = s
  }

  app.initialize()
