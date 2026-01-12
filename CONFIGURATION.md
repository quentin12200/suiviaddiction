# 🔧 Guide de Configuration

Ce document explique comment configurer les variables d'environnement nécessaires pour que toutes les fonctionnalités de l'application fonctionnent correctement.

## 📋 Variables d'environnement requises

### 1. Base de données (OBLIGATOIRE)

```env
DATABASE_URL="libsql://[your-database].turso.io"
DATABASE_AUTH_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9..."
```

**Comment obtenir** :
1. Créer un compte gratuit sur [Turso](https://turso.tech)
2. Créer une nouvelle base de données
3. Copier l'URL et le token d'authentification

### 2. Coach IA - OpenAI (NÉCESSAIRE pour le coach)

```env
OPENAI_API_KEY="sk-proj-..."
```

**Comment obtenir** :
1. Créer un compte sur [OpenAI Platform](https://platform.openai.com)
2. Aller dans "API Keys"
3. Créer une nouvelle clé API
4. **IMPORTANT** : Ajouter des crédits à votre compte (minimum 5$)

**Modèles utilisés** :
- `/api/coach` : GPT-3.5-turbo (chat interactif)
- `/api/ai-encouragement` : GPT-4o-mini (messages de motivation)

**Coût estimé** :
- ~0.001$ par message de motivation
- ~0.002$ par échange avec le coach
- Avec 5$, vous avez environ 2500-5000 interactions

**Si pas configuré** :
- Le coach IA affichera des messages d'erreur
- Les encouragements utiliseront des messages de fallback génériques

### 3. Notifications Push (NÉCESSAIRE pour les notifications mobiles)

```env
# Clé publique VAPID (à exposer au client)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BKdGP3DpzRPcV8ZkN0Q07PDyPs0T3ucWUbs7HtNrOamEQziq_FQwB3s_kdRtg9zeQfPfEZjlL1aRViKXjkz4Xag"

# Clé privée VAPID (GARDER SECRÈTE)
VAPID_PRIVATE_KEY="ixIZeMRdnzw_gBGu29C4RSo2sqeDOYyUn1RWgtq6hU0"

# Email de contact (pour les notifications push)
VAPID_EMAIL="mailto:votre-email@example.com"
```

**Clés VAPID générées pour cette application** :
```
Public Key:
BKdGP3DpzRPcV8ZkN0Q07PDyPs0T3ucWUbs7HtNrOamEQziq_FQwB3s_kdRtg9zeQfPfEZjlL1aRViKXjkz4Xag

Private Key:
ixIZeMRdnzw_gBGu29C4RSo2sqeDOYyUn1RWgtq6hU0
```

**⚠️ IMPORTANT** :
- La clé publique (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`) est accessible côté client
- La clé privée (`VAPID_PRIVATE_KEY`) doit rester SECRÈTE côté serveur
- Ne JAMAIS commit la clé privée dans Git

**Si pas configuré** :
- Le bouton "Activer les notifications" affichera un warning
- Les notifications push ne fonctionneront pas
- Les notifications navigateur standard peuvent quand même fonctionner

**Comment régénérer de nouvelles clés** (si besoin) :
```bash
npx web-push generate-vapid-keys
```

## 🚀 Configuration sur Vercel

### Étape 1 : Aller dans les paramètres du projet

1. Ouvrir le [Dashboard Vercel](https://vercel.com/dashboard)
2. Sélectionner le projet `suiviaddiction`
3. Aller dans **Settings** → **Environment Variables**

### Étape 2 : Ajouter les variables

Pour chaque variable, cliquer sur **"Add New"** :

| Nom de la variable | Valeur | Environnements |
|-------------------|--------|----------------|
| `DATABASE_URL` | `libsql://...` | Production, Preview, Development |
| `DATABASE_AUTH_TOKEN` | `eyJhbGci...` | Production, Preview, Development |
| `OPENAI_API_KEY` | `sk-proj-...` | Production, Preview, Development |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `BKdGP3DpzRPcV8...` | Production, Preview, Development |
| `VAPID_PRIVATE_KEY` | `ixIZeMRdnzw_g...` | Production, Preview, Development |
| `VAPID_EMAIL` | `mailto:votre-email@example.com` | Production, Preview, Development |

**⚠️ Attention** :
- Cocher **Production**, **Preview**, **Development** pour chaque variable
- Les variables commençant par `NEXT_PUBLIC_` sont exposées au client
- Les autres variables restent côté serveur uniquement

### Étape 3 : Redéployer

Après avoir ajouté les variables :

1. Aller dans **Deployments**
2. Cliquer sur le dernier déploiement
3. Cliquer sur **"..."** → **"Redeploy"**

Ou simplement :

```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

## 🧪 Tester les configurations

### Tester le Coach IA

1. Aller sur le dashboard
2. Chercher la section "Coach IA" ou "Message de motivation"
3. Vérifier que le message s'affiche sans erreur

**En cas d'erreur** :
- Vérifier la console navigateur (F12)
- Vérifier les logs Vercel
- S'assurer que `OPENAI_API_KEY` est bien configurée
- S'assurer d'avoir des crédits sur le compte OpenAI

### Tester les Notifications Push

1. Ouvrir l'application sur **téléphone mobile**
2. Aller dans les paramètres/dashboard
3. Chercher le bouton "Activer les notifications"
4. Cliquer dessus
5. Accepter la permission

**Test de notification** :
```bash
# Endpoint de test (à créer)
curl -X POST https://suiviaddiction.vercel.app/api/notifications/test
```

**Debugging** :

Console navigateur :
```javascript
// Vérifier si service worker est enregistré
navigator.serviceWorker.ready.then(reg => console.log('SW ready:', reg))

// Vérifier si une subscription existe
navigator.serviceWorker.ready.then(reg =>
  reg.pushManager.getSubscription().then(sub => console.log('Subscription:', sub))
)

// Vérifier la clé VAPID publique
console.log('VAPID Public:', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
```

Logs serveur Vercel :
```
✅ Subscription push enregistrée: https://...
✅ Notification envoyée
```

## 🔍 Diagnostic des problèmes

### Problème : Coach IA renvoie une erreur

**Symptômes** :
- Message d'erreur au lieu d'un encouragement
- Console : "Erreur API OpenAI"
- Logs Vercel : "Erreur génération encouragement"

**Solutions** :
1. Vérifier que `OPENAI_API_KEY` est configurée dans Vercel
2. Vérifier que la clé commence par `sk-proj-` ou `sk-`
3. Vérifier que le compte OpenAI a des crédits
4. Tester la clé avec curl :
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_OPENAI_KEY"
   ```

### Problème : Notifications ne fonctionnent pas

**Symptômes** :
- Bouton "Activer les notifications" ne fait rien
- Permission refusée
- Pas de notification reçue

**Solutions Android/iOS** :

**Android** :
1. Vérifier que Chrome/Firefox est à jour
2. Aller dans **Paramètres** → **Applications** → **Chrome/Firefox**
3. Aller dans **Autorisations** → **Notifications** → **Autoriser**
4. Sur le site, accepter la permission de notification

**iOS (Safari)** :
⚠️ **IMPORTANT** : Les notifications push Web ne fonctionnent sur iOS que depuis iOS 16.4+

1. Mettre à jour iOS vers 16.4 minimum
2. Ajouter l'application à l'écran d'accueil (Add to Home Screen)
3. Les notifications push ne fonctionneront QUE via l'app ajoutée à l'écran d'accueil
4. Ouvrir depuis l'icône sur l'écran d'accueil (pas depuis Safari)
5. Accepter la permission de notification

**Si ça ne marche toujours pas sur iOS** :
- Les notifications push Web ont des limitations sur iOS
- Alternative : Utiliser les notifications navigateur standard (non-push)
- Solution future : Application native React Native

**Desktop (Chrome/Firefox)** :
1. Vérifier dans **chrome://settings/content/notifications**
2. S'assurer que le site n'est pas bloqué
3. Réinitialiser les permissions :
   - Chrome : **Paramètres** → **Confidentialité** → **Paramètres du site** → **Notifications**
   - Firefox : **Préférences** → **Vie privée** → **Permissions** → **Notifications**

### Problème : VAPID key non configurée

**Symptômes** :
- Console : "Clé VAPID publique non configurée"
- Les notifications ne se souscrivent pas

**Solution** :
1. Vérifier que `NEXT_PUBLIC_VAPID_PUBLIC_KEY` est dans Vercel
2. **IMPORTANT** : Le nom doit commencer par `NEXT_PUBLIC_` pour être exposé au client
3. Redéployer après avoir ajouté la variable

## 📱 Spécificités mobiles

### Android

**Navigateurs supportés** :
- ✅ Chrome (recommandé)
- ✅ Firefox
- ✅ Edge
- ❌ Samsung Internet (support partiel)

**Permissions** :
- Notifications : Automatiques après acceptation
- Pas besoin d'installer l'app

### iOS

**Navigateurs supportés** :
- ✅ Safari 16.4+ (UNIQUEMENT via PWA)
- ❌ Chrome iOS (utilise Safari sous le capot)
- ❌ Firefox iOS (utilise Safari sous le capot)

**Installation PWA requise** :
1. Ouvrir le site dans Safari
2. Appuyer sur le bouton "Partager" (carré avec flèche)
3. Sélectionner "Sur l'écran d'accueil"
4. Ouvrir l'app depuis l'icône
5. Accepter les notifications

**Limitations iOS** :
- Les notifications push Web ne fonctionnent QUE via PWA
- Pas de notifications si ouvert dans Safari
- Nécessite iOS 16.4 minimum

### Solution alternative pour iOS < 16.4

Utiliser les **notifications locales** au lieu des push :

```javascript
// Notification locale (fonctionne sans service worker)
if (Notification.permission === 'granted') {
  new Notification('Titre', {
    body: 'Message',
    icon: '/icon-192.png'
  })
}
```

**Limitations** :
- Ne fonctionnent que quand l'app est ouverte
- Pas de notifications en arrière-plan
- Pas de synchronisation serveur

## 🔐 Sécurité

### Variables publiques vs privées

**Variables PUBLIQUES** (préfixe `NEXT_PUBLIC_`) :
- Accessibles dans le navigateur
- Visibles dans le code source compilé
- Exemples : `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

**Variables PRIVÉES** (pas de préfixe) :
- Accessibles UNIQUEMENT côté serveur
- Jamais exposées au client
- Exemples : `OPENAI_API_KEY`, `VAPID_PRIVATE_KEY`, `DATABASE_AUTH_TOKEN`

### Rotation des clés

**VAPID Keys** :
- Générer de nouvelles clés : `npx web-push generate-vapid-keys`
- Mettre à jour dans Vercel
- Les anciennes souscriptions seront invalidées
- Les utilisateurs devront se réinscrire aux notifications

**OpenAI API Key** :
- Créer une nouvelle clé sur platform.openai.com
- Mettre à jour dans Vercel
- Révoquer l'ancienne clé

## 📊 Surveillance

### Logs à surveiller

**Vercel Logs** :
```
✅ Entry created with ID: ...
✅ Subscription push enregistrée: ...
✅ Notification envoyée
⚠️ Clé VAPID publique non configurée
❌ Erreur API OpenAI
```

### Monitoring OpenAI

1. Aller sur [platform.openai.com](https://platform.openai.com)
2. **Usage** → Voir la consommation quotidienne
3. Configurer des alertes de limite

### Monitoring des notifications

Vérifier régulièrement :
- Nombre de souscriptions actives : `/api/debug/subscriptions`
- Taux d'échec d'envoi de notifications
- Logs d'erreurs dans Vercel

## ✅ Checklist de configuration

- [ ] `DATABASE_URL` configuré dans Vercel
- [ ] `DATABASE_AUTH_TOKEN` configuré dans Vercel
- [ ] `OPENAI_API_KEY` configuré dans Vercel
- [ ] Crédits ajoutés sur le compte OpenAI (minimum 5$)
- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` configuré dans Vercel
- [ ] `VAPID_PRIVATE_KEY` configuré dans Vercel
- [ ] `VAPID_EMAIL` configuré dans Vercel
- [ ] Application redéployée après configuration
- [ ] Coach IA testé et fonctionnel
- [ ] Notifications testées sur Android
- [ ] Notifications testées sur iOS (via PWA)
- [ ] Service worker enregistré correctement

## 🆘 Support

Si un problème persiste :

1. Vérifier les logs Vercel
2. Vérifier la console navigateur (F12)
3. Tester les endpoints de debug :
   - `/api/debug/check-timer`
   - `/api/ai-encouragement`
4. Vérifier ce guide de configuration
5. Ouvrir une issue GitHub
