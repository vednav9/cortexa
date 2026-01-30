# Institution Components Structure

This directory contains all institution-related components organized by role and functionality.

## Directory Structure

```
institution/
├── admin/              # Admin-only components
│   ├── ManageUsers.jsx
│   ├── InvitePeople.jsx
│   └── index.js
│
├── teacher/            # Teacher-specific components
│   ├── SeeStudents.jsx
│   ├── UploadNotes.jsx
│   ├── GenerateMCQ.jsx
│   ├── VoiceToText.jsx
│   ├── Assessment.jsx
│   └── index.js
│
├── student/            # Student-specific components
│   ├── RAGChatbot.jsx
│   └── index.js
│
├── shared/             # Components accessible to all roles
│   ├── Announcements.jsx
│   ├── QueryDesk.jsx
│   ├── QAPortal.jsx
│   ├── AIChatbot.jsx
│   └── index.js
│
├── academic/           # Academic structure management
│   ├── AcademicStructure.jsx
│   ├── academic-structure/
│   │   ├── Departments.jsx
│   │   ├── Courses.jsx
│   │   ├── Semesters.jsx
│   │   ├── Calendar.jsx
│   │   └── Faculty.jsx
│   └── index.js
│
└── [Core Components]
    ├── InstitutionHome.jsx
    ├── InstitutionMenu.jsx
    ├── InstitutionNavbar.jsx
    ├── CourseCatalog.jsx
    └── CourseDetails.jsx
```

## Component Categories

### Admin Components (`/admin`)
Components that require admin privileges:
- **ManageUsers**: User management interface (CRUD operations)
- **InvitePeople**: Send invitations to new users

### Teacher Components (`/teacher`)
Components for teacher-specific functionalities:
- **SeeStudents**: View and manage students
- **UploadNotes**: Upload course materials and notes
- **GenerateMCQ**: AI-powered MCQ generation
- **VoiceToText**: Speech-to-text for lectures
- **Assessment**: Create and grade assessments

### Student Components (`/student`)
Components for student-specific features:
- **RAGChatbot**: Q&A with course materials using RAG

### Shared Components (`/shared`)
Components accessible to all authenticated users:
- **Announcements**: View and manage announcements (CRUD for admin/teacher)
- **QueryDesk**: Help and support system
- **QAPortal**: Discussion forum
- **AIChatbot**: General AI assistance

### Academic Components (`/academic`)
Components for managing academic structure:
- **AcademicStructure**: Overview of academic organization
- **Departments**: Manage departments
- **Courses**: Manage courses
- **Semesters**: Manage semesters
- **Calendar**: Academic calendar
- **Faculty**: Manage faculty members

## Usage

Import components using the organized structure:

```jsx
// Admin components
import { ManageUsers, InvitePeople } from '@/components/institution/admin';

// Teacher components
import { SeeStudents, UploadNotes } from '@/components/institution/teacher';

// Shared components
import { Announcements, QueryDesk } from '@/components/institution/shared';

// Academic components
import { AcademicStructure, Departments } from '@/components/institution/academic';
```

## Implementation Status

### ✅ Completed (Backend + Frontend)
- Announcements (shared)
- InvitePeople (admin)
- ManageUsers (admin) - UI only, needs backend integration

### 🔄 Placeholder (Coming Soon)
All other components are placeholder pages with "Coming Soon" messages.

## Next Steps

1. Implement ManageUsers backend integration
2. Build Academic Structure components (departments, courses, faculty)
3. Implement Teacher features (upload notes, generate MCQ)
4. Implement Student features (MCQ tests, RAG chatbot)
5. Complete shared features (QueryDesk, QAPortal)
