# ShieldMeForNeverHack
## Analyse automatique de fiabilité d’un site web


https://github.com/user-attachments/assets/aa20c4b8-ef5f-4725-98f2-ecf769b54876


##  Installation

### Chrome / Chromium
1. Télécharger ou cloner le dépôt.  
2. Ouvrir `chrome://extensions`.  
3. Activer **Mode développeur**.  
4. Cliquer sur **Load unpacked**.  
5. Sélectionner le dossier "chrome-extension"

Aucune installation supplémentaire requise.

---

##  Permissions utilisées

| Permission | Utilité |
|-----------|---------|
| `activeTab` | Lire l’URL et analyser le site visité. |
| `webRequest`, `webRequestBlocking` | Intercepter les requêtes sortantes pour détecter les dépendances externes. |
| `storage` | Stockage local de l’adresse Email+ et des paramètres. |
| `scripting` | Injection du module autofill (Email+). |
| `notifications` | Alertes (phishing, IDN…). |
| `host_permissions: <all_urls>` | Analyse Whois, IP, GeoIP, blacklist. |

Toutes les analyses se font **localement** ou via **notre serveur interne**.  
Aucune donnée personnelle n’est envoyée vers des services tiers.

---

# Fonctionnement global

L’extension analyse automatiquement le site dès que l’utilisateur clique une fois sur l'icône.  
Aucune action manuelle n’est nécessaire.

Processus :

1. **Analyse du domaine**
   - Vérification ASCII : détection des attaques par homographies
   - Récupération Whois : âge du nom de domaine via notre serveur
   - Vérification phishing : comparaison avec une base de données OS hors ligne

2. **Inspection des requêtes sortantes**
   - Liste de tous les domaines tiers contactés

3. **Analyse IP / GeoIP**
   - Résolution IP du domaine
   - Pays d’hébergement via **notre serveur interne**

4. **Génération du score de fiabilité**
   - Basé sur les précédents résultats

Le tout fonctionne **en tâche de fond**, sans cliquer sur chaque fonctionnalité.

---

# Fonctionnalités principales

## GeoIP (serveur interne)
- Aucune utilisation d’API externe, utilisation de notre serveur pour garantir l'anonymat du client   
- L’IP de l’utilisateur n’est jamais transmise

---

## Email+ (alias anti-fuite)
Permet de générer des adresses du type :

```
prenom.nom+site@domaine.com
```
En effet, les chaînes de caractères situées après un "+" dans une adresse mail ne sont pas prises en compte.
On peut donc s'en servir pour ajouter des "tags/labels" différents sur chaque site.
Ainsi, lorsqu'on reçoit un mail de spam/phishing on peut identifier depuis quel site nos données ont fuité.

Fonctionnalités :
- Enregistrement local de l’adresse mail principale  
- Génération automatique d’un alias avec tag
- Possibilité de choisir le type de tag (nom du site, nom du site + date)
- Copie rapide dans le presse-papiers
- Autofill automatique dans les champs email des formulaires

---

## Vérification ASCII (attaques homographiques)
Détection des caractères non-ASCII dans le nom de domaine :
- cyrillique  
- homoglyphes unicode  
- alphabets mixtes  

Si le domaine n’est pas 100% ASCII, l'utilisateur reçoit un avertissement

---

## Détection phishing
- Utilise une base de données open-source embarquée.  
- Vérification locale → aucune requête externe.  
- Détection des domaines frauduleux connus.

---

## Dépendances externes
Liste complète des domaines tiers contactés par la page :
- scripts JS
- iframes
- CDN
- pixels de tracking
- analytics
- ...

---

## Pays d’hébergement
- Analyse basée sur l’IP du serveur
---

## Âge du domaine
- Récupération des métadonnées du domaine  
- Date de création  
- Détection “domaine trop jeune” (souvent phishing)

---

## Score de fiabilité
Basé sur :
- homoglyphes  
- phishing blacklist  
- âge du domaine  
- dépendances externes  
- pays d’hébergement

Score affiché dans une interface fluide et moderne.

## ROADMAP

- Alerte de fiabilité automatique sanso ouvrir l'extension
- Ajouts de mise à jour de base de donnée de site de phishing
