# Génération des icônes PWA

## Icônes nécessaires

Pour que la Progressive Web App fonctionne correctement, vous avez besoin de :
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

## Méthode 1 : Automatique avec Sharp (Recommandée)

```bash
# Installer sharp
npm install sharp

# Générer les icônes
node scripts/convert-icon.js
```

## Méthode 2 : En ligne (Rapide)

1. Visitez [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Uploadez `public/icon.svg`
3. Configurez les options PWA
4. Téléchargez les icônes générées
5. Placez `icon-192.png` et `icon-512.png` dans `public/`

## Méthode 3 : Manuellement

Utilisez un éditeur graphique (Inkscape, Figma, Photoshop, etc.) :

1. Ouvrez `public/icon.svg`
2. Exportez en PNG 192x192 → `public/icon-192.png`
3. Exportez en PNG 512x512 → `public/icon-512.png`

## Personnalisation

L'icône actuelle (`icon.svg`) représente la liberté et la croissance avec :
- Un gradient violet (couleurs de la marque)
- Une plante symbolisant la progression
- Le texte "Liberté"

Vous pouvez modifier ce SVG ou le remplacer par votre propre design.

## Vérification

Une fois les icônes générées, testez :
1. Visitez l'app sur mobile
2. Le prompt d'installation devrait afficher votre icône
3. Après installation, vérifiez l'icône sur l'écran d'accueil
