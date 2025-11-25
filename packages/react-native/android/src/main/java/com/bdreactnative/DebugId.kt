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
     * Generates a debug ID from the JavaScript bundle's MD5 hash (UUID format).
     * Returns null if the bundle cannot be found or read.
     */
    fun fromBundle(assets: AssetManager): String? {
        return try {
            val md5Hash = calculateBundleMD5(assets)
            formatHashAsUUID(md5Hash)
        } catch (e: Exception) {
            Log.e(TAG, "Could not generate debug ID from bundle", e)
            null
        }
    }

    private fun calculateBundleMD5(assets: AssetManager): String {
        val messageDigest = MessageDigest.getInstance("MD5")
        
        assets.open(BUNDLE_FILE).use { inputStream ->
            val bundleBytes = inputStream.readBytes()
            messageDigest.update(bundleBytes)
        }
        
        val hashBytes = messageDigest.digest()
        return hashBytes.joinToString("") { "%02x".format(it) }
    }

    private fun formatHashAsUUID(hashHex: String): String {
        return "${hashHex.substring(0, 8)}-" +
               "${hashHex.substring(8, 12)}-" +
               "${hashHex.substring(12, 16)}-" +
               "${hashHex.substring(16, 20)}-" +
               "${hashHex.substring(20, 32)}"
    }
}
