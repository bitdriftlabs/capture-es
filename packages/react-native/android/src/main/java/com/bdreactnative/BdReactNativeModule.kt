// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

package com.bdreactnative

import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import io.bitdrift.capture.Capture
import io.bitdrift.capture.providers.session.SessionStrategy
import io.bitdrift.capture.utils.SdkDirectory
import com.facebook.react.bridge.Promise
import okhttp3.HttpUrl.Companion.toHttpUrl
import kotlin.time.Duration
import kotlin.time.DurationUnit
import kotlin.time.toDuration
import io.bitdrift.capture.Configuration
import java.io.File

class BdReactNativeModule internal constructor(context: ReactApplicationContext) :
  BdReactNativeSpec(context) {

  override fun getName(): String {
    return NAME
  }

  @ReactMethod
  override fun init(key: String, sessionStrategy: String, options: ReadableMap?) {
    val apiUrl = options?.getString("url") ?: "https://api.bitdrift.io"
    val crashReportingOptions = options?.getMap("crashReporting")
    val enableNativeFatalIssues = crashReportingOptions?.getBoolean("enableNativeFatalIssues") ?: false
    val enableJsErrors = crashReportingOptions?.getBoolean("enableJsErrors") ?: false

    setupReportWatcherDirectory(enableJsErrors)

    val strategy =
    when (sessionStrategy) {
      "fixed" -> SessionStrategy.Fixed()
      "activity" -> SessionStrategy.ActivityBased()
      else -> throw IllegalArgumentException("Invalid session strategy: $sessionStrategy")
    }

    val configuration = if (enableNativeFatalIssues) {
      Configuration(enableFatalIssueReporting = true, enableNativeCrashReporting = true)
    } else {
      Configuration()
    }

    Capture.Logger.start(apiKey = key, apiUrl = apiUrl.toHttpUrl(), sessionStrategy = strategy, configuration = configuration)
  }

  @ReactMethod
  override fun getDeviceID(promise: Promise) {
    val deviceId = Capture.Logger.deviceId
    if (deviceId != null) {
        promise.resolve(deviceId)
    } else {
        promise.reject("device_id_undefined", "Device ID is undefined")
    }
  }

  @ReactMethod
  override fun getSessionID(promise: Promise) {
    val sessionId = Capture.Logger.sessionId
    if (sessionId != null) {
      promise.resolve(sessionId)
    } else {
      promise.reject("session_id_undefined", "Session ID is undefined")
    }
  }

  @ReactMethod
  override fun getSessionURL(promise: Promise) {
    val sessionUrl = Capture.Logger.sessionUrl
    if (sessionUrl != null) {
      promise.resolve(sessionUrl)
    } else {
      promise.reject("session_url_undefined", "Session URL is undefined")
    }
  }


  @ReactMethod
  override fun log(level: Double, message: String, jsFields: ReadableMap?) {
    val fields = jsFields?.toHashMap()?.mapValues { it.value.toString() } ?: emptyMap()

    when (level) {
      0.0 -> Capture.Logger.logTrace(fields) { message }
      1.0 -> Capture.Logger.logDebug(fields) { message }
      2.0 -> Capture.Logger.logInfo(fields) { message }
      3.0 -> Capture.Logger.logWarning(fields) { message }
      4.0 -> Capture.Logger.logError(fields) { message }
    }
  }

  @ReactMethod
  override fun addField(key: String, value: String) {
    Capture.Logger.addField(key, value)
  }

  @ReactMethod
  override fun removeField(key: String) {
    Capture.Logger.removeField(key)
  }

  @ReactMethod
  override fun logScreenView(screenView: String) {
    Capture.Logger.logScreenView(screenView)
  }

  @ReactMethod
  override fun logAppLaunchTTI(ttiMs: Double) {
    Capture.Logger.logAppLaunchTTI(ttiMs.toDuration(DurationUnit.MILLISECONDS))
  }

  @ReactMethod
  override fun reportJsError(
    errorName: String,
    message: String,
    stack: String,
    isFatal: Boolean,
    engine: String,
    debuggerId: String,
  ) {
    // TODO(Fran): Will be handled on a separate PR
  }

  private fun setupReportWatcherDirectory(enableJsErrors: Boolean) {
    runCatching {
      val watcherDir = File(SdkDirectory.getPath(reactApplicationContext), "reports/watcher")

      if (enableJsErrors) {
        createWatcherDirectory(watcherDir)
      } else {
        removeWatcherDirectory(watcherDir)
      }
    }.onFailure { error ->
      val action = if (enableJsErrors) "enable" else "disable"
      Log.w(NAME, "Failed to handle directory modifications for enableJsErrors $enableJsErrors: $error")
    }
  }

  private fun createWatcherDirectory(watcherDir: File) {
    if (!watcherDir.exists() && !watcherDir.mkdirs()) {
      Log.w(NAME, "Failed to create reports/watcher directory")
    }
  }

  private fun removeWatcherDirectory(watcherDir: File) {
    if (watcherDir.exists() && !watcherDir.deleteRecursively()) {
      Log.w(NAME, "Failed to delete reports/watcher directory")
    }
  }

  companion object {
    const val NAME = "BdReactNative"
  }
}
