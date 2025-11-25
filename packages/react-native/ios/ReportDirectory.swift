// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

import Foundation

enum ReportDirectory {
    /// Returns the SDK base directory in Application Support
    static func sdkBaseDirectory() -> URL? {
        let fileManager = FileManager.default
        return try? fileManager.url(
            for: .applicationSupportDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        )
    }
    
    /// Ensures the SDK directory exists and returns its path
    static func ensureSDKDirectory() -> URL? {
        guard let baseDir = sdkBaseDirectory() else {
            return nil
        }
        
        let sdkDir = baseDir.appendingPathComponent("bitdrift_capture", isDirectory: true)
        let fileManager = FileManager.default
        
        if !fileManager.fileExists(atPath: sdkDir.path) {
            do {
                try fileManager.createDirectory(at: sdkDir, withIntermediateDirectories: true)
            } catch {
                return nil
            }
        }
        
        return sdkDir
    }
    
    /// Returns the reports directory path for the given error type
    /// Creates the directory if it doesn't exist
    static func reportsDirectory(isFatal: Bool) -> URL? {
        guard let sdkDir = ensureSDKDirectory() else {
            return nil
        }
        
        let reportsDir: URL
        if isFatal {
            reportsDir = sdkDir.appendingPathComponent("reports/new", isDirectory: true)
        } else {
            reportsDir = sdkDir.appendingPathComponent("reports/watcher/current_session", isDirectory: true)
        }
        
        let fileManager = FileManager.default
        if !fileManager.fileExists(atPath: reportsDir.path) {
            do {
                try fileManager.createDirectory(at: reportsDir, withIntermediateDirectories: true)
            } catch {
                return nil
            }
        }
        
        guard fileManager.isWritableFile(atPath: reportsDir.path) else {
            return nil
        }
        
        return reportsDir
    }
    
    /// Generates a destination path for a JavaScript error report
    static func destinationPath(isFatal: Bool) -> String? {
        guard let reportsDir = reportsDirectory(isFatal: isFatal) else {
            return nil
        }
        
        let fileName = isFatal
            ? "javascript-fatal-\(UUID().uuidString).cap"
            : "javascript-non-fatal-\(UUID().uuidString).cap"
        
        return reportsDir.appendingPathComponent(fileName).path
    }
}

