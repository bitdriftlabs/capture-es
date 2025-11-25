// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

import Foundation
import CryptoKit
import CommonCrypto

enum DebugId {
    /// Generates a debug ID from the JavaScript bundle's MD5 hash (UUID format).
    /// Returns nil if the bundle cannot be found or read.
    static func fromBundle() -> String? {
        guard let bundleData = loadBundleData() else {
            return nil
        }
        
        let md5Hash = bundleData.md5()
        return formatHashAsUUID(md5Hash)
    }
    
    private static func loadBundleData() -> Data? {
        guard let bundlePath = Bundle.main.path(forResource: "main", ofType: "jsbundle") else {
            return nil
        }
        
        return try? Data(contentsOf: URL(fileURLWithPath: bundlePath))
    }
    
    private static func formatHashAsUUID(_ hashHex: String) -> String {
        let uuid = String(hashHex.prefix(32))
        return "\(uuid.prefix(8))-" +
               "\(uuid.dropFirst(8).prefix(4))-" +
               "\(uuid.dropFirst(12).prefix(4))-" +
               "\(uuid.dropFirst(16).prefix(4))-" +
               "\(uuid.dropFirst(20).prefix(12))"
    }
}

extension Data {
    func md5() -> String {
        if #available(iOS 13.0, *) {
            let digest = Insecure.MD5.hash(data: self)
            return digest.map { String(format: "%02x", $0) }.joined()
        } else {
            return md5Legacy()
        }
    }
    
    @available(iOS, deprecated: 13.0)
    private func md5Legacy() -> String {
        var digest = [UInt8](repeating: 0, count: Int(CC_MD5_DIGEST_LENGTH))
        _ = self.withUnsafeBytes { bytes in
            CC_MD5(bytes.baseAddress, CC_LONG(self.count), &digest)
        }
        return digest.map { String(format: "%02x", $0) }.joined()
    }
}
