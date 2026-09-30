/**
 * Run: GITHUB_TOKEN=ghp_yourtoken node scripts/run-board-update.js
 * Or:  node scripts/run-board-update.js ghp_yourtoken
 *
 * This forces the token from env/arg instead of Windows Credential Manager
 */

const token = process.env.GITHUB_TOKEN || process.argv[2];
if (!token || !token.startsWith('ghp_')) {
  console.error('\nUsage: node scripts/run-board-update.js ghp_YOUR_TOKEN_HERE\n');
  console.error('Or set GITHUB_TOKEN environment variable\n');
  process.exit(1);
}

// Override credential lookup in child process
process.env.GITHUB_TOKEN = token;

// Now run the main board update script
require('./update-project-board.js');
