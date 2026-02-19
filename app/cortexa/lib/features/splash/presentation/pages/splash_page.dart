import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../auth/presentation/bloc/auth_state.dart';

/// Main splash page that handles routing after animation
class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {
  @override
  void initState() {
    super.initState();
    // Auth check is already triggered in main.dart when AuthBloc is created
    // No need to check again here
  }

  void _navigateBasedOnState(AuthState state) {
    if (!mounted) return;

    if (state is AuthAuthenticated) {
      // Navigate based on user role
      final userRole = state.user.role.toLowerCase();
      if (userRole == 'admin') {
        context.go('/admin-dashboard');
      } else {
        context.go('/user-dashboard');
      }
    } else {
      // Not authenticated, go to login
      context.go('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) {
        // Don't navigate immediately, let animation complete first
      },
      child: CortexaSplashScreen(
        onAnimationComplete: () {
          // Navigate based on current auth state after animation completes
          final currentState = context.read<AuthBloc>().state;
          _navigateBasedOnState(currentState);
        },
      ),
    );
  }
}

/// Animated splash screen widget
class CortexaSplashScreen extends StatefulWidget {
  final VoidCallback onAnimationComplete;

  const CortexaSplashScreen({super.key, required this.onAnimationComplete});

  @override
  State<CortexaSplashScreen> createState() => _CortexaSplashScreenState();
}

class _CortexaSplashScreenState extends State<CortexaSplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  // // Controls the fade-in of the final Logo
  // late Animation<double> _logoOpacity;
  // // Controls the fade-out of the particles
  // late Animation<double> _particleOpacity;

  @override
  void initState() {
    super.initState();
    // Hide status bar for full immersion
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 4),
    );

    // Particles fade out sharply at 3.0s - 3.5s
    // _particleOpacity = Tween<double>(begin: 1.0, end: 0.0).animate(
    //   CurvedAnimation(
    //     parent: _controller,
    //     curve: const Interval(0.75, 0.85, curve: Curves.easeOut),
    //   ),
    // );

    // // Logo fades in at 3.2s - 4.0s
    // _logoOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
    //   CurvedAnimation(
    //     parent: _controller,
    //     curve: const Interval(0.8, 1.0, curve: Curves.easeIn),
    //   ),
    // );

    _controller.forward().whenComplete(() {
      widget.onAnimationComplete();
    });
  }

  @override
  void dispose() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF0A3D2C), // AppColors.backgroundGreen
              Color(0xFF0D1F1A), // AppColors.backgroundDark
            ],
          ),
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Single clean particle layer - no overlap
            AnimatedBuilder(
              animation: _controller,
              builder: (context, child) {
                // Particles only visible from 0.0 to 0.625 (0-2.5s)
                // Complete fade out from 0.625 to 0.75 (2.5s-3.0s)
                double particleOpacity = 0.0;
                if (_controller.value < 0.625) {
                  particleOpacity = 1.0;
                } else if (_controller.value < 0.75) {
                  particleOpacity = 1.0 - ((_controller.value - 0.625) / 0.125);
                }
                
                return Opacity(
                  opacity: particleOpacity,
                  child: CustomPaint(
                    painter: DataStreamPainter(
                      progress: _controller.value,
                      colorPalette: [
                        const Color(0xFF10B981), // AppColors.primary
                        const Color(0xFF34D399), // AppColors.primaryLight
                      ],
                      particleStyle: ParticleStyle.trail,
                      particleCount: 150,
                    ),
                    size: Size.infinite,
                  ),
                );
              },
            ),

            // Logo - only visible after particles are completely gone
            AnimatedBuilder(
              animation: _controller,
              builder: (context, child) {
                // Logo fades in from 0.75 to 1.0 (3.0s-4.0s)
                double logoOpacity = 0.0;
                if (_controller.value > 0.75) {
                  logoOpacity = (_controller.value - 0.75) / 0.25;
                }
                
                return Opacity(
                  opacity: logoOpacity,
                  child: Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Logo Icon
                        const Icon(
                          Icons.school_rounded,
                          size: 100,
                          color: Color(0xFF10B981), // AppColors.primary
                        ),
                        const SizedBox(height: 24),
                        // Brand Name
                        ShaderMask(
                          shaderCallback: (bounds) => const LinearGradient(
                            colors: [
                              Color(0xFF10B981), // AppColors.primary
                              Color(0xFF34D399), // AppColors.primaryLight
                            ],
                          ).createShader(bounds),
                          child: const Text(
                            "Cortexa",
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 42,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 8.0,
                            ),
                          ),
                        ),
                        const SizedBox(height: 10),
                        // Subtitle
                        const Text(
                          "Education Reimagined",
                          style: TextStyle(
                            color: Color(0xFF34D399), // AppColors.primaryLight
                            fontSize: 20,
                            letterSpacing: 2.0,
                            fontWeight: FontWeight.w300,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

// -----------------------------------------------------------
// Custom Painter Logic - Simple and Clean
// -----------------------------------------------------------

enum ParticleStyle { trail, glow, spark }

class DataStreamPainter extends CustomPainter {
  final double progress;
  final List<Color> colorPalette;
  final ParticleStyle particleStyle;
  final int particleCount;
  
  static final Map<int, List<Particle>> _particleCache = {};

  DataStreamPainter({
    required this.progress,
    required this.colorPalette,
    this.particleStyle = ParticleStyle.trail,
    this.particleCount = 150,
  }) {
    _particleCache[particleCount] ??= List.generate(
      particleCount,
      (index) => Particle(colorPalette),
    );
  }

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final maxRadius = math.sqrt(size.width * size.width + size.height * size.height) / 1.5;
    final particles = _particleCache[particleCount]!;

    for (var p in particles) {
      double t = (progress * p.speedMultiplier).clamp(0.0, 1.0);
      
      if (t >= 1.0) continue;

      // Smooth easing with acceleration
      double currentRadius = maxRadius * math.pow(1 - t, 2.5);

      // Gentle spiral motion
      double spiralOffset = progress * math.pi * 1.5;
      double currentAngle = p.initialAngle + spiralOffset;

      double x = center.dx + currentRadius * math.cos(currentAngle);
      double y = center.dy + currentRadius * math.sin(currentAngle);

      double intensity = (1.0 - t).clamp(0.0, 1.0);

      // Simple particle rendering
      final paint = Paint()
        ..color = p.color.withValues(alpha: intensity * 0.8)
        ..style = PaintingStyle.fill;
      
      canvas.drawCircle(Offset(x, y), p.size, paint);
      
      // Subtle glow
      final glowPaint = Paint()
        ..color = p.color.withValues(alpha: intensity * 0.3)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4);
      
      canvas.drawCircle(Offset(x, y), p.size * 2, glowPaint);
    }
  }

  @override
  bool shouldRepaint(covariant DataStreamPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}

class Particle {
  late double initialAngle;
  late double speedMultiplier;
  late double size;
  late Color color;

  Particle(List<Color> palette) {
    final random = math.Random();
    initialAngle = random.nextDouble() * 2 * math.pi;
    speedMultiplier = 0.85 + random.nextDouble() * 0.3; // Consistent speed
    size = 2.0 + random.nextDouble() * 1.5; // Uniform size
    color = palette[random.nextInt(palette.length)];
  }
}
