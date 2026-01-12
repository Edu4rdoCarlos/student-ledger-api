export function generateRandomPassword(): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const specialChars = '!@#$%&*';

  const getRandomChar = (chars: string) => {
    return chars[Math.floor(Math.random() * chars.length)];
  };

  const password = [
    getRandomChar(lowercase),
    getRandomChar(uppercase),
    getRandomChar(numbers),
    getRandomChar(specialChars),
  ];

  const allChars = lowercase + uppercase + numbers + specialChars;
  const remainingLength = 12 - password.length;

  for (let i = 0; i < remainingLength; i++) {
    password.push(getRandomChar(allChars));
  }

  for (let i = password.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join('');
}
