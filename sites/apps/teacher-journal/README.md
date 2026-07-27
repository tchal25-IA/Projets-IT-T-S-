# Cahier de bord — application pour professeur des écoles

Application web personnelle, inspirée de Teetsh, pour préparer et suivre l'année scolaire : emploi du temps, cahier journal, programmations, fiches de préparation, élèves.

## Utilisation

C'est un fichier unique et autonome : [index.html](index.html). Aucune installation, aucun serveur requis.

- **En local** : double-cliquer sur `index.html`, ou l'ouvrir depuis le navigateur (`Fichier > Ouvrir`).
- **En ligne (Lovable / hébergement statique)** : déployer `index.html` tel quel, c'est une page statique.

À la première ouverture, l'application demande de choisir un mot de passe (protection locale de l'accès, car les données concernent des mineurs). Les données sont stockées uniquement dans le navigateur (`localStorage`) — rien n'est envoyé sur un serveur.

## Fonctionnalités (V1)

- **Emploi du temps** : grille hebdomadaire éditable, créneaux colorés par matière, export PDF (impression navigateur).
- **Cahier journal** : vue semaine générée depuis l'emploi du temps, séances glissables/déposables entre jours, duplication de séance ou de semaine, statut fait/à faire, ateliers (maternelle), pièces jointes (liens), export PDF.
- **Référentiel programmes officiels (France)** : cycles 1/2/3, sélection en cascade matière → domaine → sous-domaine → objectifs.
- **Programmations** : tableau matière × période, cases à cocher liées au référentiel.
- **Fiches de préparation** : titre, objectifs, matériel, phases, différenciation, bilan — liables à une séance.
- **Élèves** : liste, niveaux (multi-niveaux), trombinoscope, registre d'appel par date.

## Sauvegarde des données

- **Export** : bouton « Exporter (JSON) » dans la barre latérale — télécharge une copie complète des données.
- **Import** : bouton « Importer » — recharge un export JSON précédent (remplace les données actuelles).
- Des sauvegardes automatiques tournantes (6 dernières versions) sont conservées dans le navigateur en complément.

Il est recommandé d'exporter régulièrement (ex. une fois par semaine) pour ne pas perdre de données en cas de changement de navigateur ou d'ordinateur.

## Limites connues (hors périmètre V1)

- Pas d'export LSU officiel, pas de carnet de notes.
- Pas de compte multi-utilisateurs ni de synchronisation entre appareils (les données restent dans le navigateur où elles ont été saisies).
- Le mot de passe protège l'accès à l'interface mais n'est pas un chiffrement fort des données stockées.
