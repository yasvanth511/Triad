package com.triad.app.core.network

import com.triad.app.core.AppConfig
import com.triad.app.data.ApiErrorResponse
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.KSerializer
import kotlinx.serialization.json.Json
import kotlinx.serialization.serializer
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.logging.HttpLoggingInterceptor
import java.io.IOException
import java.util.concurrent.TimeUnit

class ApiClientException(
    val statusCode: Int,
    val serverMessage: String,
) : IOException("Request failed ($statusCode): $serverMessage")

/**
 * Mirrors `APIClient.swift`. Sends JSON via OkHttp, supports multipart
 * file uploads, decodes via kotlinx.serialization.
 */
class ApiClient(
    private val config: AppConfig,
    private val client: OkHttpClient = defaultClient(),
    @PublishedApi internal val json: Json = TriadJson,
) {
    @Volatile
    var authToken: String? = null

    suspend inline fun <reified T> get(
        path: String,
        queryItems: List<Pair<String, String>> = emptyList(),
    ): T = perform(buildRequest(path, "GET", queryItems = queryItems), serializer())

    suspend inline fun <reified T, reified Body> post(path: String, body: Body): T =
        perform(
            buildRequest(path, "POST", jsonBody = encodeJson(body, serializer())),
            serializer<T>(),
        )

    suspend inline fun <reified T, reified Body> put(path: String, body: Body): T =
        perform(
            buildRequest(path, "PUT", jsonBody = encodeJson(body, serializer())),
            serializer<T>(),
        )

    suspend inline fun <reified Body> postEmptyResult(path: String, body: Body) {
        performEmpty(buildRequest(path, "POST", jsonBody = encodeJson(body, serializer())))
    }

    suspend fun delete(path: String) {
        performEmpty(buildRequest(path, "DELETE"))
    }

    suspend inline fun <reified T> upload(
        path: String,
        bytes: ByteArray,
        mimeType: String,
        fileName: String,
        fieldName: String = "file",
    ): T {
        val body = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart(
                fieldName,
                fileName,
                bytes.toRequestBody(mimeType.toMediaType()),
            )
            .build()
        return perform(
            buildRequest(path, "POST", multipartBody = body),
            serializer<T>(),
        )
    }

    @PublishedApi
    internal fun <T> encodeJson(body: T, serializer: KSerializer<T>): RequestBody {
        val text = json.encodeToString(serializer, body)
        return text.toRequestBody(JSON_MEDIA)
    }

    @PublishedApi
    internal fun buildRequest(
        path: String,
        method: String,
        queryItems: List<Pair<String, String>> = emptyList(),
        jsonBody: RequestBody? = null,
        multipartBody: RequestBody? = null,
    ): Request {
        val normalized = path.removePrefix("/")
        val urlBuilder = (config.apiBaseUrl.trimEnd('/') + "/" + normalized)
            .toHttpUrl().newBuilder()
        for ((k, v) in queryItems) urlBuilder.addQueryParameter(k, v)
        val builder = Request.Builder().url(urlBuilder.build())
        builder.header("Accept", "application/json")
        authToken?.let { builder.header("Authorization", "Bearer $it") }

        when {
            multipartBody != null -> builder.method(method, multipartBody)
            jsonBody != null -> {
                builder.method(method, jsonBody)
                builder.header("Content-Type", "application/json")
            }
            method == "GET" || method == "DELETE" -> builder.method(method, null)
            else -> builder.method(method, "{}".toRequestBody(JSON_MEDIA))
        }
        return builder.build()
    }

    @PublishedApi
    internal suspend fun <T> perform(
        request: Request,
        deserializer: KSerializer<T>,
    ): T = withContext(Dispatchers.IO) {
        client.newCall(request).execute().use { response ->
            val bodyString = response.body?.string().orEmpty()
            if (!response.isSuccessful) {
                val message = parseErrorMessage(bodyString) ?: response.message
                throw ApiClientException(response.code, message)
            }
            if (bodyString.isBlank()) {
                @Suppress("UNCHECKED_CAST")
                return@use Unit as T
            }
            json.decodeFromString(deserializer, bodyString)
        }
    }

    @PublishedApi
    internal suspend fun performEmpty(request: Request) = withContext(Dispatchers.IO) {
        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                val message = parseErrorMessage(response.body?.string().orEmpty())
                    ?: response.message
                throw ApiClientException(response.code, message)
            }
        }
    }

    private fun parseErrorMessage(body: String): String? {
        if (body.isBlank()) return null
        return try {
            val parsed = json.decodeFromString(ApiErrorResponse.serializer(), body)
            parsed.error ?: parsed.message
        } catch (_: Throwable) {
            null
        }
    }

    companion object {
        private val JSON_MEDIA = "application/json; charset=utf-8".toMediaType()

        fun defaultClient(): OkHttpClient {
            val logging = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BASIC
            }
            return OkHttpClient.Builder()
                .connectTimeout(20, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .writeTimeout(60, TimeUnit.SECONDS)
                .addInterceptor(logging)
                .build()
        }
    }
}
