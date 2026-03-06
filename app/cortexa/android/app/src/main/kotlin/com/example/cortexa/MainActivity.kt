package com.example.cortexa

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity : FlutterActivity() {

    private val SECRETS_CHANNEL = "com.example.cortexa/secrets"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, SECRETS_CHANNEL)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "getSecrets" -> result.success(
                        mapOf(
                            "GEMINI_API_KEY" to BuildConfig.GEMINI_API_KEY,
                            "API_BASE_URL"   to BuildConfig.API_BASE_URL,
                            "AI_BASE_URL"    to BuildConfig.AI_BASE_URL,
                        )
                    )
                    else -> result.notImplemented()
                }
            }
    }
}
