import mongoose from 'mongoose';
import Institution from '../models/institution.js';
import dotenv from 'dotenv';

dotenv.config();

// Helper function to slugify text
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with hyphens
    .replace(/-+/g, '-');      // Replace multiple hyphens with single hyphen
}

async function migrateInstitutionSlugs() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all institutions
    const institutions = await Institution.find({});
    console.log(`\n📊 Found ${institutions.length} institutions`);

    let updated = 0;
    let skipped = 0;

    for (const institution of institutions) {
      // Check if slug already exists and is valid
      if (institution.slug && institution.slug !== 'undefined' && institution.slug !== 'null') {
        console.log(`⏭️  Skipping "${institution.name}" - already has slug: ${institution.slug}`);
        skipped++;
        continue;
      }

      // Generate slug from name or code
      let newSlug = slugify(institution.name);
      
      // Check if slug already exists
      const existingSlug = await Institution.findOne({ slug: newSlug, _id: { $ne: institution._id } });
      if (existingSlug) {
        // Append code to make it unique
        newSlug = `${newSlug}-${institution.code.toLowerCase()}`;
      }

      // Update institution
      institution.slug = newSlug;
      await institution.save();
      
      console.log(`✅ Updated "${institution.name}" with slug: ${newSlug}`);
      updated++;
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${institutions.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateInstitutionSlugs();
