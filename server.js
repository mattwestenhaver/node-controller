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
QRCode.toDataURL((url + '/control') , (err, url) => {
  qrURL = url
})

// passes QR Code data to desktop page w/ EJS
app.get('/', (req, res) => {
  res.render('desktop.ejs', {
    url: qrURL
  });
});

// controller view
app.get('/control', (req, res) => {
  res.render('client.ejs')
});

// socket.io connection
io.on('connection', (socket) => {

  // client connects to socket
  console.log('user connected to socket');

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
    var clients = io.sockets.adapter.rooms['vapt1'].sockets;  
    opn("https://videos.virtualapt.com", { app: 'google chrome' })
  });

  // mouse control commands
  socket.on('mouse', (pos) => {
    if (pos.cmd == 'move' || pos.cmd == 'scroll' || pos.cmd == 'drag') {
      mouse = robot.getMousePos();
      newX = mouse.x + pos.x * adjustment;
      newY = mouse.y + pos.y * adjustment;
      robot.moveMouse(newX, newY);
      mouse = robot.getMousePos();
    } else if (pos.cmd == 'click') {
      robot.mouseClick();
    } else if (pos.cmd == 'rightclick') {
      robot.mouseClick('right');
    } else if (pos.cmd == 'scrollstart') {
      robot.mouseToggle('down', 'middle');
    } else if (pos.cmd == 'scrollend') {
      robot.mouseToggle('up', 'middle');
    } else if (pos.cmd == 'dragstart') {
      robot.mouseToggle('down', 'left');
    } else if (pos.cmd == 'dragend') {
      robot.mouseToggle('up', 'left');
    } else if (pos.cmd == 'right') {
      robot.keyTap("right");
    } else if (pos.cmd == 'left') {
      robot.keyTap("left");
    }
  })

  socket.on("new user", (msg) => {
    // console.log(msg)
    io.to(msg.room).emit('new user', `new user connected to ${msg.room}`)
  })

});

http.listen(PORT, () => {
  console.log(`🍻 listening on *:${PORT}`);
});