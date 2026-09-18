const ALPHA = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ".split("");

export function newRef(): string {
  const rand = (n: number) =>
    Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32 * n);
  let a = "";
  let b = "";
  for (let i = 0; i < 4; i++) a += ALPHA[rand(ALPHA.length)];
  for (let i = 0; i < 4; i++) b += ALPHA[rand(ALPHA.length)];
  return `${a}-${b}`;
}