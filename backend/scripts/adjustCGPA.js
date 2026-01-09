const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Import models
const SimpleResult = require('../models/SimpleResult');
const SimpleUser = require('../models/SimpleUser');
const SimpleCourse = require('../models/SimpleCourse');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const adjustCGPA = async () => {
  try {
    console.log('🎯 Adjusting grades to achieve CGPA of 6.29...');
    
    // Get Neha's student record
    const student = await SimpleUser.findOne({ registrationNumber: '24BCY10007' });
    if (!student) {
      console.log('❌ Student Neha not found');
      return;
    }
    
    // Get all current results
    const allResults = await SimpleResult.find({ 
      studentId: student._id, 
      status: 'Published' 
    }).populate('courseId', 'courseCode credits');
    
    console.log(`📊 Current results: ${allResults.length} courses`);
    
    // Calculate current CGPA
    let currentGradePoints = 0;
    let currentCredits = 0;
    
    allResults.forEach(result => {
      if (result.grade !== 'P') {
        currentGradePoints += result.gradePoints * result.courseId.credits;
        currentCredits += result.courseId.credits;
      }
    });
    
    const currentCGPA = currentCredits > 0 ? (currentGradePoints / currentCredits).toFixed(2) : 0;
    console.log(`📈 Current CGPA: ${currentCGPA}`);
    
    // Target CGPA: 6.29
    const targetCGPA = 6.29;
    const targetGradePoints = targetCGPA * currentCredits;
    const additionalGradePoints = targetGradePoints - currentGradePoints;
    
    console.log(`🎯 Target CGPA: ${targetCGPA}`);
    console.log(`📊 Need additional grade points: ${additionalGradePoints.toFixed(2)}`);
    
    // Strategy: Improve some grades to reach target
    // Let's improve a few courses strategically
    
    const gradePoints = {
      'S': 10, 'A': 9, 'B': 8, 'C': 7, 'D': 6, 'E': 5, 'F': 0, 'P': 0
    };
    
    // Find courses that can be improved
    const improvableResults = allResults.filter(result => 
      result.grade !== 'P' && 
      (result.grade === 'E' || result.grade === 'D' || result.grade === 'C')
    );
    
    console.log(`🔧 Found ${improvableResults.length} courses that can be improved`);
    
    // Strategy: Final fine-tuning to get exactly 6.29 CGPA
    const improvements = [
      // Keep most as they are, just reduce a couple more
      { courseCode: 'EEE1001', newGrade: 'E', newMarks: 55 }, // Keep as E
      { courseCode: 'MAT1003', newGrade: 'E', newMarks: 52 }, // Keep as E
      { courseCode: 'CHY1007', newGrade: 'D', newMarks: 68 }, // Keep as D
      { courseCode: 'ENG1004', newGrade: 'D', newMarks: 75 }, // Keep as D
      { courseCode: 'CSD1001', newGrade: 'D', newMarks: 68 }, // Reduce C back to D
      { courseCode: 'MAT2002', newGrade: 'C', newMarks: 70 }, // Keep as C
      { courseCode: 'CSA2001', newGrade: 'B', newMarks: 78 }, // Keep as B
      { courseCode: 'CSE1021', newGrade: 'B', newMarks: 79 }, // Keep as B
      { courseCode: 'ECE2002', newGrade: 'C', newMarks: 66 }, // Keep as C
      { courseCode: 'ENG2005', newGrade: 'C', newMarks: 72 }, // Keep as C
      { courseCode: 'PHY1003', newGrade: 'C', newMarks: 68 }, // Reduce B back to C
    ];
    
    let actualImprovements = 0;
    
    for (const improvement of improvements) {
      const result = allResults.find(r => r.courseId.courseCode === improvement.courseCode);
      if (result) {
        const oldGradePoints = result.gradePoints;
        const newGradePoints = gradePoints[improvement.newGrade];
        
        // Update the result
        result.grade = improvement.newGrade;
        result.gradePoints = newGradePoints;
        result.totalMarks = improvement.newMarks;
        
        await result.save();
        
        console.log(`✅ Updated ${improvement.courseCode}: ${result.grade} -> ${improvement.newGrade} (${improvement.newMarks}%)`);
        actualImprovements++;
      }
    }
    
    // Recalculate CGPA
    const updatedResults = await SimpleResult.find({ 
      studentId: student._id, 
      status: 'Published' 
    }).populate('courseId', 'courseCode credits');
    
    let newGradePoints = 0;
    let newCredits = 0;
    
    updatedResults.forEach(result => {
      if (result.grade !== 'P') {
        newGradePoints += result.gradePoints * result.courseId.credits;
        newCredits += result.courseId.credits;
      }
    });
    
    const newCGPA = newCredits > 0 ? (newGradePoints / newCredits).toFixed(2) : 0;
    
    console.log('\n🎉 CGPA adjustment completed!');
    console.log(`📊 Previous CGPA: ${currentCGPA}`);
    console.log(`📈 New CGPA: ${newCGPA}`);
    console.log(`🔧 Courses improved: ${actualImprovements}`);
    console.log(`🎯 Target achieved: ${Math.abs(newCGPA - targetCGPA) < 0.05 ? 'YES' : 'NO'}`);
    
    // Show semester-wise breakdown
    console.log('\n📈 Updated Semester-wise GPA Breakdown:');
    
    // Interim Semester (Semester 1)
    const interimResults = updatedResults.filter(r => r.semester === 1);
    let interimGP = 0, interimCredits = 0;
    interimResults.forEach(r => {
      if (r.grade !== 'P') {
        interimGP += r.gradePoints * r.courseId.credits;
        interimCredits += r.courseId.credits;
      }
    });
    const interimGPA = interimCredits > 0 ? (interimGP / interimCredits).toFixed(2) : 0;
    console.log(`  Interim Semester: ${interimGPA} GPA`);
    
    // Winter Semester (Semester 2)
    const winterResults = updatedResults.filter(r => r.semester === 2);
    let winterGP = 0, winterCredits = 0;
    winterResults.forEach(r => {
      if (r.grade !== 'P') {
        winterGP += r.gradePoints * r.courseId.credits;
        winterCredits += r.courseId.credits;
      }
    });
    const winterGPA = winterCredits > 0 ? (winterGP / winterCredits).toFixed(2) : 0;
    console.log(`  Winter Semester 2024-25: ${winterGPA} GPA`);
    
    // Fall Semester (Semester 3)
    const fallResults = updatedResults.filter(r => r.semester === 3);
    let fallGP = 0, fallCredits = 0;
    fallResults.forEach(r => {
      if (r.grade !== 'P') {
        fallGP += r.gradePoints * r.courseId.credits;
        fallCredits += r.courseId.credits;
      }
    });
    const fallGPA = fallCredits > 0 ? (fallGP / fallCredits).toFixed(2) : 0;
    console.log(`  Fall Semester 2025-26: ${fallGPA} GPA`);
    
  } catch (error) {
    console.error('❌ Error adjusting CGPA:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

adjustCGPA();