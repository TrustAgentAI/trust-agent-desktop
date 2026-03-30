/**
 * Ambient Audio S3 Verification Script
 *
 * Verifies ambient audio files exist in S3, reports missing ones.
 * Run: npx ts-node scripts/seedAmbientAudio.ts
 *
 * Recommended sources for royalty-free ambient audio:
 * - freesound.org (CC0)
 * - mixkit.co (free)
 * - pixabay.com/music (free for commercial use)
 */

import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { ENVIRONMENT_AUDIO } from '../server/src/lib/environments/ambientAudio';

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? 'eu-west-2',
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    : undefined,
});

const bucket = process.env.S3_ASSETS_BUCKET ?? 'trustagent-prod-assets';

async function checkAmbientAudio() {
  console.log('Checking ambient audio files in S3...\n');
  console.log(`Bucket: ${bucket}`);
  console.log(`Region: ${process.env.AWS_REGION ?? 'eu-west-2'}\n`);

  let missing = 0;
  let found = 0;

  for (const [env, config] of Object.entries(ENVIRONMENT_AUDIO)) {
    try {
      await s3.send(
        new HeadObjectCommand({ Bucket: bucket, Key: config.s3Key }),
      );
      console.log(`  [OK] ${env}: ${config.s3Key}`);
      found++;
    } catch {
      console.log(`  [MISSING] ${env}: ${config.s3Key}`);
      missing++;
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Found: ${found}`);
  console.log(`Missing: ${missing}`);
  console.log(`Total: ${found + missing}`);

  if (missing > 0) {
    console.log(`\n${missing} audio files missing from S3.`);
    console.log('Upload royalty-free ambient audio to:\n');
    for (const [env, config] of Object.entries(ENVIRONMENT_AUDIO)) {
      console.log(`  s3://${bucket}/${config.s3Key}  (${config.name})`);
    }
    console.log('\nRecommended sources: freesound.org (CC0), mixkit.co (free)');
    process.exit(1);
  } else {
    console.log('\nAll ambient audio files present in S3');
  }
}

checkAmbientAudio().catch((err) => {
  console.error('Failed to check ambient audio:', err);
  process.exit(1);
});
