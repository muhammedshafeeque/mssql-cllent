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
    appVersion: '1.1.0',
    appCopyright: '© 2025 Byzand MSSQL Client',
    appBundleId: 'com.byzand.mssql-client',
    appCategoryType: 'public.app-category.developer-tools',
    icon: './assets/icon',
    out: '/tmp/byzand-build',
    win32metadata: {
      CompanyName: 'Byzand',
      ProductName: 'Byzand MSSQL Client',
      FileDescription: 'A beautiful MSSQL database client application with enhanced features',
      OriginalFilename: 'byzand.exe',
      InternalName: 'byzand',
      ProductVersion: '1.1.0',
      FileVersion: '1.1.0.0',
    },
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      name: 'byzand',
      setupExe: 'Byzand-Setup-v1.1.0.exe',
      setupIcon: './assets/icon.ico',
      noMsi: false, // Enable MSI for better Windows integration
      remoteReleases: '',
      authors: 'Byzand Team',
      description: 'A beautiful MSSQL database client application with enhanced features',
      exe: 'byzand.exe',
      iconUrl: 'https://raw.githubusercontent.com/your-repo/byzand/main/assets/icon.ico',
      setupIcon: './assets/icon.ico',
      version: '1.1.0',
      loadingGif: './assets/icon.png',
      certificateFile: undefined,
      certificatePassword: undefined,
      signWithParams: undefined,
      // Installation directory options
      installDirectoryIcon: './assets/icon.ico',
      // License and terms
      license: './LICENSE.txt',
      // Registry entries for proper uninstall
      registryEntries: [
        {
          root: 'HKCU',
          key: 'Software\\Byzand\\MSSQLClient',
          name: 'InstallPath',
          type: 'REG_SZ',
          value: '[INSTALLDIR]'
        },
        {
          root: 'HKCU',
          key: 'Software\\Byzand\\MSSQLClient',
          name: 'Version',
          type: 'REG_SZ',
          value: '1.1.0'
        }
      ],
      // Installation options
      installDirectoryIcon: './assets/icon.ico',
      // Custom installation steps
      customInstallSteps: [
        {
          name: 'Welcome',
          title: 'Welcome to Byzand MSSQL Client Setup',
          message: 'This wizard will guide you through the installation of Byzand MSSQL Client.\n\nByzand is a powerful and user-friendly database management tool for Microsoft SQL Server.\n\nClick Next to continue, or Cancel to exit Setup.'
        },
        {
          name: 'License',
          title: 'License Agreement',
          message: 'Please read the following license agreement. You must accept the terms of this agreement before continuing with the installation.',
          license: './LICENSE.txt'
        },
        {
          name: 'InstallLocation',
          title: 'Choose Install Location',
          message: 'Choose the folder in which to install Byzand MSSQL Client.',
          defaultLocation: '%LOCALAPPDATA%\\Byzand'
        },
        {
          name: 'ReadyToInstall',
          title: 'Ready to Install',
          message: 'Setup is ready to install Byzand MSSQL Client on your computer.\n\nClick Install to continue with the installation, or click Back to review or change any of your installation settings.'
        }
      ],
      // Additional installer options
      setupExe: 'Byzand-Setup-v1.1.0.exe',
      setupMsi: 'Byzand-Setup-v1.1.0.msi',
      // Installation behavior
      noMsi: false,
      // Custom installer behavior
      installerIcon: './assets/icon.ico',
      uninstallerIcon: './assets/icon.ico',
      // Installation directory
      installDirectory: '%LOCALAPPDATA%\\Byzand',
      // Start menu shortcuts
      startMenuShortcuts: [
        {
          name: 'Byzand MSSQL Client',
          target: 'byzand.exe',
          icon: './assets/icon.ico',
          description: 'Launch Byzand MSSQL Client'
        }
      ],
      // Desktop shortcuts
      desktopShortcuts: [
        {
          name: 'Byzand MSSQL Client',
          target: 'byzand.exe',
          icon: './assets/icon.ico',
          description: 'Launch Byzand MSSQL Client'
        }
      ],
      // Enable automatic updates
      updater: {
        url: 'https://github.com/your-repo/byzand/releases',
        autoDownload: true,
        autoInstallOnAppQuit: true,
      },
    }),
    new MakerDeb({
      options: {
        maintainer: 'Byzand Team',
        name: 'byzand',
        productName: 'Byzand MSSQL Client',
        description: 'A beautiful MSSQL database client application',
        version: '1.1.0',
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
      build: [
        {
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
      electronArgs: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    }),
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
