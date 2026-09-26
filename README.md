# SAMBO — application mobile

Application Android / iOS de l'association SAMBO. Elle utilise **la même base
Supabase que le site** (`../Sambo-web`) : mêmes tables, mêmes règles RLS, mêmes
canaux temps réel. Un message envoyé depuis le site apparaît dans l'app, et
inversement.

Voir `Historiques.md` pour l'état d'avancement détaillé.

## Stack

- Expo SDK 57 (React Native 0.86) + TypeScript
- Expo Router (routes dans `src/app/`)
- Supabase JS (session gardée sur l'appareil via `expo-sqlite/localStorage`)
- `expo-camera` pour le scan des cartes, `react-native-qrcode-svg` pour le QR

## Démarrer

```bash
npm install
cp .env.example .env.local   # puis renseigner la clé publishable (même que le site)
npx expo start               # scanner le QR avec Expo Go (Android / iOS)
```

## Navigation

Cinq onglets, l'essentiel seulement :

| Onglet | Contenu |
| --- | --- |
| **Accueil** | Tableau de bord : carte de membre, total adidy dû, raccourcis (Ma carte, Mes adidy, Messages, Profil), mur « Membres TSY NAHALOHA ADIDY », dernières publications |
| **Discussions** | Fil des publications, commentaires, signalement, masquage (admin) |
| **Scanner** (centre) | Scan du QR d'une carte → fiche complète du membre |
| **Chat** | « Groupe SAMBO » (salon global, présence en ligne) et « Privés » (conversations à deux) |
| **Annuaire** | Recherche, filtre par catégorie, appeler / écrire |

Écrans ouverts depuis l'accueil : `carte`, `adidy`, `profil`, `conversation/[id]`,
`publication/[id]`, `membre/[id]`.

## Carte et scan

Le QR des cartes contient `sambo://membre/<verification_id>` (voir
`Sambo-web/src/lib/membership.ts`). Le schéma `sambo` est déclaré dans
`app.json` : un lien `sambo://membre/…` ouvre directement la fiche dans l'app.
La fiche vient de `member_card_details()` (migration 0012/0014), réservée aux
membres validés.

## Pas encore dans l'app

- **Appels vidéo privés et appel audio de groupe** : ils restent sur le site
  (WebRTC exige un *development build*, non compatible Expo Go). L'historique
  des appels s'affiche dans les conversations.
- Inscription, photo de profil, études, administration : sur le site.
- Notifications push.

## Vérifications

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint
npx expo-doctor
```

## Build

Avec EAS : `npx eas-cli@latest build --platform android` (APK/AAB) — voir
https://docs.expo.dev/eas/.
