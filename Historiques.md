# Historique de l'application mobile SAMBO

Ce fichier suit ce qui a été fait et ce qu'il reste à faire sur l'app mobile,
étape par étape. À mettre à jour à chaque étape significative. L'historique du
site et de la base de données est dans `../Sambo-web/Historiques.md`.

## Socle et première version ✅ (2026-09-27)

- Projet créé avec `create-expo-app` (modèle `blank-typescript`) : **Expo SDK
  57**, React Native 0.86, React 19.2, TypeScript. Expo Router, routes dans
  `src/app/`.
- **Même base de données que le site** : même projet Supabase
  (`svifjplsxoeccesskfsu`), même clé publique, mêmes tables, mêmes règles RLS,
  mêmes canaux temps réel (`chat:global`, `presence:membres`, `prive:<id>`).
  Aucune migration SQL n'a été nécessaire. Les types de la base
  (`src/lib/database.ts`, `src/lib/types.ts`) sont copiés du site : **à
  recopier après chaque nouvelle migration**.
- Variables d'environnement : `EXPO_PUBLIC_SUPABASE_URL` et
  `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` dans `.env.local` (exclu de git),
  modèle dans `.env.example`. Clé publique uniquement, jamais la clé secrète.
- Session gardée sur l'appareil (`expo-sqlite/localStorage`, méthode
  recommandée par la doc Expo), rafraîchissement du jeton seulement quand
  l'app est au premier plan.
- `src/lib/realtime.ts` : portage de la version fiabilisée du site (jeton
  transmis avant l'abonnement, reconnexion 1 s → 30 s, rattrapage), avec
  `AppState` à la place de `visibilitychange` : au retour au premier plan,
  l'écran se recharge et le socket est relancé.
- Accès : connexion email + mot de passe ; un compte non validé, refusé ou
  suspendu arrive sur « Demande en cours d'examen » (bouton Actualiser) ;
  l'inscription se fait sur le site. Garde-fous via `Stack.Protected`.
- Thème : dégradé vert sombre SAMBO du site, converti d'oklch en hex
  (`src/lib/theme.ts`), halos vert et or en dégradés radiaux SVG.
- Icônes de l'app, icône adaptative Android, icône monochrome et écran de
  démarrage générés à partir du logo. Le logo a été nettoyé : un contour
  quasi transparent dessinait un carré sombre autour du blason.
  Identifiants : `mg.sambo.app` (Android et iOS), schéma `sambo`.

**Navigation : 5 onglets**

| Onglet | Contenu |
| --- | --- |
| Accueil | Tableau de bord : carte de membre avec QR, total adidy dû, raccourcis (Ma carte, Mes adidy, Messages avec non-lus, Profil), mur « Membres TSY NAHALOHA ADIDY » en bande horizontale, 3 dernières publications. Tirer pour actualiser. |
| Discussions | Fil des publications, publier, commentaires (écran `publication/[id]`), signaler (fenêtre avec motif), masquer/réafficher (admin), supprimer les siens. |
| Scanner (centre) | Caméra (`expo-camera`), QR uniquement, lampe. Un QR qui n'est pas une carte SAMBO est refusé sur place. Une carte valide ouvre `membre/[id]`. |
| Chat | Vue « Groupe SAMBO » (salon `chat_messages`, présence en ligne partagée avec le site) et vue « Privés » (conversations `my_conversations`, recherche d'un membre, compteur de non-lus aussi sur l'onglet). |
| Annuaire | `directory_profiles`, recherche (nom, surnom, numéro, fonction), filtre par catégorie, boutons Appeler (`tel:`) et Écrire. |

Écrans ouverts depuis l'accueil ou les listes :
- `carte` : carte 8,5 × 5,5 cm, même mise en page que sur le site, mise à
  l'échelle de l'écran. Le QR contient `sambo://membre/<verification_id>`.
- `adidy` : total dû, puis mois par mois pour chaque année, avec la même
  règle de calcul que le site (montant par défaut 1000 Ar).
- `profil` : infos d'adhésion, modification du surnom, des téléphones, de la
  résidence, de l'affichage de l'email et du contact d'urgence ;
  déconnexion.
- `conversation/[id]` : messages privés, marqués lus à l'ouverture, « Vu »,
  suppression des siens par appui long, anciens messages chargés en
  remontant, historique des appels vidéo passés sur le site.
- `membre/[id]` : fiche complète lue avec `member_card_details()`. La
  validité de la carte est affichée en premier. Le lien
  `sambo://membre/<id>` ouvre cet écran directement.

**Vérifié**
- `npx tsc --noEmit` et `npx expo lint` : 0 erreur ; `npx expo-doctor` :
  21/21 ; `npx expo export` : les bundles Android et iOS compilent.
- Rendu contrôlé dans un navigateur au format téléphone (Playwright,
  390 px) : écran de connexion contre le vrai projet ; connexion puis les 12
  écrans contre un **faux Supabase local** avec des données inventées. Tous
  se chargent, et les seules erreurs console viennent du temps réel, que le
  faux serveur ne simule pas.
- Corrigé pendant ces contrôles : blason rogné par un arrondi ; halos de
  fond à bords durs ; compteur « Privés » invisible sur l'onglet actif.

**Pas encore testé** : avec un vrai compte, sur un vrai téléphone (Expo Go),
le scan d'une vraie carte imprimée, et le temps réel entre le site et l'app.

**Pas dans cette version**
- Appels vidéo privés et appel audio de groupe : WebRTC exige un
  *development build*, qui ne tourne pas dans Expo Go. Conséquence : un appel
  lancé depuis le site vers un membre qui n'a que l'app ne sonne pas, et
  finit en « Pas de réponse ».
- Inscription, photo de profil, études, administration : restent sur le site.
- Téléchargement de la carte en image.
- Graphique de fréquence des paiements (présent sur la page adidy du site).
- Notifications push.

À faire :
- Tester avec deux vrais comptes : site ↔ app, messages, présence, scan.
- Premier build installable : `npx eas-cli@latest build --platform android`.
- Plus tard : notifications push (nouveau message, appel), appels dans l'app
  via un *development build*, photo de profil depuis le téléphone.
