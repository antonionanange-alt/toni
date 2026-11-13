# Expose2_MINEX_2023020202

Application mobile de démonstration pour la gestion du parc informatique/réseau et le suivi des interventions de MINEX à Lubumbashi, secteur Golf Tshamalalé, avenue Chery Nowej. Identifiant Android : `com.minex.expose2_2023020202`.

## Fonctionnalités

- Session technicien de démonstration, conservée avec `expo-secure-store`.
- Inventaire local SQLite : équipements, techniciens, interventions et maintenance planifiée.
- Gestion des équipements (ajout, modification, suppression) avec adresse IP et localisation.
- Planification des maintenances et rappels locaux par notification.
- Rapport d’intervention avec photo conservée dans les documents de l’application, note vocale et position GPS.
- Ouverture de la position dans Google Maps.
- État réseau en direct et diagnostic HTTP/JSON sur `api.ipify.org`.
- Import des contacts du téléphone vers la liste locale de techniciens.
- Consultation directe des quatre tables SQLite (`equipements`, `techniciens`, `interventions`, `maintenance_planifiee`) depuis l’onglet « Tables » en bas de l’écran.
- Identité visuelle MINEX personnalisée sur l’écran de connexion, le tableau de bord, l’icône Android et l’écran de lancement.

Les trois équipements préchargés sont des exemples de présentation; adaptez-les aux actifs réellement observés durant le stage. La connexion est simulée localement pour l’interrogation : elle ne vérifie pas les identifiants d’un serveur MINEX et le jeton enregistré n’est pas un jeton délivré par un service d’authentification. Il faudra brancher l’API de l’entreprise avant un déploiement réel.

Voir [la note de contextualisation du stage](./NOTE_DE_STAGE.md) pour le besoin ciblé, les fonctionnalités et les limites de la démonstration.

## Démarrer

```bash
npm install
npx expo start
```

Les modules caméra, microphone, contacts, SQLite et notifications nécessitent un appareil compatible. Expo Go convient pour les essais locaux pris en charge; un APK EAS est nécessaire pour tester l’installation autonome.

## Générer l’APK Android

1. Connectez-vous à Expo et associez ce projet à votre compte :

   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest build:configure
   ```

2. Créez l’APK de démonstration :

   ```bash
   npx eas-cli@latest build --platform android --profile preview
   ```

Le profil `preview` est configuré en distribution interne avec le format APK. Expo fournit le lien de téléchargement à la fin du build. Une clé Google Maps intégrée n’est pas requise : le bouton GPS ouvre Google Maps installé ou accessible sur le téléphone. Le projet EAS est relié au compte `essentiel` avec le slug `expose2-minex-2023020202`.

Code source : https://github.com/antonionanange-alt/toni
