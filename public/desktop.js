console.log('desktop.js connected')

var qrcode = new QRCode("desktop-qr");

function makeCode () {		
	qrcode.makeCode('http://192.168.1.220:3000/mobile');
}

setTimeout(() => {
  makeCode();
}, 200)
