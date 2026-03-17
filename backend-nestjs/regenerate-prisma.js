const { execSync } = require('child_process');

console.log('Regenerating Prisma client...');

try {
  execSync('npx prisma generate', { 
    cwd: __dirname,
    stdio: 'inherit'
  });
  console.log('✅ Prisma client regenerated successfully!');
} catch (error) {
  console.error('❌ Error regenerating Prisma client:', error.message);
  process.exit(1);
}
