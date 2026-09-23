// Run with: node --env-file=.env.local scripts/update-product-photos.cjs
const { Pool } = require("pg");
const additions = {
  "crochet-afghan-blanket": [11, 10],
  "handmade-wool-scarf": [9, 8],
  "crochet-beginner-kit": [7],
};

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const [slug, numbers] of Object.entries(additions)) {
      const { rows } = await client.query("SELECT images FROM products WHERE slug = $1 FOR UPDATE", [slug]);
      if (rows.length !== 1) throw new Error(`Expected one product: ${slug}`);
      const previousAdditions = new Set(numbers.map(n => `/img/shop/by-cyrus-${n}.jpg`));
      if (slug === "crochet-afghan-blanket") {
        previousAdditions.add("/img/shop/cyrus-reference-12.png");
        previousAdditions.add("/img/shop/by-cyrus-12.jpg");
      }
      const extra = [];
      if (slug === "handmade-wool-scarf") {
        const basket = await client.query("SELECT images FROM products WHERE slug = $1", ["wool-storage-basket"]);
        if (basket.rows.length !== 1) throw new Error("Basket product missing");
        extra.push(...basket.rows[0].images);
      }
      if (slug === "crochet-beginner-kit") {
        const doll = await client.query("SELECT images FROM products WHERE slug = $1", ["amigurumi-doll"]);
        if (doll.rows.length !== 1) throw new Error("Amigurumi product missing");
        extra.push(...doll.rows[0].images, "/img/shop/cyrus-reference-6.png");
      }
      const images = [...new Set([...numbers.map(n => `/img/shop/cyrus-reference-${n}.png`), ...rows[0].images.filter(src => !previousAdditions.has(src)), ...extra])];
      await client.query("UPDATE products SET images = $1 WHERE slug = $2", [images, slug]);
      console.log(JSON.stringify({ slug, images }));
    }
    await client.query("UPDATE products SET featured = false WHERE slug = $1", ["amigurumi-doll"]);
    await client.query("UPDATE products SET featured = false WHERE slug = $1", ["wool-storage-basket"]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}
main().catch(() => { console.error("Product photo update failed; transaction rolled back."); process.exitCode = 1; });
