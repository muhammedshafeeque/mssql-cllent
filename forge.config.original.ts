import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    executableArgs: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    name: 'Byzand',
    executableName: 'byzand',
    appVersion: '1.0.0',
    appCopyright: '© 2025 Byzand MSSQL Client',
    appBundleId: 'com.byzand.mssql-client',
    appCategoryType: 'public.app-category.developer-tools',
    icon: './assets/icon', // We'll create this
    win32metadata: {
      CompanyName: 'Byzand',
      ProductName: 'Byzand MSSQL Client',
      FileDescription: 'A beautiful MSSQL database client application',
      OriginalFilename: 'byzand.exe',
      InternalName: 'byzand',
    },
  },
  rebuildConfig: {},
  makers: [
    // Windows .exe installer
    new MakerSquirrel({
      name: 'byzand',
      setupExe: 'Byzand-Setup.exe',
      setupIcon: './assets/icon.ico',
      noMsi: true,
      remoteReleases: '',
      authors: 'Byzand Team',
      description: 'A beautiful MSSQL database client application',
      exe: 'byzand.exe',
      iconUrl: 'https://raw.githubusercontent.com/your-repo/byzand/main/assets/icon.ico',
      setupIcon: './assets/icon.ico',
      certificateFile: process.env.WINDOWS_CERTIFICATE_FILE,
      certificatePassword: process.env.WINDOWS_CERTIFICATE_PASSWORD,
    }),
    // Linux .deb installer
    new MakerDeb({
      options: {
        maintainer: 'Byzand Team',
        name: 'byzand',
        productName: 'Byzand MSSQL Client',
        description: 'A beautiful MSSQL database client application',
        version: '1.0.0',
        section: 'devel',
        arch: 'amd64',
        depends: [
          'libgtk-3-0',
          'libnotify4',
          'libnss3',
          'libxss1',
          'libxtst6',
          'xdg-utils',
        ],
        categories: ['Development', 'Database'],
        icon: './assets/icon.png',
      },
    }),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
      // Add electron flags to disable sandboxing
      electronArgs: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
