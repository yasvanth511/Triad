# kotlinx.serialization
-keepclassmembers class kotlinx.serialization.json.** { *; }
-keep,includedescriptorclasses class com.triad.app.**$$serializer { *; }
-keepclassmembers class com.triad.app.** { *** Companion; }
-keepclasseswithmembers class com.triad.app.** { kotlinx.serialization.KSerializer serializer(...); }

# OkHttp / Retrofit
-dontwarn okhttp3.**
-dontwarn retrofit2.**
-keep class kotlin.coroutines.Continuation { *; }
