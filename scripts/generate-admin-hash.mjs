import { randomBytes, scrypt as scryptCb } from 'node:crypto';
import { promisify } from 'node:util';
import { stdin, stdout } from 'node:process';

const scrypt = promisify(scryptCb);
if (!stdin.isTTY || !stdin.setRawMode) throw new Error('Run this command in an interactive terminal so the password can be entered without echo.');
stdout.write('Admin password (hidden): ');
stdin.setEncoding('utf8');
stdin.setRawMode(true);
stdin.resume();
const password = await new Promise(resolve => {
  let value = '';
  const onData = chunk => {
    for (const character of chunk) {
      if (character === '\u0003') { stdin.off('data', onData); stdin.setRawMode(false); stdout.write('\n'); process.exit(130); }
      if (character === '\r' || character === '\n') { stdin.off('data', onData); stdin.setRawMode(false); stdout.write('\n'); resolve(value); return; }
      if (character === '\u007f' || character === '\b') value = value.slice(0, -1);
      else if (character >= ' ') value += character;
    }
  };
  stdin.on('data', onData);
});
try {
  if (password.length < 12) throw new Error('Use a password with at least 12 characters.');
  const salt = randomBytes(18);
  const key = await scrypt(password, salt, 64);
  console.log(`scrypt$${salt.toString('base64url')}$${key.toString('base64url')}`);
} finally { stdin.pause(); }
