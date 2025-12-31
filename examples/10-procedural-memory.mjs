/**
 * Example 10: Procedural Memory (Skill Learning)
 *
 * The SDK learns browsing patterns and can replay them.
 * Skills are domain-specific action sequences that work.
 *
 * Run: node examples/10-procedural-memory.mjs
 */

import { createLLMBrowser, ProceduralMemory } from '../dist/index.js';

async function main() {
  const browser = await createLLMBrowser({
    enableProceduralMemory: true,
  });

  try {
    // Browse with trajectory recording
    console.log('=== Browse with Skill Learning ===\n');

    const result = await browser.browse('https://news.ycombinator.com/', {
      recordTrajectory: true,
      useSkills: true,
    });

    console.log('Title:', result.title);
    console.log('Skills matched:', result.learning.skillsMatched || []);
    console.log('Selectors used:', result.learning.selectorsUsed?.length || 0);

    // Get procedural memory stats
    console.log('\n=== Procedural Memory Stats ===\n');
    const stats = browser.getProceduralMemoryStats();
    console.log('Total skills:', stats.totalSkills);
    console.log('Total anti-patterns:', stats.totalAntiPatterns);
    console.log('Skills by domain:', stats.skillsByDomain);

    // Find skills for a domain
    console.log('\n=== Find Applicable Skills ===\n');
    const skills = await browser.findApplicableSkills('https://news.ycombinator.com/item?id=12345');
    console.log('Applicable skills:', skills.length);
    for (const skill of skills.slice(0, 3)) {
      console.log(`- ${skill.name} (confidence: ${skill.confidence})`);
    }

    // Direct access to ProceduralMemory
    console.log('\n=== ProceduralMemory Direct Access ===\n');

    const memory = new ProceduralMemory('./procedural-memory.json');

    // Add a manual skill
    memory.addManualSkill({
      name: 'extract_hn_story',
      description: 'Extract story details from HN item page',
      domain: 'news.ycombinator.com',
      urlPattern: '/item\\?id=',
      steps: [
        {
          action: 'extract',
          selector: '.titleline > a',
          field: 'title',
        },
        {
          action: 'extract',
          selector: '.score',
          field: 'points',
        },
        {
          action: 'extract',
          selector: '.age',
          field: 'age',
        },
      ],
    });
    console.log('Added manual skill: extract_hn_story');

    // List all skills
    const allSkills = memory.listSkills();
    console.log('\nAll skills:', allSkills.length);

    // Get skill versions (if versioning is enabled)
    const versions = memory.getSkillVersions('extract_hn_story');
    console.log('Skill versions:', versions.length);

    // Export skills as a pack
    console.log('\n=== Skill Export ===\n');
    const pack = memory.exportSkillPack({
      domains: ['news.ycombinator.com'],
      vertical: 'developer',
    });
    console.log('Exported pack:', pack.name);
    console.log('Skills in pack:', pack.skills.length);
    console.log('Version:', pack.version);
  } finally {
    await browser.cleanup();
  }
}

main().catch(console.error);
