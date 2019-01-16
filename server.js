const
  express = require('express'),
  app = express(),
  http = require('http').Server(app),
  io = require('socket.io')(http),
  robot = require('robotjs'),
  os = require('os'),
  opn = require('opn'),
  QRCode = require('qrcode')
  PORT = process.env.PORT || 3000
;

// variable declaration
var adjustment = 2;
var mouse = null;
var newX = null;
var newY = null;
var ifaces = os.networkInterfaces();
var url = '';
var qrURL = '';

app.set('view engine', 'ejs');

// sends the client directory
app.use(express.static(__dirname + '/public'));

app.get('/mobile', (req, res) => {
  res.sendFile(__dirname + '/public/client.html');
});

// maps network interfaces to find the IP address
Object.keys(ifaces).forEach((ifname) => {
  var alias = 0;

  ifaces[ifname].forEach((iface) => {
    if ('IPv4' !== iface.family || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return;
    }

    if (alias >= 1) {
      // this single interface has multiple ipv4 addresses
      url = 'http://' + iface.address + ':' + PORT;
    } else {
      // this interface has only one ipv4 adress
      url = 'http://' + iface.address + ':' + PORT;
    }
    alias++;
  });
});

// generates url into QR Code
QRCode.toDataURL((url + '/mobile') , (err, url) => {
  qrURL = url
})

// passes QR Code data to desktop page
app.get('/desktop', (req, res) => {
  res.render('desktop.ejs', {
    url: qrURL
  });
});

// socket.io connection
io.on('connection', (socket) => {

  // client connects to socket
  console.log('user connected');

  // client leaves current room and disconnects from socket
  socket.on('disconnect', function(){
    console.log('user disconnected');
    socket.leave();
  });

  // client correctly inputs the password to enter room
  socket.on("changeRoom", (room) => {

    socket.leave();
    socket.room = room;
    socket.join(room);
    console.log('login successful')

    // gets IDs of all clients in the 'vapt1' room
    var clients = io.sockets.adapter.rooms['vapt1'].sockets;  
    // console.log('clients:', clients)
    opn("https://videos.virtualapt.com", { app: 'google chrome' })

  });

  socket.on('mouse', (pos) => {

    if (pos.cmd == 'move' || pos.cmd == 'scroll' || pos.cmd == 'drag') {
      mouse = robot.getMousePos();

      newX = mouse.x + pos.x * adjustment;
      newY = mouse.y + pos.y * adjustment;
      
      robot.moveMouse(newX, newY);
      mouse = robot.getMousePos();
    } else if (pos.cmd == 'click') {
      robot.mouseClick();
    }

  })

  socket.on('pi', () => {

    robot.setMouseDelay(1);

    var twoPI = Math.PI * 2.0;
    var screenSize = robot.getScreenSize();
    var height = (screenSize.height / 2) - 10;
    var width = screenSize.width;

    for (var x = 0; x < width; x++) {
      y = height * Math.sin((twoPI * x) / width) + height;
      robot.moveMouse(x, y);
    }

  })

  socket.on("new user", (msg) => {
    // console.log(msg)
    io.to(msg.room).emit('new user', `new user connected to ${msg.room}`)
  })

});

http.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});