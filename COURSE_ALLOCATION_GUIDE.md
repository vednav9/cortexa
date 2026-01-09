# Course Allocation System - Implementation Guide

## Overview
This document explains the new course allocation system implemented for students and teachers in the invitation workflow.

## Key Changes

### 1. **Student Invitations (CSV + Manual)**

#### Workflow:
1. Admin selects **Department** and **Semester**
2. System automatically finds ALL courses matching:
   - Same department
   - Same semester
3. Student is automatically enrolled in all matching courses
4. Works for both CSV bulk upload and manual entry

#### Database Changes:
- `Student` model now includes:
  - `department` (ObjectId ref to Department)
  - `semester` (ObjectId ref to Semester)
  - `enrolledCourses` (Array of ObjectId refs to Course)

#### Backend Logic:
```javascript
// In invitationController.js - createInvitation
if (recipientType === 'Student') {
    const matchingCourses = await Course.find({
        institution: institutionId,
        department: department,
        semesterAvailable: semester
    });
    coursesToAllocate = matchingCourses.map(c => c._id);
}

// When invitation is accepted
student.enrolledCourses = invitation.courses || [];
await Course.updateMany(
    { _id: { $in: invitation.courses } },
    { $addToSet: { enrolledStudents: student._id } }
);
```

### 2. **Teacher Invitations (Manual Entry Only)**

#### Workflow:
1. Admin selects **Department** and **Semester**
2. System shows filtered list of courses matching department + semester
3. Admin selects specific **Authorized Courses** (checkboxes)
4. Only selected courses are added to teacher's `authorizedCourses`
5. **CSV bulk upload is NOT available for teachers**

#### Database Changes:
- `Teacher` model now includes:
  - `department` (ObjectId ref to Department)
  - `semester` (ObjectId ref to Semester)
  - `authorizedCourses` (Array of ObjectId refs to Course)

#### Authorization Rules:
Teachers can:
- ✅ View all courses in the institution
- ✅ See course details for any course
- ✅ Use authorized courses for:
  - Upload notes
  - Generate MCQs
  - Voice-to-text features
  - Q&A portal access
  
Teachers cannot:
- ❌ Use unauthorized courses for protected features
- ❌ Upload content to unauthorized courses
- ❌ Generate MCQs for unauthorized courses

### 3. **Invitation Model Updates**

New fields added:
```javascript
{
  department: { type: ObjectId, ref: 'Department' },
  semester: { type: ObjectId, ref: 'Semester' },
  courses: [{ type: ObjectId, ref: 'Course' }]
}
```

### 4. **Course Authorization Middleware**

Created: `backend/middleware/courseAuth.js`

**Usage in routes:**
```javascript
import { checkCourseAuthorization } from '../middleware/courseAuth.js';

// Apply to protected routes
router.post('/notes/upload', authenticate, checkCourseAuthorization, uploadNotes);
router.post('/mcq/generate', authenticate, checkCourseAuthorization, generateMCQ);
```

**Helper functions:**
```javascript
// Check if teacher is authorized
const isAuthorized = await isTeacherAuthorizedForCourse(teacherId, courseId);

// Get all authorized courses
const courses = await getAuthorizedCourses(teacherId);
```

## Frontend Implementation

### InvitePeople Component Changes

#### New State Variables:
```javascript
const [departments, setDepartments] = useState([]);
const [semesters, setSemesters] = useState([]);
const [courses, setCourses] = useState([]);
const [selectedDepartment, setSelectedDepartment] = useState('');
const [selectedSemester, setSelectedSemester] = useState('');
const [selectedCourses, setSelectedCourses] = useState([]);
const [filteredCourses, setFilteredCourses] = useState([]);
```

#### CSV Upload (Students Only):
- Department and Semester dropdowns required
- Info box shows how many courses will be auto-assigned
- Bulk upload restricted to students only

#### Manual Entry:
- **For Students:**
  - Department + Semester required
  - Shows info about auto-enrollment
  - Displays count of courses that will be assigned

- **For Teachers:**
  - Department + Semester required
  - Shows filtered course list with checkboxes
  - At least one course must be selected
  - Info text explains authorization system

## API Endpoints

### Create Invitation (Manual)
```http
POST /api/invitations
Content-Type: application/json

{
  "institutionId": "...",
  "recipientType": "Student" | "Teacher",
  "email": "user@example.com",
  "fullName": "John Doe",
  "message": "Welcome!",
  "department": "departmentId",
  "semester": "semesterId",
  "courses": ["courseId1", "courseId2"] // Only for teachers
}
```

### Bulk Invite (Students Only)
```http
POST /api/invitations/bulk
Content-Type: application/json

{
  "institutionId": "...",
  "recipientType": "Student",
  "department": "departmentId",
  "semester": "semesterId",
  "users": [
    {
      "fullName": "John Doe",
      "email": "john@example.com",
      "message": "Welcome!"
    }
  ]
}
```

## How to Use Course Authorization

### Step 1: Import Middleware
```javascript
import { checkCourseAuthorization } from '../middleware/courseAuth.js';
```

### Step 2: Apply to Routes
```javascript
// Notes upload route
router.post(
  '/courses/:courseId/notes',
  authenticate,
  checkCourseAuthorization, // Add this
  uploadNotes
);
```

### Step 3: Handle in Controller
```javascript
export const uploadNotes = async (req, res) => {
  // Authorization already checked by middleware
  // req.courseAuthorization.isAuthorized will be true
  
  const { courseId } = req.params;
  // ... your upload logic
};
```

## Migration Guide

### For Existing Data:

1. **Students without department/semester:**
   - Can remain null until they complete profile
   - Admin can update via user management

2. **Teachers without authorized courses:**
   - Will have empty `authorizedCourses` array
   - Cannot access protected features until admin assigns courses
   - Admin should re-invite or manually update

3. **Existing courses:**
   - No changes needed
   - Continue to work normally

## Testing Checklist

### Student Invitation:
- [ ] CSV upload with department + semester
- [ ] Manual entry with department + semester
- [ ] Verify auto-enrollment in courses
- [ ] Check course appears in student's enrolled list
- [ ] Confirm student shows in course's enrolledStudents

### Teacher Invitation:
- [ ] Manual entry with course selection
- [ ] CSV upload shows error message
- [ ] Verify only selected courses in authorizedCourses
- [ ] Test course authorization middleware
- [ ] Confirm unauthorized course access is blocked

### Authorization:
- [ ] Teacher can access authorized course features
- [ ] Teacher cannot access unauthorized course features
- [ ] Proper error messages shown
- [ ] Admin can add/remove authorized courses

## Error Messages

### User-Facing:
- "Department and semester are required for students"
- "Department, semester, and at least one course are required for teachers"
- "Bulk invite is only available for students. Use manual entry for teachers."
- "You are not authorized to access this course. Please contact your administrator."

### Developer:
- "Course ID is required"
- "Teacher not found"
- "Error checking course authorization"

## Future Enhancements

1. **Bulk Edit Authorized Courses:**
   - Allow admin to bulk assign/remove courses for multiple teachers

2. **Course Access Request:**
   - Let teachers request access to additional courses
   - Admin approval workflow

3. **Temporary Access:**
   - Add expiry dates for course authorization
   - Auto-revoke after semester ends

4. **Analytics:**
   - Track course access patterns
   - Show teachers their authorized vs accessed courses

5. **Notifications:**
   - Notify teachers when new courses are authorized
   - Alert when trying to access unauthorized content
