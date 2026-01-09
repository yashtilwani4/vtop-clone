const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Starting custom build process...');

try {
  // Ensure public directory exists
  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    console.log('📁 Creating public directory...');
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Check if index.html exists
  const indexPath = path.join(publicDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.log('❌ index.html not found in public directory');
    process.exit(1);
  }

  console.log('✅ Public directory and index.html verified');
  
  // Run the build
  console.log('🚀 Running React build...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}