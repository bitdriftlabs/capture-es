// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

import Foundation
import CommonCrypto

enum DebugId {
    /// Generates a debug ID from the main JavaScript bundle's MD5 hash
    /// Returns nil if the bundle cannot be found or read
    static func fromBundle() -> String? {
        guard let bundlePath = Bundle.main.path(forResource: "main", ofType: "jsbundle") else {
            return nil
        }
        
        guard let bundleData = try? Data(contentsOf: URL(fileURLWithPath: bundlePath)) else {
            return nil
        }
        
        let hash = bundleData.md5()
        let uuid = String(hash.prefix(32))
        let debugId = "\(uuid.prefix(8))-\(uuid.dropFirst(8).prefix(4))-\(uuid.dropFirst(12).prefix(4))-\(uuid.dropFirst(16).prefix(4))-\(uuid.dropFirst(20).prefix(12))"
        
        return debugId
    }
}

extension Data {
    @available(iOS, deprecated: 13.0, message: "MD5 is deprecated but used for debug ID generation only")
    func md5() -> String {
        var digest = [UInt8](repeating: 0, count: Int(CC_MD5_DIGEST_LENGTH))
        _ = self.withUnsafeBytes { bytes in
            CC_MD5(bytes.baseAddress, CC_LONG(self.count), &digest)
        }
        return digest.map { String(format: "%02x", $0) }.joined()
    }
}

