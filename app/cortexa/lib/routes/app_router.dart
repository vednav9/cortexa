import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../features/splash/presentation/pages/splash_page.dart';
import '../features/auth/presentation/pages/login_page.dart';
import '../features/auth/presentation/pages/signup_page.dart';
import '../features/auth/presentation/pages/forgot_password_page.dart';
import '../features/auth/presentation/pages/institute_signup_step1_page.dart';
import '../features/auth/presentation/pages/institute_signup_step2_page.dart';
import '../features/auth/presentation/pages/institute_signup_step3_page.dart';
import '../features/dashboard/presentation/pages/admin_dashboard_page.dart';
import '../features/dashboard/presentation/pages/user_dashboard_page.dart';
import '../features/dashboard/presentation/pages/institution_detail_page.dart';
import '../features/dashboard/data/models/institution_display_model.dart';
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
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const SplashPage(),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
        ),
      ),
      
      // Login route
      GoRoute(
        path: '/login',
        name: 'login',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const LoginPage(),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            const begin = Offset(1.0, 0.0);
            const end = Offset.zero;
            const curve = Curves.easeInOutCubic;
            var tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
            return SlideTransition(position: animation.drive(tween), child: child);
          },
        ),
      ),
      
      // Signup route
      GoRoute(
        path: '/signup',
        name: 'signup',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const SignupPage(),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            const begin = Offset(1.0, 0.0);
            const end = Offset.zero;
            const curve = Curves.easeInOutCubic;
            var tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
            return SlideTransition(position: animation.drive(tween), child: child);
          },
        ),
      ),
      
      // Forgot password route
      GoRoute(
        path: '/forgot-password',
        name: 'forgot-password',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const ForgotPasswordPage(),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            const begin = Offset(1.0, 0.0);
            const end = Offset.zero;
            const curve = Curves.easeInOutCubic;
            var tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
            return SlideTransition(position: animation.drive(tween), child: child);
          },
        ),
      ),
      
      // Institution Signup - Step 1
      GoRoute(
        path: '/institute-signup',
        name: 'institute-signup',
        pageBuilder: (context, state) {
          final data = state.extra as InstitutionModel?;
          return CustomTransitionPage(
            key: state.pageKey,
            child: InstituteSignupStep1Page(initialData: data),
            transitionsBuilder: (context, animation, secondaryAnimation, child) {
              const begin = Offset(1.0, 0.0);
              const end = Offset.zero;
              const curve = Curves.easeInOutCubic;
              var tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
              return SlideTransition(position: animation.drive(tween), child: child);
            },
          );
        },
      ),
      
      // Institution Signup - Step 2
      GoRoute(
        path: '/institute-signup/step2',
        name: 'institute-signup-step2',
        pageBuilder: (context, state) {
          final data = state.extra as InstitutionModel;
          return CustomTransitionPage(
            key: state.pageKey,
            child: InstituteSignupStep2Page(previousData: data),
            transitionsBuilder: (context, animation, secondaryAnimation, child) {
              const begin = Offset(1.0, 0.0);
              const end = Offset.zero;
              const curve = Curves.easeInOutCubic;
              var tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
              return SlideTransition(position: animation.drive(tween), child: child);
            },
          );
        },
      ),
      
      // Institution Signup - Step 3
      GoRoute(
        path: '/institute-signup/step3',
        name: 'institute-signup-step3',
        pageBuilder: (context, state) {
          final data = state.extra as InstitutionModel;
          return CustomTransitionPage(
            key: state.pageKey,
            child: InstituteSignupStep3Page(previousData: data),
            transitionsBuilder: (context, animation, secondaryAnimation, child) {
              const begin = Offset(1.0, 0.0);
              const end = Offset.zero;
              const curve = Curves.easeInOutCubic;
              var tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
              return SlideTransition(position: animation.drive(tween), child: child);
            },
          );
        },
      ),
      
      // Admin Dashboard (for admins)
      GoRoute(
        path: '/admin-dashboard',
        name: 'admin-dashboard',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const AdminDashboardPage(),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
        ),
      ),
      
      // User Dashboard (for teachers and students)
      GoRoute(
        path: '/user-dashboard',
        name: 'user-dashboard',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const UserDashboardPage(),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
        ),
      ),
      
      // Institution Detail Page
      GoRoute(
        path: '/institution/:id',
        name: 'institution-detail',
        pageBuilder: (context, state) {
          final institution = state.extra as InstitutionDisplayModel;
          return CustomTransitionPage(
            key: state.pageKey,
            child: InstitutionDetailPage(institution: institution),
            transitionsBuilder: (context, animation, secondaryAnimation, child) {
              const begin = Offset(0.0, 1.0);
              const end = Offset.zero;
              const curve = Curves.easeInOutCubic;
              var tween = Tween(begin: begin, end: end).chain(CurveTween(curve: curve));
              return SlideTransition(position: animation.drive(tween), child: child);
            },
          );
        },
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
