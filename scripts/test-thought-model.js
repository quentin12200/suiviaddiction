const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  try {
    // Tester si on peut créer une pensée
    console.log('🧪 Testing Thought model...');

    const thought = await prisma.thought.create({
      data: {
        content: 'Migration test - Table Thought fonctionne !'
      }
    });
    console.log('✅ Success! Thought created:', thought);

    // Récupérer toutes les pensées
    const all = await prisma.thought.findMany();
    console.log('✅ Total thoughts:', all.length);

    await prisma.$disconnect();
    console.log('✅ Migration verified successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

test();
