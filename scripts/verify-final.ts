import fs from "node:fs";
import path from "node:path";

const dir = process.env.SMOKE ?? path.join(process.env.TEMP ?? ".", "opencode", "smoke");
const read = (f: string) => fs.readFileSync(path.join(dir, f), "utf8");
const cnt = (s: string, p: string) => (s.match(new RegExp(p, "g")) ?? []).length;

const ar = read("final3_ar.html");
const prod = read("final3_prod.html");

console.log("HOME ar: gallery cyrus refs=" + cnt(ar, "by-cyrus-[0-9]\\.jpg"));
console.log("HOME ar: galleryTitle=" + ar.includes("أحدث إبداعاتنا"));
console.log("HOME ar: badge=" + ar.includes("جديد قريباً"));
console.log("HOME ar: product title in body=" + ar.includes("بطانية كروشي صوفية"));
console.log("HOME ar: wa.me refs=" + cnt(ar, "wa\\.me"));
console.log("PROD img by-cyrus-1 refs=" + cnt(prod, "by-cyrus-1\\.jpg"));
console.log("PROD wa.me refs=" + cnt(prod, "wa\\.me"));
console.log("PROD price 350=" + prod.includes("350"));