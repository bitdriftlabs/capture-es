import { app, BrowserWindow, ipcMain } from 'electron';
import {
  init,
  debug,
  generateDeviceCode,
  SessionStrategy,
} from '@bitdrift/electron';
import { config as configDotenv } from 'dotenv';

configDotenv();

// Initialize bitdrift
const logger = init(
  process.env['BITDRIFT_KEY'] ?? 'invalid key',
  SessionStrategy.Fixed,
  {
    url: process.env['BITDRIFT_URL'],
    appVersion: '1.0.0',
  },
);

ipcMain.on('bitdrift:log', (_, level, message, fields) => {
  console.log(
    `Renderer sending log level: ${level} message: ${message} with fields: ${JSON.stringify(fields)}`,
  );
  logger.log(level, message, fields ?? {});
});

const createWindow = async () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      preload: __dirname + '/preload.js',
    },
  });

  debug('App started');
  win.loadFile('index.html');
  console.log(`Device Code: ${await generateDeviceCode()}`);
  win.webContents.openDevTools();
};

app.whenReady().then(() => {
  createWindow();
});
