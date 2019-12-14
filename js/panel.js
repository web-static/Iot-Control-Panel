var client = null;
var connected = false;

document.getElementById("clientIdInput").value = "js-utility-" + makeid();

// called when the client connects
function onConnect(context) {
  // Once a connection has been made, make a subscription and send a message.
  var connectionString = context.invocationContext.host + ":" + context.invocationContext.port + context.invocationContext.path;
  var statusSpan = document.getElementById("connectionStatus");
  statusSpan.innerHTML = "Connected to: " + connectionString + " as " + context.invocationContext.clientId;
  connected = true;
  setFormEnabledState(true);
}


function onConnected(reconnect, uri) {
  // Once a connection has been made, make a subscription and send a message.
  connected = true;
}

function onFail(context) {
  var statusSpan = document.getElementById("connectionStatus");
  statusSpan.innerHTML = "Failed to connect: " + context.errorMessage;
  connected = false;
  setFormEnabledState(false);
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
  connected = false;
}

// called when a message arrives
function onMessageArrived(message) {
  var messageTime = new Date().toISOString();
  // Insert into History Table
  var table = document.getElementById("incomingMessageTable").getElementsByTagName("tbody")[0];
  var row = table.insertRow(0);
  row.insertCell(0).innerHTML = message.destinationName;
  row.insertCell(1).innerHTML = safeTagsRegex(message.payloadString);
  row.insertCell(2).innerHTML = messageTime;
  row.insertCell(3).innerHTML = message.qos;


  if (!document.getElementById(message.destinationName)) {
    var lastMessageTable = document.getElementById("lastMessageTable").getElementsByTagName("tbody")[0];
    var newlastMessageRow = lastMessageTable.insertRow(0);
    newlastMessageRow.id = message.destinationName;
    newlastMessageRow.insertCell(0).innerHTML = message.destinationName;
    newlastMessageRow.insertCell(1).innerHTML = safeTagsRegex(message.payloadString);
    newlastMessageRow.insertCell(2).innerHTML = messageTime;
    newlastMessageRow.insertCell(3).innerHTML = message.qos;

  } else {
    // Update Last Message Table
    var lastMessageRow = document.getElementById(message.destinationName);
    lastMessageRow.id = message.destinationName;
    lastMessageRow.cells[0].innerHTML = message.destinationName;
    lastMessageRow.cells[1].innerHTML = safeTagsRegex(message.payloadString);
    lastMessageRow.cells[2].innerHTML = messageTime;
    lastMessageRow.cells[3].innerHTML = message.qos;
  }

}

function connectionToggle() {
  if (connected) {
    disconnect();
  } else {
    connect();
  }
}

function connect() {
  var hostname = "iot.eclipse.org";
  var port = "443";
  var clientId = document.getElementById("clientIdInput").value;

  var path = "";
  var user = "";
  var pass = "";

  var keepAlive = Number(5);
  var timeout = Number(10);

  // var tls = document.getElementById("tlsInput").checked;
  var tls = true;


  var automaticReconnect = true;
  var cleanSession = true;

  var lastWillTopic = "";
  var lastWillQos = Number(0);
  var lastWillRetain = false;


  var lastWillMessageVal = "";



  if (path.length > 0) {
    client = new Paho.Client(hostname, Number(port), path, clientId);
  } else {
    client = new Paho.Client(hostname, Number(port), clientId);
  }
  // set callback handlers
  client.onConnectionLost = onConnectionLost;
  client.onMessageArrived = onMessageArrived;
  client.onConnected = onConnected;

  var options = {
    invocationContext: { host: hostname, port: port, path: client.path, clientId: clientId },
    timeout: timeout,
    keepAliveInterval: keepAlive,
    cleanSession: cleanSession,
    useSSL: tls,
    reconnect: automaticReconnect,
    onSuccess: onConnect,
    onFailure: onFail
  };



  if (user.length > 0) {
    options.userName = user;
  }

  if (pass.length > 0) {
    options.password = pass;
  }

  if (lastWillTopic.length > 0) {
    var lastWillMessage = new Paho.Message(lastWillMessageVal);
    lastWillMessage.destinationName = lastWillTopic;
    lastWillMessage.qos = lastWillQos;
    lastWillMessage.retained = lastWillRetain;
    options.willMessage = lastWillMessage;
  }

  // connect the client
  client.connect(options);
  var statusSpan = document.getElementById("connectionStatus");
  statusSpan.innerHTML = "Connecting...";
}

function disconnect() {
  client.disconnect();
  var statusSpan = document.getElementById("connectionStatus");
  statusSpan.innerHTML = "Connection - Disconnected.";
  connected = false;
  setFormEnabledState(false);

}

// Sets various form controls to either enabled or disabled
function setFormEnabledState(enabled) {


  // Publish Panel Elements
  document.getElementsByName("ctrl_bt").disabled = !enabled;


}

function publish(controller, fun_id) {
  //调用验证码服务
  document.getElementsByName("doActionCaptcha")[0].click();
  if (CaptFlag === 0) {
    var topic = controller;
    var qos = "1";
    var message = fun_id;
    var retain = true;

    for (var i = 0; i < 10; i++) {
      message = new Paho.Message(message);
      message.destinationName = topic;
      message.qos = Number(qos);
      message.retained = retain;
      client.send(message);
    }
  }
  CaptFlag = -1;
}



function clearHistory() {
  var table = document.getElementById("incomingMessageTable");
  //or use :  var table = document.all.tableid;
  for (var i = table.rows.length - 1; i > 0; i--) {
    table.deleteRow(i);
  }

}


// Just in case someone sends html
function safeTagsRegex(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").
    replace(/>/g, "&gt;");
}

function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

function getDeviceCtrlButtonTag(controller, fun_name, fun_id) {
  var r = '<div class="col-lg-1"><div class="form-group"><label for="publishButton"></label><button id = "ACT_BT_'
    + fun_id
    + '" type = "button" name = "ctrl_bt" class="btn btn-default" onclick = "publish(\''
    + controller + '\',\'' + fun_id + '\');" > ' + fun_name + '</button ></div ></div > ';
  return r;
}
function initDeviceList() {
  var xmlhttp = null;
  var text = null;
  var obj = null;
  var url;

  url = "json/device.json";

  xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", url, false);
  xmlhttp.send(null);

  text = xmlhttp.responseText;
  obj = JSON.parse(text);

  var taglist = "";

  for (var i = 0; i < obj.length; i++) {
    taglist += '<tr>';
    taglist += '<td>';
    taglist += obj[i].device_describe;
    taglist += '</td>';
    for (var j = 0; j < obj[i].fun.length; j++) {
      taglist += '<td>';
      taglist += getDeviceCtrlButtonTag(obj[i].controller_ID, obj[i].fun[j].name, obj[i].fun[j].fun_id);
      taglist += '</td>';
    }
    taglist += '</tr>';
  }
  document.getElementById("device_ctrl_bt_list").innerHTML = taglist;

}
