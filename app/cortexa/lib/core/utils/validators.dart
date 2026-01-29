class Validators {
  // Email validation
  static String? validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Email is required';
    }
    
    // Trim whitespace
    value = value.trim();
    
    // Enhanced email regex
    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    );
    
    if (!emailRegex.hasMatch(value)) {
      return 'Please enter a valid email address';
    }
    
    // Check for common typos
    if (value.contains('..') || value.startsWith('.') || value.endsWith('.')) {
      return 'Invalid email format';
    }
    
    return null;
  }
  
  // Enhanced password validation with strength requirements
  static String? validatePassword(String? value, {bool requireStrong = true}) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    
    if (requireStrong) {
      // Check for uppercase
      if (!value.contains(RegExp(r'[A-Z]'))) {
        return 'Password must contain at least one uppercase letter';
      }
      
      // Check for lowercase
      if (!value.contains(RegExp(r'[a-z]'))) {
        return 'Password must contain at least one lowercase letter';
      }
      
      // Check for digit
      if (!value.contains(RegExp(r'[0-9]'))) {
        return 'Password must contain at least one number';
      }
      
      // Optional: Check for special character
      // if (!value.contains(RegExp(r'[!@#$%^&*(),.?":{}|<>]'))) {
      //   return 'Password must contain at least one special character';
      // }
    }
    
    // Check for common weak passwords
    final weakPasswords = ['password', '12345678', 'qwerty', 'abc123'];
    if (weakPasswords.contains(value.toLowerCase())) {
      return 'This password is too common. Please choose a stronger one';
    }
    
    return null;
  }
  
  // Username validation
  static String? validateUsername(String? value) {
    if (value == null || value.isEmpty) {
      return 'Username is required';
    }
    
    value = value.trim();
    
    if (value.length < 3) {
      return 'Username must be at least 3 characters';
    }
    
    if (value.length > 20) {
      return 'Username must be less than 20 characters';
    }
    
    // Only alphanumeric and underscores
    final usernameRegex = RegExp(r'^[a-zA-Z0-9_]+$');
    if (!usernameRegex.hasMatch(value)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    
    // Must start with a letter
    if (!value[0].contains(RegExp(r'[a-zA-Z]'))) {
      return 'Username must start with a letter';
    }
    
    return null;
  }
  
  // Required field validation
  static String? validateRequired(String? value, String fieldName) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName is required';
    }
    return null;
  }
  
  // Name validation
  static String? validateName(String? value) {
    if (value == null || value.isEmpty) {
      return 'Name is required';
    }
    
    value = value.trim();
    
    if (value.length < 2) {
      return 'Name must be at least 2 characters';
    }
    
    if (value.length > 50) {
      return 'Name must be less than 50 characters';
    }
    
    // Name should only contain letters, spaces, and common punctuation
    final nameRegex = RegExp(r"^[a-zA-Z\s.'-]+$");
    if (!nameRegex.hasMatch(value)) {
      return 'Name can only contain letters, spaces, and basic punctuation';
    }
    
    return null;
  }
  
  // Confirm password validation
  static String? validateConfirmPassword(String? value, String password) {
    if (value == null || value.isEmpty) {
      return 'Please confirm your password';
    }
    
    if (value != password) {
      return 'Passwords do not match';
    }
    
    return null;
  }
  
  // Phone number validation
  static String? validatePhone(String? value) {
    if (value == null || value.isEmpty) {
      return 'Phone number is required';
    }
    
    value = value.trim();
    
    // Remove common formatting characters
    final digitsOnly = value.replaceAll(RegExp(r'[\s\-\(\)]'), '');
    
    // Check if it's all digits
    if (!RegExp(r'^[0-9]+$').hasMatch(digitsOnly)) {
      return 'Phone number can only contain numbers';
    }
    
    // Check length (10 digits for most countries)
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return 'Please enter a valid phone number (10-15 digits)';
    }
    
    return null;
  }
  
  // URL validation
  static String? validateURL(String? value, {bool required = false}) {
    if (value == null || value.trim().isEmpty) {
      return required ? 'Website URL is required' : null;
    }
    
    value = value.trim();
    
    // Basic URL regex
    final urlRegex = RegExp(
      r'^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$',
      caseSensitive: false,
    );
    
    if (!urlRegex.hasMatch(value)) {
      return 'Please enter a valid URL (e.g., https://example.com)';
    }
    
    return null;
  }
}
