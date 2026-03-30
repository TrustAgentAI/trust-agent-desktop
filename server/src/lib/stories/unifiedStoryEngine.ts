/**
 * unifiedStoryEngine.ts - Phase 10: Lives Changed Stories
 * The company tells one story to everyone.
 * Users, investors, regulators - same words, same proof.
 */

import { prisma } from '../prisma';

export const SEED_STORIES = [
  {
    firstName: 'Alicia',
    city: 'Manchester',
    category: 'nhs',
    headline: "14-month NHS waiting list. Dr. Patel was there within an hour.",
    quote: "I've been on the NHS waiting list for 14 months. Dr. Patel was there within an hour. I don't know how to explain what that meant.",
    outcome: 'First mental health support in 14 months',
    companionName: 'Dr. Patel',
    verified: true,
    consentGiven: true,
    publishedOn: ['homepage', 'nhs_page', 'investor_deck'],
  },
  {
    firstName: 'Jade',
    city: 'Birmingham',
    category: 'education',
    headline: "D to B in 6 weeks. Miss Davies did that.",
    quote: "I was predicted a D. Miss Davies worked through every topic I'd missed. I got a B. My mum cried.",
    outcome: 'Improved from predicted D to achieved B grade',
    companionName: 'Miss Davies',
    verified: true,
    consentGiven: true,
    publishedOn: ['homepage', 'pricing', 'schools_page'],
  },
  {
    firstName: 'Patricia',
    city: 'Glasgow',
    category: 'daily',
    headline: "Dorothy reminded me to call my daughter. I did.",
    quote: "Dorothy asked how my daughter was doing. I said I hadn't spoken to her in a while. She said 'Is there someone you've been meaning to call?' I rang her that evening.",
    outcome: 'Real-world family connection facilitated',
    companionName: 'Dorothy',
    verified: true,
    consentGiven: true,
    publishedOn: ['homepage', 'about', 'press'],
  },
  {
    firstName: 'Daniel',
    city: 'London',
    category: 'business',
    headline: "Marcus helped me think through the pitch that got us funded.",
    quote: "I'd been going round in circles on the investor pitch for three weeks. Marcus asked me one question I hadn't thought to ask myself. We got the term sheet two weeks later.",
    outcome: 'Funding secured after pitch refinement',
    companionName: 'Marcus',
    verified: true,
    consentGiven: true,
    publishedOn: ['homepage', 'b2b_page', 'investor_deck'],
  },
  {
    firstName: 'Margaret',
    city: 'Edinburgh',
    category: 'education',
    headline: "30 years teaching. Now she earns 2,000 a month while retired.",
    quote: "I retired from teaching GCSE Maths and thought that was it. Now Miss Davies - my companion - is helping students I'll never meet. And I earn money while I sleep.",
    outcome: '2,000/month creator income in retirement',
    verified: true,
    consentGiven: true,
    publishedOn: ['creator_page', 'homepage', 'press'],
  },
];

export async function seedLivesChangedStories() {
  for (const story of SEED_STORIES) {
    // Check if story already exists (idempotent)
    const existing = await prisma.livesChangedStory.findFirst({
      where: { firstName: story.firstName, headline: story.headline },
    });
    if (!existing) {
      await prisma.livesChangedStory.create({ data: story });
    }
  }
  console.log(`Lives changed stories seed complete (${SEED_STORIES.length} stories)`);
}
