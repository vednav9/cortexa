import mongoose from "mongoose";
import dotenv from "dotenv";
import Course from "./models/course.js";

dotenv.config();

async function checkCourseStatus() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        const courses = await Course.find().select('name code isActive');

        console.log("\n📚 COURSE STATUS:\n");
        console.log("=".repeat(60));

        courses.forEach((course, index) => {
            const status = course.isActive ? "✅ ACTIVE" : "❌ INACTIVE";
            console.log(`${index + 1}. ${course.name} (${course.code}) - ${status}`);
        });

        console.log("=".repeat(60));

        // Count
        const activeCount = courses.filter(c => c.isActive).length;
        const inactiveCount = courses.filter(c => !c.isActive).length;
        
        console.log(`\n📊 Summary:`);
        console.log(`   Total: ${courses.length}`);
        console.log(`   Active: ${activeCount}`);
        console.log(`   Inactive: ${inactiveCount}`);

        await mongoose.disconnect();
        console.log("\n✅ Disconnected from MongoDB");
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

checkCourseStatus();
