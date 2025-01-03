// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

import Capture

@objc public class CAPRNLogger: NSObject {
    @objc public static func start(key: String, sessionStrategy: String, url: String?, enableNetworkInstrumentation: Bool) {
        let strategy = switch sessionStrategy {
            case "fixed":
                return SessionStrategy.fixed()
            case "activity":
                return SessionStrategy.activity()
            default:
                return SessionStrategy.fixed()
        }

        let integrator = Capture.Logger.start(
            withAPIKey: key,
            sessionStrategy: strategy
            apiURL: URL(string: url ?? "https://api.bitdrift.io")!
        )

        if enableNetworkInstrumentation {
            integrator?.enableIntegrations([.urlSession()])
        }
    }

    @objc
    public static func getDeviceID(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        let deviceID = Capture.Logger.deviceID
        if !deviceID.isEmpty {
            resolve(deviceID)
        } else {
            resolve("Unknown")
        }
    }

    @objc
    public static func log(_ level: Double, message: String, fields: [String: String]) {
        switch level {
        case 0.0:
            Capture.Logger.logTrace(message, fields: fields)
        case 1.0:
            Capture.Logger.logDebug(message, fields: fields)
        case 2.0:
            Capture.Logger.logInfo(message, fields: fields)
        case 3.0:
            Capture.Logger.logWarning(message, fields: fields)
        case 4.0:
            Capture.Logger.logError(message, fields: fields)
        default:
            return
        }
    }
}
