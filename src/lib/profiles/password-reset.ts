import "server-only";

import { randomInt } from "node:crypto";

const LOWER = "abcdefghjkmnpqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";
const SYMBOLS = "!@#$%^&*()-_=+";
const ALL = `${LOWER}${UPPER}${DIGITS}${SYMBOLS}`;

export function generateStrongTemporaryPassword(length = 16) {
  const minimumLength = Math.max(length, 12);
  const chars = [
    pick(LOWER),
    pick(UPPER),
    pick(DIGITS),
    pick(SYMBOLS),
  ];

  while (chars.length < minimumLength) {
    chars.push(pick(ALL));
  }

  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index + 1);
    [chars[index], chars[swapIndex]] = [chars[swapIndex], chars[index]];
  }

  return chars.join("");
}

function pick(charset: string) {
  return charset[randomInt(0, charset.length)];
}
