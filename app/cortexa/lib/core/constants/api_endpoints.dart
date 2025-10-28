class ApiEndpoints {
  // Base URL - Update this with your actual backend URL
  static const String baseUrl = 'https://api.cortexa.com'; // Replace with your API
  
  // Authentication endpoints
  static const String login = '/auth/login';
  static const String signup = '/auth/signup';
  static const String logout = '/auth/logout';
  static const String refreshToken = '/auth/refresh';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String verifyEmail = '/auth/verify-email';
  
  // User endpoints
  static const String userProfile = '/user/profile';
  static const String updateProfile = '/user/update';
  static const String changePassword = '/user/change-password';
  
  // Institution endpoints
  static const String myInstitutions = '/institutions/my-institutions';
  static const String institutionDetails = '/institutions'; // + /{id}
  
  // Invitation endpoints
  static const String myInvitations = '/invitations/my-invitations';
  static const String acceptInvitation = '/invitations/accept'; // + /{id}
  static const String rejectInvitation = '/invitations/reject'; // + /{id}
  
  // Content endpoints
  static const String uploadNotes = '/content/notes/upload';
  static const String getNotes = '/content/notes';
  static const String deleteNote = '/content/notes'; // + /{id}
  
  // RAG Assistant endpoints
  static const String ragQuery = '/rag/query';
  static const String chatHistory = '/rag/history';
  
  // Helper method to build full URL
  static String buildUrl(String endpoint) => baseUrl + endpoint;
}
