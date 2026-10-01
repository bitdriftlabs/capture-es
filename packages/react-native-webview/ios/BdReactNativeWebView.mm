#import "BdReactNativeWebView.h"
#import <WebKit/WebKit.h>
#import <BdReactNative/BdReactNative-Swift.h>

@implementation BdReactNativeWebView {
  BOOL _bitdriftInstrumented;
}

- (void)didMoveToWindow
{
  [super didMoveToWindow];

  if (_bitdriftInstrumented || self.window == nil) {
    return;
  }

  WKWebView *webView = [self findWebViewInView:self];
  if (webView == nil) {
    return;
  }

  [CAPRNLogger instrumentWebView:webView];
  _bitdriftInstrumented = YES;
}

- (WKWebView *)findWebViewInView:(UIView *)view
{
  if ([view isKindOfClass:[WKWebView class]]) {
    return (WKWebView *)view;
  }

  for (UIView *subview in view.subviews) {
    WKWebView *webView = [self findWebViewInView:subview];
    if (webView != nil) {
      return webView;
    }
  }

  return nil;
}

@end
