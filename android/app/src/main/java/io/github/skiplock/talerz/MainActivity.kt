package io.github.skiplock.talerz

import android.annotation.SuppressLint
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

/**
 * Talerz for Android: the Talerz web app in a WebView, plus a small bridge
 * (window.TalerzHealth) that reads steps, workouts, workout calories and weight
 * from Health Connect, where Samsung Health shares the Galaxy Watch data.
 */
class MainActivity : ComponentActivity() {

    companion object {
        const val START_URL = "https://skiplock.github.io/Talerz/"
        const val APP_HOST = "skiplock.github.io"
        const val APP_PATH = "/Talerz"
        const val HC_PACKAGE = "com.google.android.apps.healthdata"
        const val SAMSUNG_HEALTH_PACKAGE = "com.sec.android.app.shealth"

        val PERM_STEPS = HealthPermission.getReadPermission(StepsRecord::class)
        val PERM_EXERCISE = HealthPermission.getReadPermission(ExerciseSessionRecord::class)
        val PERM_CALORIES = HealthPermission.getReadPermission(TotalCaloriesBurnedRecord::class)
        val PERM_WEIGHT = HealthPermission.getReadPermission(WeightRecord::class)
        val PERMISSIONS = setOf(PERM_STEPS, PERM_EXERCISE, PERM_CALORIES, PERM_WEIGHT)
    }

    private lateinit var webView: WebView

    @Volatile
    private var pageAllowed = false
    private var pendingPermissionCall: String? = null
    private var pendingSave: Pair<String, String>? = null
    private var fileCallback: ValueCallback<Array<Uri>>? = null

    private val permissionLauncher = registerForActivityResult(
        PermissionController.createRequestPermissionResultContract()
    ) { _ ->
        val id = pendingPermissionCall
        pendingPermissionCall = null
        if (id != null) lifecycleScope.launch { resolve(id, true, statusJson()) }
    }

    private val fileLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val callback = fileCallback
        fileCallback = null
        callback?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data))
    }

    private val saveLauncher = registerForActivityResult(
        ActivityResultContracts.CreateDocument("application/json")
    ) { uri ->
        val pending = pendingSave
        pendingSave = null
        if (pending != null) {
            val (id, text) = pending
            if (uri == null) {
                resolve(id, false, errJson("cancelled", "Anulowano zapis."))
            } else {
                try {
                    contentResolver.openOutputStream(uri)?.use { it.write(text.toByteArray(Charsets.UTF_8)) }
                    resolve(id, true, "{}")
                } catch (e: Exception) {
                    resolve(id, false, errJson("write_failed", e.message ?: "Nie udało się zapisać pliku."))
                }
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        webView.setBackgroundColor(getColor(R.color.bg))
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            useWideViewPort = true
            loadWithOverviewMode = false
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            textZoom = 100
            mediaPlaybackRequiresUserGesture = true
            allowFileAccess = false
            allowContentAccess = false
            cacheMode = WebSettings.LOAD_DEFAULT
        }
        webView.addJavascriptInterface(Bridge(), "TalerzHealth")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url ?: return false
                if (isAppUrl(url)) return false
                if (url.scheme == "data" || url.scheme == "blob" || url.scheme == "about") return false
                openExternal(url)
                return true
            }

            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                pageAllowed = url != null && isAppUrl(Uri.parse(url))
            }

            override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
                if (request?.isForMainFrame == true) showOffline()
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = filePathCallback
                val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "*/*"
                }
                return try {
                    fileLauncher.launch(intent)
                    true
                } catch (e: ActivityNotFoundException) {
                    fileCallback = null
                    false
                }
            }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                webView.evaluateJavascript(
                    "(function(){try{return !!(window.__talerzBack&&window.__talerzBack());}catch(e){return false;}})()"
                ) { result ->
                    if (result != "true") {
                        if (webView.canGoBack()) webView.goBack() else moveTaskToBack(true)
                    }
                }
            }
        })

        if (savedInstanceState != null) webView.restoreState(savedInstanceState)
        if (webView.url == null) webView.loadUrl(START_URL)
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
        if (pageAllowed) webView.evaluateJavascript("window.__talerzResume&&window.__talerzResume()", null)
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    /* ---------- bridge ---------- */

    inner class Bridge {
        @JavascriptInterface
        fun call(id: String, method: String, args: String) {
            if (!pageAllowed) return
            runOnUiThread { handle(id, method, args) }
        }
    }

    private fun handle(id: String, method: String, argsJson: String) {
        val args = try { JSONObject(argsJson) } catch (e: Exception) { JSONObject() }
        when (method) {
            "status" -> lifecycleScope.launch { resolve(id, true, statusJson()) }

            "requestPermissions" -> {
                if (sdkStatus() != HealthConnectClient.SDK_AVAILABLE) {
                    resolve(id, false, errJson("unavailable", "Health Connect jest niedostępne."))
                    return
                }
                if (pendingPermissionCall != null) {
                    resolve(id, false, errJson("busy", "Okno uprawnień jest już otwarte."))
                    return
                }
                pendingPermissionCall = id
                try {
                    permissionLauncher.launch(PERMISSIONS)
                } catch (e: Exception) {
                    pendingPermissionCall = null
                    resolve(id, false, errJson("launch_failed", e.message ?: ""))
                }
            }

            "readDay" -> lifecycleScope.launch {
                try {
                    resolve(id, true, readDay(args.optString("date")))
                } catch (e: SecurityException) {
                    resolve(id, false, errJson("not_granted", "Brak uprawnień do danych."))
                } catch (e: Exception) {
                    resolve(id, false, errJson("read_failed", e.message ?: e.javaClass.simpleName))
                }
            }

            "openHealthConnect" -> {
                openHealthConnectSettings()
                resolve(id, true, "{}")
            }

            "installHealthConnect" -> {
                openPlayStore(HC_PACKAGE)
                resolve(id, true, "{}")
            }

            "openSamsungHealth" -> {
                val launch = packageManager.getLaunchIntentForPackage(SAMSUNG_HEALTH_PACKAGE)
                if (launch != null) {
                    startActivity(launch)
                    resolve(id, true, "{}")
                } else {
                    resolve(id, false, errJson("not_installed", "Nie znaleziono Samsung Health."))
                }
            }

            "saveFile" -> {
                pendingSave = id to args.optString("text")
                try {
                    saveLauncher.launch(args.optString("name", "talerz-kopia.json"))
                } catch (e: Exception) {
                    pendingSave = null
                    resolve(id, false, errJson("launch_failed", e.message ?: ""))
                }
            }

            else -> resolve(id, false, errJson("unknown_method", method))
        }
    }

    private fun resolve(id: String, ok: Boolean, payload: String) {
        runOnUiThread {
            if (!pageAllowed) return@runOnUiThread
            val js = "window.__talerzNativeResolve&&window.__talerzNativeResolve(" +
                JSONObject.quote(id) + "," + ok + "," + JSONObject.quote(payload) + ")"
            webView.evaluateJavascript(js, null)
        }
    }

    private fun errJson(code: String, message: String): String =
        JSONObject().put("code", code).put("message", message).toString()

    /* ---------- Health Connect ---------- */

    private fun sdkStatus(): Int = HealthConnectClient.getSdkStatus(this, HC_PACKAGE)

    private suspend fun statusJson(): String {
        val out = JSONObject()
        val sdk = sdkStatus()
        out.put(
            "sdk", when (sdk) {
                HealthConnectClient.SDK_AVAILABLE -> "available"
                HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> "update_required"
                else -> "unavailable"
            }
        )
        out.put("android", Build.VERSION.SDK_INT)
        out.put("appVersion", appVersion())
        out.put("samsungHealth", packageManager.getLaunchIntentForPackage(SAMSUNG_HEALTH_PACKAGE) != null)
        val granted = JSONArray()
        var all = false
        if (sdk == HealthConnectClient.SDK_AVAILABLE) {
            try {
                val g = HealthConnectClient.getOrCreate(this).permissionController.getGrantedPermissions()
                for (p in PERMISSIONS) if (p in g) granted.put(p.substringAfterLast('.'))
                all = g.containsAll(PERMISSIONS)
            } catch (e: Exception) {
                out.put("error", e.message ?: e.javaClass.simpleName)
            }
        }
        out.put("granted", granted)
        out.put("all", all)
        return out.toString()
    }

    private suspend fun readDay(date: String): String {
        val client = HealthConnectClient.getOrCreate(this)
        val granted = client.permissionController.getGrantedPermissions()
        val zone = ZoneId.systemDefault()
        val day = LocalDate.parse(date)
        val start = day.atStartOfDay(zone).toInstant()
        var end = day.plusDays(1).atStartOfDay(zone).toInstant()
        val now = Instant.now()
        if (end.isAfter(now)) end = now

        val out = JSONObject().put("date", date)
        val sessions = JSONArray()
        if (!end.isAfter(start)) {
            out.put("sessions", sessions)
            return out.toString()
        }
        val range = TimeRangeFilter.between(start, end)

        if (PERM_STEPS in granted) {
            val agg = client.aggregate(
                AggregateRequest(metrics = setOf(StepsRecord.COUNT_TOTAL), timeRangeFilter = range)
            )
            out.put("steps", agg[StepsRecord.COUNT_TOTAL] ?: 0L)
        }

        if (PERM_EXERCISE in granted) {
            val canReadCalories = PERM_CALORIES in granted
            val response = client.readRecords(ReadRecordsRequest(ExerciseSessionRecord::class, timeRangeFilter = range))
            for (s in response.records) {
                if (s.startTime.isBefore(start)) continue // belongs to the day it started
                val origin = s.metadata.dataOrigin.packageName
                val item = JSONObject()
                    .put("id", s.metadata.id)
                    .put("exerciseType", s.exerciseType)
                    .put("type", mapType(s.exerciseType))
                    .put("title", s.title ?: "")
                    .put("start", s.startTime.toEpochMilli())
                    .put("minutes", Duration.between(s.startTime, s.endTime).toMinutes())
                    .put("source", origin)
                if (canReadCalories) {
                    val calories = client.readRecords(
                        ReadRecordsRequest(
                            TotalCaloriesBurnedRecord::class,
                            timeRangeFilter = TimeRangeFilter.between(s.startTime, s.endTime)
                        )
                    )
                    val kcal = calories.records
                        .filter { it.metadata.dataOrigin.packageName == origin }
                        .sumOf { it.energy.inKilocalories }
                    item.put("totalKcal", kcal)
                }
                sessions.put(item)
            }
        }
        out.put("sessions", sessions)

        if (PERM_WEIGHT in granted) {
            val weights = client.readRecords(ReadRecordsRequest(WeightRecord::class, timeRangeFilter = range))
            weights.records.maxByOrNull { it.time }?.let { out.put("weight", it.weight.inKilograms) }
        }
        return out.toString()
    }

    private fun mapType(t: Int): String = when (t) {
        ExerciseSessionRecord.EXERCISE_TYPE_STRENGTH_TRAINING,
        ExerciseSessionRecord.EXERCISE_TYPE_WEIGHTLIFTING,
        ExerciseSessionRecord.EXERCISE_TYPE_CALISTHENICS,
        ExerciseSessionRecord.EXERCISE_TYPE_HIGH_INTENSITY_INTERVAL_TRAINING -> "silownia"

        ExerciseSessionRecord.EXERCISE_TYPE_SWIMMING_POOL,
        ExerciseSessionRecord.EXERCISE_TYPE_SWIMMING_OPEN_WATER -> "basen"

        ExerciseSessionRecord.EXERCISE_TYPE_BIKING,
        ExerciseSessionRecord.EXERCISE_TYPE_BIKING_STATIONARY -> "rower"

        ExerciseSessionRecord.EXERCISE_TYPE_RUNNING,
        ExerciseSessionRecord.EXERCISE_TYPE_RUNNING_TREADMILL -> "bieg"

        ExerciseSessionRecord.EXERCISE_TYPE_WALKING,
        ExerciseSessionRecord.EXERCISE_TYPE_HIKING -> "spacer"

        ExerciseSessionRecord.EXERCISE_TYPE_SOCCER,
        ExerciseSessionRecord.EXERCISE_TYPE_BASKETBALL,
        ExerciseSessionRecord.EXERCISE_TYPE_VOLLEYBALL,
        ExerciseSessionRecord.EXERCISE_TYPE_TENNIS,
        ExerciseSessionRecord.EXERCISE_TYPE_BADMINTON,
        ExerciseSessionRecord.EXERCISE_TYPE_TABLE_TENNIS,
        ExerciseSessionRecord.EXERCISE_TYPE_HANDBALL -> "gry"

        else -> "inne"
    }

    /* ---------- helpers ---------- */

    private fun isAppUrl(uri: Uri): Boolean =
        uri.scheme == "https" &&
            uri.host.equals(APP_HOST, ignoreCase = true) &&
            (uri.path ?: "").startsWith(APP_PATH, ignoreCase = true)

    private fun openExternal(uri: Uri) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, uri))
        } catch (e: ActivityNotFoundException) {
            // nothing can open it
        }
    }

    private fun openPlayStore(pkg: String) {
        try {
            startActivity(
                Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$pkg&url=healthconnect%3A%2F%2Fonboarding"))
                    .setPackage("com.android.vending")
            )
        } catch (e: ActivityNotFoundException) {
            openExternal(Uri.parse("https://play.google.com/store/apps/details?id=$pkg"))
        }
    }

    private fun openHealthConnectSettings() {
        val intent = if (Build.VERSION.SDK_INT >= 34) {
            Intent("android.health.connect.action.MANAGE_HEALTH_PERMISSIONS")
                .putExtra(Intent.EXTRA_PACKAGE_NAME, packageName)
        } else {
            Intent("androidx.health.ACTION_HEALTH_CONNECT_SETTINGS")
        }
        try {
            startActivity(intent)
        } catch (e: Exception) {
            try {
                startActivity(Intent("android.health.connect.action.HEALTH_HOME_SETTINGS"))
            } catch (ignored: Exception) {
                openPlayStore(HC_PACKAGE)
            }
        }
    }

    private fun appVersion(): String = try {
        val info = if (Build.VERSION.SDK_INT >= 33) {
            packageManager.getPackageInfo(packageName, PackageManager.PackageInfoFlags.of(0))
        } else {
            @Suppress("DEPRECATION")
            packageManager.getPackageInfo(packageName, 0)
        }
        info.versionName ?: ""
    } catch (e: Exception) {
        ""
    }

    private fun showOffline() {
        val html = """<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:sans-serif;margin:0;padding:56px 24px;background:#F3F5F8;color:#121820}@media (prefers-color-scheme:dark){body{background:#0E1115;color:#E8ECF1}}h1{font-size:28px;margin:0 0 12px}p{font-size:16px;line-height:1.5}a{display:inline-block;margin-top:16px;background:#1D4ED8;color:#fff;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:700}</style></head><body><h1>Brak internetu</h1><p>Talerz potrzebuje internetu przy pierwszym uruchomieniu. Potem działa także bez sieci.</p><a href="$START_URL">Spróbuj ponownie</a></body></html>"""
        webView.loadDataWithBaseURL(null, html, "text/html", "utf-8", null)
    }
}
