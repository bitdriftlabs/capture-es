// capture-es - bitdrift's ES SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

// capture-sdk - bitdrift's client SDK
// Copyright Bitdrift, Inc. All rights reserved.
//
// Use of this source code is governed by a source available license that can be found in the
// LICENSE file or at:
// https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt

#[cfg(test)]
#[path = "./integration_test.rs"]
mod integration_test;

use crate::SessionStrategy;
use bd_client_common::error::handle_unexpected;
use bd_key_value::Storage;
use bd_logger::{
  AnnotatedLogFields,
  InitParams,
  LogFieldValue,
  LogFields,
  LogLevel,
  LogType,
  LoggerBuilder,
};
use bd_metadata::Platform;
use bd_session::fixed::{self, UUIDCallbacks};
use bd_session::{activity_based, Store, Strategy};
use bd_time::SystemTimeProvider;
use std::collections::HashMap;
use std::hash::{DefaultHasher, Hash, Hasher};
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Instant;
use time::Duration;
use tokio::try_join;

//
// RustLogger
//

pub struct RustLogger {
  _logger: bd_logger::Logger,
  handle: bd_logger::LoggerHandle,
  session_strategy: Arc<Strategy>,
  device: Arc<bd_logger::Device>,
}

impl RustLogger {
  pub fn new(
    api_key: String,
    api_address: &str,
    session_strategy: SessionStrategy,
    sdk_directory: String,
    app_id: String,
    app_version: String,
    os: String,
    os_version: String,
    locale: String,
  ) -> anyhow::Result<Self> {
    let start = Instant::now();
    let sdk_directory = PathBuf::from(sdk_directory);

    let storage = Box::new(DiskStorage::new(sdk_directory.join("storage"))?);
    let store = Arc::new(Store::new(storage));
    let device = Arc::new(bd_device::Device::new(store.clone()));
    let device_clone = device.clone();
    let session_strategy = Arc::new(match session_strategy {
      SessionStrategy::ActivityBased => Strategy::ActivityBased(activity_based::Strategy::new(
        // This matches the default used on the mobile SDK. We may want to make this
        // configurable at some point in the future.
        Duration::minutes(30),
        store.clone(),
        Arc::new(SessionCallbacks),
        Arc::new(SystemTimeProvider),
      )),
      SessionStrategy::Fixed => {
        Strategy::Fixed(fixed::Strategy::new(store.clone(), Arc::new(UUIDCallbacks)))
      },
    });
    let session_strategy_clone = session_strategy.clone();
    let shutdown = bd_shutdown::ComponentShutdownTrigger::default();

    let metadata_provider = Arc::new(MetadataProvider::new(
      app_id.clone(),
      app_version.clone(),
      os,
      os_version,
      locale,
    ));

    let static_metadata = Arc::new(StaticMetadata::new(
      app_id,
      app_version,
      // TODO(snowp): This hard codes electron for now, we may want to make this derived from the
      // env so that we can have this code work for both electron apps and other node-based
      // programs.
      Platform::Electron,
      device.id(),
    ));

    let (network, handle) =
      bd_hyper_network::HyperNetwork::new(api_address, shutdown.make_shutdown());

    let reporter = {
      let (reporter, handle) =
        bd_hyper_network::ErrorReporter::new(api_address.to_string(), api_key.clone());

      let handle = bd_client_common::error::MetadataErrorReporter::new(
        Arc::new(handle),
        Arc::new(SessionProvider {
          strategy: session_strategy.clone(),
        }),
        static_metadata.clone(),
      );

      bd_client_common::error::UnexpectedErrorHandler::set_reporter(Arc::new(handle));

      reporter
    };

    let (logger, _, logger_future, _) = LoggerBuilder::new(InitParams {
      sdk_directory,
      api_key,
      session_strategy: session_strategy_clone,
      store,
      metadata_provider,
      resource_utilization_target: Box::new(EmptyTarget),
      session_replay_target: Box::new(EmptyTarget),
      events_listener_target: Box::new(EmptyTarget),
      device: device_clone,
      network: Box::new(handle),
      static_metadata,
    })
    .with_client_stats(true)
    .build()?;

    LoggerBuilder::run_logger_runtime(async {
      // Make sure we hold onto the shutdown handle to avoid an immediate shutdown.
      #[allow(clippy::no_effect_underscore_binding)]
      let _shutdown = shutdown;

      // Since the error reporting relies on the reporter future we need to make sure that we give
      // the reporter a chance to report on the error returned from the top level task. To
      // accomplish this we run the reporter in a separate task that we allow to finish after the
      // logger future has completed.

      let reporter_task = tokio::spawn(reporter.start());
      handle_unexpected(try_join!(network.start(), logger_future), "top level task");
      reporter_task.await?;

      Ok(())
    })?;

    let handle = logger.new_logger_handle();

    handle.log_sdk_start([].into(), start.elapsed().try_into().unwrap_or_default());

    Ok(Self {
      _logger: logger,
      handle,
      session_strategy,
      device,
    })
  }

  pub fn log(&self, log_level: LogLevel, message: String, fields: AnnotatedLogFields) {
    self.handle.log(
      log_level,
      LogType::Normal,
      message.into(),
      fields,
      [].into(),
      None,
      false,
    );
  }

  pub fn log_session_replay_screen(&self, fields: AnnotatedLogFields, duration: Duration) {
    self.handle.log_session_replay_screen(fields, duration);
  }

  pub fn session_id(&self) -> String {
    self.session_strategy.session_id()
  }

  pub fn device_id(&self) -> String {
    self.device.id()
  }

  pub fn add_field(&self, key: String, value: LogFieldValue) {
    self.handle.add_log_field(key, value);
  }

  pub fn remove_field(&self, key: &str) {
    self.handle.remove_log_field(key);
  }
}

struct SessionProvider {
  strategy: Arc<Strategy>,
}

impl bd_client_common::error::SessionProvider for SessionProvider {
  fn session_id(&self) -> String {
    self.strategy.session_id()
  }
}

struct SessionCallbacks;

impl activity_based::Callbacks for SessionCallbacks {
  fn session_id_changed(&self, _session_id: &str) {
    // TODO(snowp): Consider exposing this hook eventually.
  }
}

struct MetadataProvider {
  app_id: String,
  app_version: String,
  os: String,
  os_version: String,
  locale: String,
}

impl MetadataProvider {
  const fn new(
    app_id: String,
    app_version: String,
    os: String,
    os_version: String,
    locale: String,
  ) -> Self {
    Self {
      app_id,
      app_version,
      os,
      os_version,
      locale,
    }
  }
}

impl bd_logger::MetadataProvider for MetadataProvider {
  fn timestamp(&self) -> anyhow::Result<time::OffsetDateTime> {
    Ok(time::OffsetDateTime::now_utc())
  }

  fn fields(&self) -> anyhow::Result<(LogFields, LogFields)> {
    Ok((
      [].into(),
      [
        ("app_id".into(), self.app_id.as_str().into()),
        ("app_version".into(), self.app_version.as_str().into()),
        ("os".into(), self.os.as_str().into()),
        ("os_version".into(), self.os_version.as_str().into()),
        ("_locale".into(), self.locale.as_str().into()),
      ]
      .into(),
    ))
  }
}

struct StaticMetadata {
  app_id: String,
  app_version: String,
  platform: Platform,
  device_id: String,
}

impl StaticMetadata {
  pub const fn new(
    app_id: String,
    app_version: String,
    platform: Platform,
    device_id: String,
  ) -> Self {
    Self {
      app_id,
      app_version,
      platform,
      device_id,
    }
  }
}

impl bd_metadata::Metadata for StaticMetadata {
  fn collect_inner(&self) -> HashMap<String, String> {
    [
      ("app_version".to_string(), self.app_version.clone()),
      ("app_id".to_string(), self.app_id.clone()),
    ]
    .into()
  }

  fn sdk_version(&self) -> &'static str {
    // TODO(snowp): Figure out the story for electron for SDK version.
    "0.1.0"
  }

  fn device_id(&self) -> String {
    self.device_id.clone()
  }

  fn platform(&self) -> &Platform {
    &self.platform
  }

  fn os(&self) -> String {
    if cfg!(target_os = "macos") {
      "macos".to_string()
    } else if cfg!(target_os = "linux") {
      "linux".to_string()
    } else if cfg!(target_os = "windows") {
      "windows".to_string()
    } else {
      "unknown".to_string()
    }
  }
}

//
// Naive in-memory key-storage backed by disk files
//

pub struct DiskStorage {
  root: PathBuf,
  state: parking_lot::Mutex<HashMap<String, String>>,
}

impl DiskStorage {
  pub fn new(root: PathBuf) -> Result<Self, std::io::Error> {
    std::fs::create_dir_all(&root)?;

    Ok(Self {
      root,
      state: parking_lot::Mutex::new(HashMap::new()),
    })
  }

  fn path(&self, key: &str) -> PathBuf {
    let mut hasher = DefaultHasher::new();
    key.hash(&mut hasher);
    self.root.join(hasher.finish().to_string())
  }
}

impl Storage for DiskStorage {
  fn set_string(&self, key: &str, value: &str) -> anyhow::Result<()> {
    let mut guard = self.state.lock();
    std::fs::write(self.path(key), value.as_bytes())?;

    let mut state = guard.clone();
    state.insert(key.to_string(), value.to_string());
    *guard = state;

    Ok(())
  }

  fn get_string(&self, key: &str) -> anyhow::Result<Option<String>> {
    let mut guard = self.state.lock();
    if guard.contains_key(key) {
      return Ok(guard.get(key).cloned());
    }

    let mut state = guard.clone();
    std::fs::read_to_string(self.path(key))
      .map(|value| {
        state.insert(key.to_string(), value.to_string());
        *guard = state;
        Some(value)
      })
      .or_else(|_| Ok(None))
  }

  fn delete(&self, key: &str) -> anyhow::Result<()> {
    self.state.lock().remove(key);
    let _ = std::fs::remove_file(self.path(key));
    Ok(())
  }
}

//
// EmptyTarget
//

pub struct EmptyTarget;

impl bd_resource_utilization::Target for EmptyTarget {
  fn tick(&self) {}
}

impl bd_session_replay::Target for EmptyTarget {
  fn capture_screen(&self) {}
  fn capture_screenshot(&self) {}
}

impl bd_events::ListenerTarget for EmptyTarget {
  fn start(&self) {}
  fn stop(&self) {}
}
