// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

package com.bdreactnativewebview;

import androidx.annotation.NonNull;

import com.facebook.react.uimanager.ThemedReactContext;
import com.reactnativecommunity.webview.RNCWebViewManager;
import com.reactnativecommunity.webview.RNCWebViewWrapper;

import io.bitdrift.capture.webview.WebViewCapture;

/** A react-native-webview manager that instruments each WebView before its source is loaded. */
public final class BdReactNativeWebViewManager extends RNCWebViewManager {
  @Override
  public @NonNull String getName() {
    return "BdReactNativeWebView";
  }

  @Override
  public @NonNull RNCWebViewWrapper createViewInstance(@NonNull ThemedReactContext context) {
    RNCWebViewWrapper wrapper = super.createViewInstance(context);
    WebViewCapture.instrument(wrapper.getWebView());
    return wrapper;
  }
}
