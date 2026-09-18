import type { Messages } from "./ar";

const messagesFr: Messages = {
  meta: {
    siteName: "Mes Créations au Crochet",
    tagline: "Créations au crochet et fait main, fabriquées au Maroc",
  },
  nav: {
    home: "Accueil",
    products: "Produits",
    articles: "Articles",
    admin: "Admin",
  },
  home: {
    heroTitle: "Crochet et créations fait main, tricotés avec amour au Maroc",
    heroSubtitle:
      "Produits artisanaux authentiques, idées cadeaux originales et tutos pour apprendre le crochet pas à pas.",
    browseButton: "Voir les produits",
    featuredTitle: "Produits en vedette",
    latestTitle: "Derniers tutos",
  },
  product: {
    categoryLabel: "Catégorie",
    orderNow: "Commander sur WhatsApp",
    outOfStock: "Rupture de stock",
    emptyTitle: "Aucun produit pour le moment",
    emptyBody: "Ajoutez des produits depuis le tableau de bord pour remplir le catalogue.",
  },
  article: {
    emptyTitle: "Aucun article pour le moment",
    emptyBody: "Ajoutez des articles depuis le tableau de bord.",
    readMore: "Lire la suite",
    ctaTitle: "Vous cherchez par où commencer ?",
    ctaBody: "Découvrez nos kits de crochet pour débutants.",
  },
  footer: {
    rights: "Tous droits réservés. Fait avec amour.",
  },
  admin: {
    title: "Tableau de bord",
    loginTitle: "Connexion à l'administration",
    passwordLabel: "Mot de passe",
    submit: "Se connecter",
    invalidPassword: "Mot de passe invalide ou non configuré.",
    logout: "Se déconnecter",
    totalProducts: "Produits",
    totalArticles: "Articles",
    totalCategories: "Catégories",
    noDb: "Attention : DATABASE_URL non défini — lecture/écriture temporairement désactivées.",
    phoneMissing: "Attention : NEXT_PUBLIC_SHOP_PHONE non défini — boutons WhatsApp masqués.",
    backToList: "Retour à la liste",
    none: "Aucun élément",
    actions: {
      newProduct: "Nouveau produit",
      newArticle: "Nouvel article",
      edit: "Modifier",
      delete: "Supprimer",
      save: "Enregistrer",
      create: "Créer",
    },
    fields: {
      title: "Titre (arabe)",
      titleFr: "Titre (français)",
      slug: "Slug",
      description: "Description (arabe)",
      descriptionFr: "Description (français)",
      price: "Prix (MAD)",
      category: "Catégorie",
      images: "URLs des images (une par ligne)",
      inStock: "En stock",
      featured: "En vedette",
      excerpt: "Extrait",
      body: "Contenu (une ligne vide par paragraphe)",
      locale: "Langue",
      image: "URL de l'image",
    },
    errors: {
      required: "Ce champ est requis",
      slugInvalid: "Le slug ne peut contenir que des lettres latines, chiffres et tirets",
      saved: "Enregistré",
      deleted: "Supprimé",
      dbDown: "Impossible d'accéder à la base de données — vérifiez DATABASE_URL",
    },
  },
};

export default messagesFr;