import QRCode from 'qrcode';
import os from 'os';
import path from 'path';

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();
const expoUrl = `exp://${localIp}:8085`;

const outputPath = path.resolve('public', 'expo-qr.png');
QRCode.toFile(outputPath, expoUrl, {
  color: {
    dark: '#00f3ff',
    light: '#070913'
  },
  width: 400,
  margin: 2
}, function (err) {
  if (err) throw err;
  console.log('Saved Expo QR Code Image to public/expo-qr.png');
});
