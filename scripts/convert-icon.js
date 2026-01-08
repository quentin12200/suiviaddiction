// Script pour convertir icon.svg en PNG avec sharp
// Usage: npm install sharp && node scripts/convert-icon.js

const fs = require('fs')
const path = require('path')

async function generateIcons() {
  try {
    // Essayer d'importer sharp
    const sharp = require('sharp')

    const svgPath = path.join(__dirname, '../public/icon.svg')
    const svgBuffer = fs.readFileSync(svgPath)

    console.log('🎨 Génération des icônes PNG avec Sharp...')

    // Générer icon-192.png
    await sharp(svgBuffer)
      .resize(192, 192)
      .png()
      .toFile(path.join(__dirname, '../public/icon-192.png'))

    console.log('✅ icon-192.png créée')

    // Générer icon-512.png
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(__dirname, '../public/icon-512.png'))

    console.log('✅ icon-512.png créée')
    console.log('')
    console.log('🎉 Icônes PWA générées avec succès!')

  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('❌ Sharp n\'est pas installé.')
      console.log('')
      console.log('Pour installer Sharp:')
      console.log('  npm install sharp')
      console.log('')
      console.log('Ou utilisez l\'option 2 (en ligne) :')
      console.log('  node scripts/generate-icons.js')
    } else {
      console.error('❌ Erreur lors de la génération:', error.message)
    }
    process.exit(1)
  }
}

generateIcons()
