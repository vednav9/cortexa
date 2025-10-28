import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../auth/presentation/bloc/auth_event.dart';
import '../../../auth/presentation/bloc/auth_state.dart';

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key});
  
  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        if (state is AuthUnauthenticated) {
          context.go('/login');
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Cortexa Dashboard'),
          actions: [
            IconButton(
              icon: const Icon(Icons.logout),
              onPressed: () {
                // Show logout confirmation
                showDialog(
                  context: context,
                  builder: (dialogContext) => AlertDialog(
                    backgroundColor: AppColors.cardBackground,
                    title: const Text('Logout'),
                    content: const Text('Are you sure you want to logout?'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(dialogContext),
                        child: const Text('Cancel'),
                      ),
                      TextButton(
                        onPressed: () {
                          Navigator.pop(dialogContext);
                          context.read<AuthBloc>().add(const LogoutRequested());
                        },
                        child: const Text(
                          'Logout',
                          style: TextStyle(color: AppColors.error),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
        body: BlocBuilder<AuthBloc, AuthState>(
          builder: (context, state) {
            if (state is AuthAuthenticated) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.2),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.check_circle,
                          color: AppColors.primary,
                          size: 60,
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'Welcome back!',
                        style: Theme.of(context).textTheme.headlineLarge,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        state.user.fullName ?? state.user.username,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              color: AppColors.primary,
                            ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        state.user.email,
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              color: AppColors.textSecondary,
                            ),
                      ),
                      const SizedBox(height: 40),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.cardBackground,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: AppColors.borderDark.withOpacity(0.3),
                          ),
                        ),
                        child: Column(
                          children: [
                            const Icon(
                              Icons.construction,
                              color: AppColors.warning,
                              size: 40,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Dashboard Coming Soon',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'We\'re building awesome features for you!',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: AppColors.textSecondary,
                                  ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }
            return const Center(child: CircularProgressIndicator());
          },
        ),
      ),
    );
  }
}
