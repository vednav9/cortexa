import 'package:flutter/material.dart';

class AppColors {
  // Primary Brand Colors - Cortexa Emerald/Teal Theme
  static const Color primary = Color(0xFF10B981); // Emerald green - main brand
  static const Color primaryDark = Color(0xFF059669); // Darker emerald
  static const Color primaryLight = Color(0xFF34D399); // Lighter emerald
  
  // Background Colors - Dark Green Theme
  static const Color background = Color(0xFF000000); // Pure black (nav/header)
  static const Color backgroundDark = Color(0xFF0D1F1A); // Very dark green
  static const Color backgroundGreen = Color(0xFF0A3D2C); // Dark green (hero section)
  static const Color surface = Color(0xFF1A1A1A); // Card/surface color
  static const Color cardBackground = Color(0xFF0F2A1F); // Card background green tint
  
  // Text Colors
  static const Color textPrimary = Color(0xFFFFFFFF); // Pure white
  static const Color textSecondary = Color(0xFFD1D5DB); // Light gray
  static const Color textTertiary = Color(0xFF9CA3AF); // Medium gray
  static const Color textMuted = Color(0xFF6B7280); // Muted gray
  
  // Accent & Highlight
  static const Color accent = Color(0xFF10B981); // Same as primary (emerald)
  static const Color accentGlow = Color(0xFF34D399); // Lighter glow effect
  
  // Status Colors
  static const Color success = Color(0xFF10B981); // Emerald (matches brand)
  static const Color error = Color(0xFFEF4444); // Red
  static const Color warning = Color(0xFFF59E0B); // Amber
  static const Color info = Color(0xFF3B82F6); // Blue
  
  // UI Elements
  static const Color border = Color(0xFF10B981); // Emerald borders
  static const Color borderDark = Color(0xFF374151); // Dark gray borders
  static const Color divider = Color(0xFF1F2937); // Subtle divider
  static const Color disabled = Color(0xFF4B5563); // Disabled state
  
  // Button Colors
  static const Color buttonPrimary = Color(0xFF10B981); // Filled button
  static const Color buttonSecondary = Colors.transparent; // Outline button
  static const Color buttonHover = Color(0xFF059669); // Hover state
  
  // Badge/Pill Colors
  static const Color badgeBackground = Color(0x1A10B981); // 10% opacity emerald
  static const Color badgeBorder = Color(0xFF10B981);
  static const Color badgeText = Color(0xFF10B981);
  
  // Gradient - Emerald to Lighter Emerald
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF10B981), Color(0xFF34D399)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  // Dark Green Gradient (for hero sections)
  static const LinearGradient backgroundGradient = LinearGradient(
    colors: [Color(0xFF0A3D2C), Color(0xFF0D1F1A)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
  
  // Glow Effect Color (for emphasis)
  static const Color glow = Color(0x4D10B981); // 30% opacity emerald
  
  // Shadow Colors
  static Color shadow = const Color(0xFF000000).withValues(alpha: 0.3);
  static Color shadowLight = const Color(0xFF000000).withValues(alpha: 0.1);
}
