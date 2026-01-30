import mongoose from "mongoose";
import dotenv from "dotenv";
import Teacher from "./models/teacher.js";
import Course from "./models/course.js";

dotenv.config();

async function checkTeacherCourses() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // Find all teachers
        const teachers = await Teacher.find()
            .select('fullName email authorizedCourses')
            .populate('authorizedCourses', 'name code');

        console.log("\n📊 TEACHERS AND THEIR AUTHORIZED COURSES:\n");
        console.log("=".repeat(60));

        if (teachers.length === 0) {
            console.log("❌ No teachers found in database");
        } else {
            teachers.forEach((teacher, index) => {
                console.log(`\n${index + 1}. Teacher: ${teacher.fullName}`);
                console.log(`   Email: ${teacher.email}`);
                console.log(`   Authorized Courses: ${teacher.authorizedCourses?.length || 0}`);
                
                if (teacher.authorizedCourses && teacher.authorizedCourses.length > 0) {
                    teacher.authorizedCourses.forEach((course, i) => {
                        console.log(`      ${i + 1}. ${course.name} (${course.code})`);
                    });
                } else {
                    console.log(`      ⚠️  NO COURSES ASSIGNED`);
                }
            });
        }

        console.log("\n" + "=".repeat(60));

        // Check all available courses
        const allCourses = await Course.find().select('name code department');
        console.log(`\n📚 Total courses available in database: ${allCourses.length}`);
        
        if (allCourses.length > 0) {
            console.log("\nAvailable courses:");
            allCourses.forEach((course, i) => {
                console.log(`   ${i + 1}. ${course.name} (${course.code})`);
            });
        }

        await mongoose.disconnect();
        console.log("\n✅ Disconnected from MongoDB");
    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

checkTeacherCourses();
