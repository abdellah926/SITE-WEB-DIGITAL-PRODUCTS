import { getDb } from "./client";
import { articles, categories, products } from "./schema";
import { log } from "@/lib/log";

async function seed(): Promise<void> {
  const db = getDb();
  if (!db) {
    log("error", "seed aborted: DATABASE_URL not set");
    process.exit(1);
  }

  const cats = [
    { slug: "crochet", name: "كروشي", nameFr: "Crochet", sort: 1 },
    { slug: "handmade", name: "أعمال يدوية", nameFr: "Fait main", sort: 2 },
    { slug: "kits", name: "مجموعات", nameFr: "Kits", sort: 3 },
  ];

  await db.delete(products);
  await db.delete(articles);
  await db.delete(categories);
  await db.insert(categories).values(cats);
  const rows = await db.select().from(categories);
  const bySlug = Object.fromEntries(rows.map((c) => [c.slug, c.id]));

  await db.insert(products).values([
    {
      slug: "crochet-afghan-blanket",
      title: "بطانية كروشي صوفية",
      titleFr: "Couverture au crochet en laine",
      description:
        "بطانية كروشي مصنوعة يدوياً من الصوف الطبيعي، متوفرة بعدة ألوان وتصاميم. مقاس 120×180 سم.",
      descriptionFr:
        "Couverture au crochet faite main en laine naturelle, disponible en plusieurs couleurs et motifs. Taille 120×180 cm.",
      priceMAD: 350,
      images: ["/img/shop/by-cyrus-1.jpg"],
      categoryId: bySlug["crochet"],
      inStock: true,
      featured: true,
    },
    {
      slug: "amigurumi-doll",
      title: "دمية أميغورومي كروشي",
      titleFr: "Poupée amigurumi en crochet",
      description: "دمية أميغورومي لطيفة تُحاك يدوياً بإتقان، مناسبة كهدية للأطفال.",
      descriptionFr: "Jolie poupée amigurumi tricotée à la main, parfaite en cadeau pour les enfants.",
      priceMAD: 120,
      images: ["/img/shop/by-cyrus-2.jpg"],
      categoryId: bySlug["crochet"],
      inStock: true,
      featured: true,
    },
    {
      slug: "handmade-wool-scarf",
      title: "وشاح صوف مطرز",
      titleFr: "Écharpe en laine brodée",
      description: "وشاح شتوي مصنوع يدوياً من الصوف الدافئ بنقوش تقليدية مغربية.",
      descriptionFr: "Écharpe d'hiver faite main en laine chaude avec des motifs traditionnels marocains.",
      priceMAD: 90,
      images: ["/img/shop/by-cyrus-3.jpg"],
      categoryId: bySlug["handmade"],
      inStock: true,
      featured: false,
    },
    {
      slug: "wool-storage-basket",
      title: "سلة تخزين محبوكة",
      titleFr: "Panier de rangement tricoté",
      description: "سلة متينة من خيوط القطن المحبوك، مثالية للتنظيم والديكور.",
      descriptionFr: "Panier robuste en fil de coton tricoté, idéal pour le rangement et la décoration.",
      priceMAD: 65,
      images: ["/img/shop/by-cyrus-4.jpg"],
      categoryId: bySlug["handmade"],
      inStock: false,
      featured: false,
    },
    {
      slug: "crochet-beginner-kit",
      title: "مجموعة المبتدئ لتعلم الكروشي",
      titleFr: "Kit débutant pour apprendre le crochet",
      description:
        "مجموعة متكاملة للبدء في تعلم الكروشي: سنارات، خيوط، مقص، إبرة، ودليل تعليمي مبسط.",
      descriptionFr:
        "Kit complet pour débuter le crochet : crochets, fils, ciseaux, aiguille et guide simplifié.",
      priceMAD: 200,
      images: ["/img/shop/by-cyrus-5.jpg"],
      categoryId: bySlug["kits"],
      inStock: true,
      featured: true,
    },
  ]);

  const now = new Date();
  await db.insert(articles).values([
    {
      slug: "crochet-beginners-guide",
      title: "دليلك الأول لتعلم الكروشي من الصفر",
      excerpt: "خطوات بسيطة وتقنيات أساسية لبدء أول عمل كروشي بنجاح.",
      body: "ابدأ باختيار سنارة وخيط مناسبين ليدك.\n\nتعلّم الحلقة الأساسية ثم الغرزة الأولى خطوة بخطوة.\n\nتدرب على عينات صغيرة قبل البدء بأعمال كبيرة.\n\nاصبر على التكرار، فالكروشي يتطلب الممارسة اليومية.",
      locale: "ar",
      publishedAt: now,
    },
    {
      slug: "gift-ideas-handmade",
      title: "أفكار هدايا يدوية مميزة للتقديم",
      excerpt: "هدايا صنعت بحب: أفكار عملية لعشاق الأشياء اليدوية.",
      body: "هدايا الكروشي تناسب كل المناسبات: أعياد الميلاد، حفلات البيت الجديد، والمناسبات العائلية.\n\nاختر شالاً أو دمية أو سلة مزخرفة حسب ذوق الشخص.\n\nأضف لمسة تخصيصية بالألوان المفضلة للمتلقي.",
      image: "/img/gift-ideas.svg",
      locale: "ar",
      publishedAt: now,
    },
    {
      slug: "crochet-stitches-basics",
      title: "أساسيات الغرز: غرزة السلسلة، الحشو، والعامود",
      excerpt: "تعرف على أهم ثلاث غرز تبني عليها كل مشاريع الكروشي.",
      body: "غرزة السلسلة هي أساس كل البدايات: اصنع حلقة ثم اسحب الخيط عبرها.\n\nغرزة الحشو تمنح قماشاً متماسكاً، وهي الأنسب للأشكال الدائرية.\n\nغرزة العمود ترفع ارتفاع النسيج وتمنح مرونة أكبر.\n\nجرّب كل غرزة في عينة صغيرة قبل الدمج بينها.",
      image: "/img/stitches-basics.svg",
      locale: "ar",
      publishedAt: now,
    },
    {
      slug: "crochet-beginners-guide",
      title: "Votre premier guide pour apprendre le crochet",
      excerpt: "Des étapes simples et des techniques de base pour réussir votre premier ouvrage.",
      body: "Commencez par choisir un crochet et un fil adaptés à votre main.\n\nApprenez la boucle de base puis la première maille pas à pas.\n\nEntraînez-vous sur de petits échantillons avant les grands ouvrages.\n\nLa régularité fait le crochet : pratiquez un peu chaque jour.",
      locale: "fr",
      publishedAt: now,
    },
    {
      slug: "gift-ideas-handmade",
      title: "Des idées de cadeaux faits main",
      excerpt: "Des cadeaux faits avec amour : des idées pratiques pour les amateurs de créations.",
      body: "Les créations au crochet conviennent à toutes les occasions : anniversaires, pendaisons de crémaillère et fêtes familiales.\n\nChoisissez un châle, une poupée ou un panier selon les goûts de la personne.\n\nPersonnalisez les couleurs selon les préférences du destinataire.",
      image: "/img/gift-ideas.svg",
      locale: "fr",
      publishedAt: now,
    },
    {
      slug: "crochet-stitches-basics",
      title: "Les mailles de base : chaînette, maille serrée et bride",
      excerpt: "Les trois mailles qui servent de fondation à tous vos projets.",
      body: "La chaînette est la base de tout : faites une boucle puis tirez le fil à travers.\n\nLa maille serrée donne un tissu compact, idéal pour les formes rondes.\n\nLa bride élève la hauteur et apporte plus de souplesse.\n\nTestez chaque maille sur un échantillon avant de les combiner.",
      image: "/img/stitches-basics.svg",
      locale: "fr",
      publishedAt: now,
    },
  ]);

  log("info", "seed applied");
  process.exit(0);
}

seed();