# MINEX Terrain — note de contextualisation

## Contexte du projet

MINEX Terrain est une application mobile conçue comme support de démonstration pour les opérations de maintenance et de supervision informatique/réseau associées au milieu de stage de MINEX, à Lubumbashi, secteur Golf Tshamalalé, avenue Chery Nowej. Le projet illustre comment un technicien pourrait consulter les équipements, préparer une maintenance et documenter une intervention sur le terrain.

## Besoin visé

Le suivi de références réseau, d’adresses IP, d’emplacements et d’interventions dans un même outil facilite la consultation du parc et la transmission d’un constat. La saisie locale est adaptée à une démonstration en mobilité ou en situation de connexion instable. Une photo, une note vocale et les coordonnées GPS peuvent compléter le rapport afin de garder une preuve utile à l’équipe technique.

## Fonctions réalisées

- Inventaire SQLite des équipements avec type, localisation, adresse IP, date et état.
- Planification des maintenances et rappels locaux sur le téléphone.
- Historique des interventions avec technicien, diagnostic, photo, note vocale et position.
- Import des contacts pour composer une liste locale de techniciens.
- État de connectivité et test REST/JSON de l’adresse IP publique.
- Session de démonstration enregistrée par le stockage sécurisé Expo.

## Limites et évolution vers un usage réel

Les équipements préchargés sont des données fictives de démonstration et doivent être remplacés par l’inventaire validé par l’entreprise. La connexion est locale et ne constitue pas une authentification MINEX; un serveur/API de l’entreprise devra vérifier les identifiants, délivrer les jetons et synchroniser les rapports. La carte ouvre Google Maps à partir des coordonnées GPS, et ne prétend pas géolocaliser l’équipement dans un bâtiment sans cartographie intérieure. Enfin, la mesure de puissance du signal radio n’est pas fournie par `expo-network`; l’application affiche les indicateurs de connectivité effectivement disponibles.
