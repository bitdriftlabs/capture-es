// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

import Foundation
import CryptoKit

enum DebugId {
    /// Generates a debug ID from the JavaScript bundle's MD5 hash.
    /// Returns nil if the bundle cannot be found or read.
    static func fromBundle() -> String? {
        // Try to read the raw JS bundle (copied during build)
        if let path = Bundle.main.path(forResource: "main", ofType: "jsbundle.source") {
            NSLog("[Bitdrift] Found main.jsbundle.source at: %@", path)
            if let bundleData = try? Data(contentsOf: URL(fileURLWithPath: path)) {
                NSLog("[Bitdrift] main.jsbundle.source size: %llu bytes", UInt64(bundleData.count))
                let digest = Insecure.MD5.hash(data: bundleData)
                let hash = digest.map { String(format: "%02x", $0) }.joined()
                NSLog("[Bitdrift] main.jsbundle.source MD5 hash: %@", hash)
                return hash
            } else {
                NSLog("[Bitdrift] Failed to read main.jsbundle.source data")
            }
        } else {
            NSLog("[Bitdrift] main.jsbundle.source not found in bundle")
        }

        // Fallback: read Hermes bytecode (won't match upload, but won't crash)
        guard let path = Bundle.main.path(forResource: "main", ofType: "jsbundle") else {
            NSLog("[Bitdrift] main.jsbundle not found in bundle")
            return nil
        }
        
        NSLog("[Bitdrift] Found main.jsbundle (bytecode) at: %@", path)
        
        guard let bundleData = try? Data(contentsOf: URL(fileURLWithPath: path)) else {
            NSLog("[Bitdrift] Failed to read main.jsbundle data")
            return nil
        }
        
        NSLog("[Bitdrift] main.jsbundle size: %llu bytes", UInt64(bundleData.count))
        
        let digest = Insecure.MD5.hash(data: bundleData)
        let hash = digest.map { String(format: "%02x", $0) }.joined()
        NSLog("[Bitdrift] main.jsbundle MD5 hash: %@", hash)
        
        return hash
    }
}