import qrcode from 'qrcode-terminal';
import os from 'os';

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
const expoUrl = `exp://${localIp}:8081`;
const webUrl = `http://${localIp}:5173/`;

console.log('\n======================================================');
console.log('       🚀 CRUSH SPACE - EXPO GO & MOBILE QR        ');
console.log('======================================================\n');
console.log(`📱 Expo Go URL: ${expoUrl}`);
console.log(`🌐 Web / Mobile Browser URL: ${webUrl}\n`);
console.log('Telefonunuzda Expo Go veya Kamera uygulamasını açıp aşağıdaki QR kodu taratın:\n');

qrcode.generate(expoUrl, { small: true }, (qr) => {
  console.log(qr);
  console.log('\n======================================================\n');
});
