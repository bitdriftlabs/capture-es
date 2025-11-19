// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

package com.bdreactnative

import android.content.res.AssetManager
import android.util.Log
import java.security.MessageDigest

object DebugId {
    private const val TAG = "BdReactNative"
    private const val BUNDLE_FILE = "index.android.bundle"

    /**
     * Generates a debug ID from the main JavaScript bundle's MD5 hash
     * Returns null if the bundle cannot be found or read
     */
    fun fromBundle(assets: AssetManager): String? {
        return try {
            val bundleContent = assets.open(BUNDLE_FILE).bufferedReader().use { it.readText() }
            val md = MessageDigest.getInstance("MD5")
            val hashBytes = md.digest(bundleContent.toByteArray())
            val hashHex = hashBytes.joinToString("") { "%02x".format(it) }

            val uuid = hashHex.substring(0, 32)
            "${uuid.substring(0, 8)}-${uuid.substring(8, 12)}-${uuid.substring(12, 16)}-${uuid.substring(16, 20)}-${uuid.substring(20, 32)}"
        } catch (e: Exception) {
            Log.e(TAG, "Could not auto-generate debug ID from bundle", e)
            null
        }
    }
}

