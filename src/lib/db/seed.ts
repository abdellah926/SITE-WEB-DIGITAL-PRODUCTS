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
      title: "باترون بطانية كروشي صوفية",
      titleFr: "Patron de couverture au crochet en laine",
      description:
        "باترون PDF مفصّل بالخطوات والرسومات لصنع بطانية كروشي من الصوف الطبيعي بعدة ألوان وتصاميم. مقاس 120×180 سم. يُسلَّم مباشرة بعد الدفع.",
      descriptionFr:
        "Patron PDF détaillé pas à pas pour réaliser une couverture en laine naturelle, plusieurs couleurs et motifs. Taille 120×180 cm. Livré instantanément après paiement.",
      priceMAD: 50,
      images: ["/img/shop/by-cyrus-1.jpg"],
      categoryId: bySlug["crochet"],
      inStock: true,
      featured: true,
      fileKey: "crochet-afghan-blanket.pdf",
      fileMime: "application/pdf",
    },
    {
      slug: "amigurumi-doll",
      title: "باترون دمية أميغورومي كروشي",
      titleFr: "Patron de poupée amigurumi en crochet",
      description:
        "باترون PDF كامل مصوّر لصنع دمية أميغورومي لطيفة بإتقان، مناسب كهدية للأطفال.",
      descriptionFr:
        "Patron PDF complet illustré pour réaliser une jolie poupée amigurumi, parfaite en cadeau pour les enfants.",
      priceMAD: 50,
      images: ["/img/shop/by-cyrus-2.jpg"],
      categoryId: bySlug["crochet"],
      inStock: true,
      featured: true,
      fileKey: "amigurumi-doll.pdf",
      fileMime: "application/pdf",
    },
    {
      slug: "handmade-wool-scarf",
      title: "باترون وشاح صوف مطرز",
      titleFr: "Patron d'écharpe en laine brodée",
      description:
        "باترون PDF لنقوش تقليدية راقية على وشاح شتوي دافئ من الصوف.",
      descriptionFr:
        "Patron PDF de motifs traditionnels élégants pour une écharpe d'hiver chaude en laine.",
      priceMAD: 50,
      images: ["/img/shop/by-cyrus-3.jpg"],
      categoryId: bySlug["handmade"],
      inStock: true,
      featured: false,
      fileKey: "handmade-wool-scarf.pdf",
      fileMime: "application/pdf",
    },
    {
      slug: "wool-storage-basket",
      title: "باترون سلة تخزين محبوكة",
      titleFr: "Patron de panier de rangement tricoté",
      description:
        "باترون PDF لصنع سلة متينة من خيوط القطن المحبوك للتنظيم والديكور.",
      descriptionFr:
        "Patron PDF pour réaliser un panier robuste en fil de coton tricoté pour le rangement et la décoration.",
      priceMAD: 50,
      images: ["/img/shop/by-cyrus-4.jpg"],
      categoryId: bySlug["handmade"],
      inStock: true,
      featured: false,
      fileKey: "wool-storage-basket.pdf",
      fileMime: "application/pdf",
    },
    {
      slug: "crochet-beginner-kit",
      title: "دليل المبتدئ لتعلّم الكروشي PDF",
      titleFr: "Guide du débutant pour apprendre le crochet (PDF)",
      description:
        "دليل إلكتروني مصوّر خطوة بخطوة: الغرز الأساسية، حل المشاكل الشائعة، وتسعة باترونات سهلة للبدء.",
      descriptionFr:
        "Guide électronique illustré pas à pas : mailles de base, dépannage et neuf patrons faciles pour débuter.",
      priceMAD: 50,
      images: ["/img/shop/by-cyrus-5.jpg"],
      categoryId: bySlug["kits"],
      inStock: true,
      featured: true,
      fileKey: "crochet-beginner-kit.pdf",
      fileMime: "application/pdf",
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