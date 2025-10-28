import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../features/splash/presentation/pages/splash_page.dart';
import '../features/auth/presentation/pages/login_page.dart';
import '../features/auth/presentation/pages/signup_page.dart';
import '../features/auth/presentation/pages/forgot_password_page.dart';
import '../features/auth/presentation/pages/institute_signup_step1_page.dart';
import '../features/auth/presentation/pages/institute_signup_step2_page.dart';
import '../features/auth/presentation/pages/institute_signup_step3_page.dart';
import '../features/dashboard/presentation/pages/dashboard_page.dart';
import '../features/admin/data/models/institution_model.dart';

class AppRouter {
  static GoRouter router = GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: true,
    routes: [
      // Splash route
      GoRoute(
        path: '/',
        name: 'splash',
        builder: (context, state) => const SplashPage(),
      ),
      
      // Login route
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginPage(),
      ),
      
      // Signup route
      GoRoute(
        path: '/signup',
        name: 'signup',
        builder: (context, state) => const SignupPage(),
      ),
      
      // Forgot password route
      GoRoute(
        path: '/forgot-password',
        name: 'forgot-password',
        builder: (context, state) => const ForgotPasswordPage(),
      ),
      
      // Institution Signup - Step 1
      GoRoute(
        path: '/institute-signup',
        name: 'institute-signup',
        builder: (context, state) {
          final data = state.extra as InstitutionModel?;
          return InstituteSignupStep1Page(initialData: data);
        },
      ),
      
      // Institution Signup - Step 2
      GoRoute(
        path: '/institute-signup/step2',
        name: 'institute-signup-step2',
        builder: (context, state) {
          final data = state.extra as InstitutionModel;
          return InstituteSignupStep2Page(previousData: data);
        },
      ),
      
      // Institution Signup - Step 3
      GoRoute(
        path: '/institute-signup/step3',
        name: 'institute-signup-step3',
        builder: (context, state) {
          final data = state.extra as InstitutionModel;
          return InstituteSignupStep3Page(previousData: data);
        },
      ),
      
      // Dashboard route
      GoRoute(
        path: '/dashboard',
        name: 'dashboard',
        builder: (context, state) => const DashboardPage(),
      ),
    ],
    
    // Error page
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Text('Page not found: ${state.matchedLocation}'),
      ),
    ),
  );
}
