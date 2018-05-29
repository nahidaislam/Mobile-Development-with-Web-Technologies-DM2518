//Chat function

var app = {}

var host = 'mqtt.evothings.com'
var port = 1884

app.connected = false
app.ready = false

app.uuid = guid()

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


app.initialize = function () {

    app.pubTopic = 'parkout/' + app.uuid + '/evt' // We publish to our own device topic
    app.subTopic = 'parkout/+/evt' // We subscribe to all devices using "+" wildcard
    app.setupConnection()
}

app.onReady = function () {

  if (!app.ready) {

    app.pubTopic = 'parkout/' + app.uuid + '/evt' // We publish to our own device topic
    app.subTopic = 'parkout/+/evt' // We subscribe to all devices using "+" wildcard
    app.setupConnection()
    app.ready = true
  }
}

app.sendMessage = function () {
  //Get the name of the closest park to the user's location
  var park = localStorage.getItem('closestPark');
  var message = document.getElementById('message').value
  if(app.connected){
    var msg = JSON.stringify({ "name" : park, "message": message})
    document.getElementById('message').value = ""
    app.publish(msg)
  }

}

app.setupConnection = function () {

  app.status('Connecting to ' + host + ':' + port + ' as ' + app.uuid)
  app.client = new Paho.MQTT.Client('mqtt.evothings.com', 1884, app.uuid)
  app.client.onConnectionLost = app.onConnectionLost
  app.client.onMessageArrived = app.onMessageArrived
  var options = {
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
  try{
    var o = JSON.parse(message.payloadString)
    var out = document.getElementById('messages');
    //Scrolling down to the newest message
    var isScrolledToBottom = out.scrollHeight - out.clientHeight <= out.scrollTop + 1;
    var item = document.createElement('ons-list-item');
    item.innerText = o.name + ": " + o.message;
    out.append(item);
    ons.compile(out)
    app.updateScroll(isScrolledToBottom, out);

  }
  catch(e){
    console.log('Bad message:'+message.payloadString)
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
}

app.updateScroll = function(isScrolledToBottom,out){
  if(isScrolledToBottom){
      out.scrollTop = out.scrollHeight - out.clientHeight;
  }
}

app.initialize();
