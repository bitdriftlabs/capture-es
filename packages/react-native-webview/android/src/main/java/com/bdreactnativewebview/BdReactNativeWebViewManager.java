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
