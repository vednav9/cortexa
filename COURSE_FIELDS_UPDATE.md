# Course Management Update - New Fields Added

## Summary
Added two new fields to the Course model and management system:
1. **Semester Available** - References a specific Semester from the Semesters collection
2. **Faculty Available** - Array of Teacher references who can teach this course

## Backend Changes

### 1. Course Model (`backend/models/course.js`)
**Added Fields:**
```javascript
semesterAvailable: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Semester",
},
facultyAvailable: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher",
  },
],
```

### 2. Academic Controller (`backend/controllers/academicController.js`)

**createCourse:**
- Added `semesterAvailable` and `facultyAvailable` to request body extraction
- Added to course creation with default values (`null` for semester, `[]` for faculty)
- Added population for both fields in response

**updateCourse:**
- Added population for `semesterAvailable` and `facultyAvailable` fields

**getCourses:**
- Added population for both new fields when fetching courses list

## Frontend Changes

### 1. Courses Component State (`frontend/src/components/institution/academic/academic-structure/Courses.jsx`)

**Added State:**
```javascript
const [faculty, setFaculty] = useState([]);
```

**Updated formData:**
```javascript
{
  // ...existing fields
  semesterAvailable: '',
  facultyAvailable: [],
}
```

### 2. Data Fetching
- Added `academicAPI.getFaculty()` to fetchData Promise.all
- Properly parses faculty data from backend response
- Fetches faculty alongside courses, departments, and semesters

### 3. Form Fields

**Semester Available (Dropdown):**
- Optional field
- Dropdown showing all available semesters
- Display format: "Semester Name (Academic Year)"
- Example: "Fall 2024 (2024)"

**Faculty Available (Multi-select):**
- Optional field
- Multi-select dropdown (hold Ctrl/Cmd for multiple)
- Shows: "Faculty Name - Job Title"
- Stores array of teacher IDs
- Min height: 120px for better UX
- Helper text: "Hold Ctrl/Cmd to select multiple faculty members"

### 4. Form Logic
- **openModal:** Properly handles both fields when editing (extracts IDs from populated objects)
- **Reset:** Clears to empty string (semester) and empty array (faculty) when creating new course

## Field Descriptions

### Semester Available
- **Purpose:** Link the course to a specific semester period
- **Type:** Single selection from Semester collection
- **Required:** No (optional)
- **Example Use Case:** "CS101 is available in Fall 2024 semester"

### Faculty Available  
- **Purpose:** Indicate which faculty members are qualified/available to teach this course
- **Type:** Multiple selection from Teacher collection
- **Required:** No (optional)
- **Example Use Case:** "CS101 can be taught by Prof. Smith, Dr. Johnson, or Prof. Davis"

## Differences from Existing Fields

### vs. `semester` (Number):
- **semester:** Generic semester number (1-8) for curriculum placement
- **semesterAvailable:** Specific semester period from Semesters collection

### vs. `instructor` (Single Teacher):
- **instructor:** Currently assigned instructor for the course
- **facultyAvailable:** Pool of all qualified faculty who could teach it

## UI/UX Features

1. **Semester Available Dropdown:**
   - Clean dropdown showing semester name and year
   - Empty option to clear selection
   - Sorted by creation/date

2. **Faculty Available Multi-select:**
   - Native HTML multi-select (OS-specific styling)
   - Shows faculty name and job title
   - 120px height for comfortable selection
   - Helper text for multi-select instructions
   - Maintains selection order

## API Request/Response Examples

**Create Course Request:**
```json
{
  "code": "CS101",
  "name": "Introduction to Programming",
  "department": "dept_id",
  "credits": 3,
  "semester": 1,
  "semesterAvailable": "semester_id",
  "facultyAvailable": ["teacher_id_1", "teacher_id_2"],
  "maxCapacity": 60
}
```

**Get Course Response:**
```json
{
  "success": true,
  "data": {
    "_id": "course_id",
    "code": "CS101",
    "semesterAvailable": {
      "_id": "semester_id",
      "name": "Fall 2024",
      "academicYear": "2024"
    },
    "facultyAvailable": [
      {
        "_id": "teacher_id_1",
        "fullName": "Dr. John Smith",
        "jobTitle": "Professor"
      },
      {
        "_id": "teacher_id_2",
        "fullName": "Dr. Jane Doe",
        "jobTitle": "Associate Professor"
      }
    ]
  }
}
```

## Testing Checklist

- [ ] Create course with semester available selected
- [ ] Create course with multiple faculty selected
- [ ] Create course with no semester/faculty (optional fields)
- [ ] Edit course to add semester available
- [ ] Edit course to modify faculty available list
- [ ] Verify populated data displays correctly in course list
- [ ] Test multi-select keyboard shortcuts (Ctrl/Cmd)
- [ ] Verify API properly handles empty arrays

## Files Modified

**Backend:**
1. `backend/models/course.js` - Added two new fields
2. `backend/controllers/academicController.js` - Updated create, update, get methods

**Frontend:**
3. `frontend/src/components/institution/academic/academic-structure/Courses.jsx` - Added UI fields, state management, and data fetching

**Total Changes:** 3 files modified
**New Fields:** 2 (semesterAvailable, facultyAvailable)
**Backward Compatible:** Yes (both fields are optional)
