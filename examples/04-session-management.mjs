/**
 * Example 04: Session Management
 *
 * Save and restore authenticated sessions across restarts.
 * Useful for sites requiring login.
 *
 * Run: node examples/04-session-management.mjs
 */

import { createLLMBrowser, SessionManager } from '../dist/index.js';

async function main() {
  const browser = await createLLMBrowser({
    sessionsDir: './my-sessions', // Custom session directory
  });

  try {
    // Check session health
    console.log('=== Session Health ===');
    const health = await browser.getSessionHealth('github-profile');
    console.log('Session exists:', health.exists);
    console.log('Is healthy:', health.isHealthy);
    if (health.exists) {
      console.log('Last used:', health.lastUsed);
      console.log('Has cookies:', health.hasCookies);
    }

    // Browse with a named session profile
    console.log('\n=== Using Session Profile ===');
    const result = await browser.browse('https://github.com', {
      sessionProfile: 'github-profile',
    });
    console.log('Title:', result.title);
    console.log('Session used:', result.sessionProfile || 'none');

    // List all saved sessions
    console.log('\n=== Saved Sessions ===');
    const sessions = await browser.listSessions();
    for (const session of sessions) {
      console.log(`- ${session.name}: ${session.cookieCount} cookies`);
    }

    // Session manager direct access (advanced)
    console.log('\n=== Session Manager (Direct Access) ===');
    const sessionManager = new SessionManager('./my-sessions');

    // List profiles
    const profiles = await sessionManager.listProfiles();
    console.log('Profiles:', profiles);

    // Check if a specific session exists
    const hasSession = await sessionManager.hasProfile('github-profile');
    console.log('Has github-profile:', hasSession);
  } finally {
    await browser.cleanup();
  }
}

main().catch(console.error);
