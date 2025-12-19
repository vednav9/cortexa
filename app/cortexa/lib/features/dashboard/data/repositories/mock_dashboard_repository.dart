import '../models/institution_display_model.dart';
import '../models/invitation_model.dart';

/// Mock repository for dashboard data
/// Replace with real API calls later
class MockDashboardRepository {
  // Simulate network delay
  Future<void> _delay() => Future.delayed(const Duration(milliseconds: 500));

  /// Get all institutions (worldwide/nationwide list)
  Future<List<InstitutionDisplayModel>> getInstitutions({
    String? searchQuery,
    String? typeFilter,
    String? countryFilter,
  }) async {
    await _delay();

    // Mock data - in real app, this would be an API call
    final allInstitutions = _getMockInstitutions();

    // Apply filters
    var filtered = allInstitutions;

    if (searchQuery != null && searchQuery.isNotEmpty) {
      filtered = filtered
          .where((inst) =>
              inst.name.toLowerCase().contains(searchQuery.toLowerCase()) ||
              inst.city.toLowerCase().contains(searchQuery.toLowerCase()))
          .toList();
    }

    if (typeFilter != null && typeFilter.isNotEmpty) {
      filtered = filtered.where((inst) => inst.type == typeFilter).toList();
    }

    if (countryFilter != null && countryFilter.isNotEmpty) {
      filtered =
          filtered.where((inst) => inst.country == countryFilter).toList();
    }

    return filtered;
  }

  /// Get invitations for current user (Teachers and Students only)
  Future<List<InvitationModel>> getInvitations({
    InvitationStatus? statusFilter,
  }) async {
    await _delay();

    final allInvitations = _getMockInvitations();

    if (statusFilter != null) {
      return allInvitations.where((inv) => inv.status == statusFilter).toList();
    }

    return allInvitations;
  }

  /// Accept an invitation
  Future<void> acceptInvitation(String invitationId) async {
    await _delay();
    print('✅ Accepted invitation: $invitationId');
    // In real app, make API call to accept invitation
  }

  /// Reject an invitation
  Future<void> rejectInvitation(String invitationId) async {
    await _delay();
    print('❌ Rejected invitation: $invitationId');
    // In real app, make API call to reject invitation
  }

  /// Get list of countries for filter dropdown
  List<String> getCountries() {
    return [
      'United States',
      'United Kingdom',
      'India',
      'Canada',
      'Australia',
      'Germany',
      'France',
      'Japan',
      'Singapore',
      'United Arab Emirates',
    ];
  }

  /// Get list of institution types for filter dropdown
  List<String> getInstitutionTypes() {
    return [
      'Institute',
      'College',
      'School',
      'Training Center',
    ];
  }

  // ===== Mock Data =====

  List<InstitutionDisplayModel> _getMockInstitutions() {
    return [
      InstitutionDisplayModel(
        id: '1',
        name: 'Massachusetts Institute of Technology',
        type: 'Institute',
        logoUrl: null,
        city: 'Cambridge',
        country: 'United States',
        description:
            'Leading research university focused on science and technology.',
        customUrlSlug: 'mit',
        primaryBrandColor: '#A31F34',
        isOwnInstitution: true, // Current user's institution
        studentCount: 11520,
        teacherCount: 1050,
        createdAt: DateTime.now().subtract(const Duration(days: 365)),
      ),
      InstitutionDisplayModel(
        id: '2',
        name: 'Stanford University',
        type: 'College',
        logoUrl: null,
        city: 'Stanford',
        country: 'United States',
        description:
            'Private research university known for entrepreneurship and innovation.',
        customUrlSlug: 'stanford',
        primaryBrandColor: '#8C1515',
        studentCount: 16914,
        teacherCount: 2288,
        createdAt: DateTime.now().subtract(const Duration(days: 300)),
      ),
      InstitutionDisplayModel(
        id: '3',
        name: 'University of Oxford',
        type: 'College',
        logoUrl: null,
        city: 'Oxford',
        country: 'United Kingdom',
        description:
            'Oldest university in the English-speaking world with over 900 years of history.',
        customUrlSlug: 'oxford',
        primaryBrandColor: '#002147',
        studentCount: 26000,
        teacherCount: 3500,
        createdAt: DateTime.now().subtract(const Duration(days: 250)),
      ),
      InstitutionDisplayModel(
        id: '4',
        name: 'Indian Institute of Technology Bombay',
        type: 'Institute',
        logoUrl: null,
        city: 'Mumbai',
        country: 'India',
        description:
            'Premier engineering and technology institution in India.',
        customUrlSlug: 'iitb',
        primaryBrandColor: '#003366',
        studentCount: 10500,
        teacherCount: 650,
        createdAt: DateTime.now().subtract(const Duration(days: 200)),
      ),
      InstitutionDisplayModel(
        id: '5',
        name: 'Singapore Management University',
        type: 'College',
        logoUrl: null,
        city: 'Singapore',
        country: 'Singapore',
        description:
            'Leading business and management university in Asia.',
        customUrlSlug: 'smu',
        primaryBrandColor: '#0055A6',
        studentCount: 11000,
        teacherCount: 500,
        createdAt: DateTime.now().subtract(const Duration(days: 150)),
      ),
      InstitutionDisplayModel(
        id: '6',
        name: 'Greenwood High School',
        type: 'School',
        logoUrl: null,
        city: 'Toronto',
        country: 'Canada',
        description:
            'Excellence in secondary education with focus on STEM.',
        customUrlSlug: 'greenwood',
        primaryBrandColor: '#2D5016',
        studentCount: 1200,
        teacherCount: 85,
        createdAt: DateTime.now().subtract(const Duration(days: 100)),
      ),
      InstitutionDisplayModel(
        id: '7',
        name: 'TechSkills Training Center',
        type: 'Training Center',
        logoUrl: null,
        city: 'Berlin',
        country: 'Germany',
        description:
            'Professional IT and software development training programs.',
        customUrlSlug: 'techskills',
        primaryBrandColor: '#FF6B35',
        studentCount: 850,
        teacherCount: 42,
        createdAt: DateTime.now().subtract(const Duration(days: 50)),
      ),
      InstitutionDisplayModel(
        id: '8',
        name: 'University of Melbourne',
        type: 'College',
        logoUrl: null,
        city: 'Melbourne',
        country: 'Australia',
        description:
            'Leading Australian university with strong research focus.',
        customUrlSlug: 'unimelb',
        primaryBrandColor: '#003B66',
        studentCount: 51000,
        teacherCount: 6500,
        createdAt: DateTime.now().subtract(const Duration(days: 400)),
      ),
    ];
  }

  List<InvitationModel> _getMockInvitations() {
    return [
      InvitationModel(
        id: 'inv_1',
        institutionId: '2',
        institutionName: 'Stanford University',
        institutionLogoUrl: '',
        institutionType: 'College',
        invitedByName: 'Dr. Sarah Johnson',
        invitedByEmail: 'sarah.johnson@stanford.edu',
        invitedAt: DateTime.now().subtract(const Duration(days: 5)),
        status: InvitationStatus.pending,
        message:
            'Welcome to Stanford! We are excited to have you join our Computer Science department.',
      ),
      InvitationModel(
        id: 'inv_2',
        institutionId: '4',
        institutionName: 'Indian Institute of Technology Bombay',
        institutionLogoUrl: '',
        institutionType: 'Institute',
        invitedByName: 'Prof. Rajesh Kumar',
        invitedByEmail: 'rajesh@iitb.ac.in',
        invitedAt: DateTime.now().subtract(const Duration(days: 12)),
        status: InvitationStatus.pending,
        message:
            'Join our Electrical Engineering department for the upcoming semester.',
      ),
      InvitationModel(
        id: 'inv_3',
        institutionId: '3',
        institutionName: 'University of Oxford',
        institutionLogoUrl: '',
        institutionType: 'College',
        invitedByName: 'Dr. Emily Watson',
        invitedByEmail: 'emily.watson@ox.ac.uk',
        invitedAt: DateTime.now().subtract(const Duration(days: 30)),
        status: InvitationStatus.accepted,
        message: 'We look forward to your contributions to the Mathematics faculty.',
      ),
    ];
  }
}
