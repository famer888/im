// vue.config.js

const path = require('path');
const CopywebpackPlugin = require('copy-webpack-plugin');
function resolve(dir) {
  return path.join(__dirname, dir);
}
module.exports = {
  publicPath: '.',
  chainWebpack: (config) => {
    config.module.rules.delete('eslint');
    config.module
      .rule('images')
      .use('url-loader')
      .loader('url-loader')
      .tap((options) => Object.assign(options, { limit: 1 }));
  },
  productionSourceMap: false,
  configureWebpack: {
    target: 'web',
    node: {
      __dirname: true,
      __filename: true,
      dgram: 'empty',
      net: 'empty',
      tls: 'empty',
      dns: 'empty',
      child_process: 'empty',
    },
    resolve: {
      mainFields: ['browser', 'module', 'main'],
      alias: {
        'electron': path.resolve(__dirname, 'src/shims/electron-renderer.js'),
        '@electron/remote': path.resolve(__dirname, 'src/shims/electron-remote-renderer.js'),
        'file-system': path.resolve(__dirname, 'src/shims/file-system.js'),
      },
    },
  },
  pluginOptions: {
    chainWebpack: (config) => {
      config.resolve.alias.set('@', resolve('src'));
      config.module.rule('vue').use('vue-loader').loader('vue-loader');
    },
    electronBuilder: {
      externals: ['electron-screenshots', '@electron/remote'],
      chainWebpackMainProcess: (config) => {
        // Chain webpack config for electron main process only
        config.module
          .rule('native')
          .test(/\.node$/)
          .use('native-ext-loader')
          .loader('native-ext-loader')
          .end();
        // config.externals({
        //     'electron-screenshots': 'require("electron-screenshots")'
        // });
        config.plugin('copy').use(CopywebpackPlugin, [
          [
            {
              from: `${__dirname}/public/**/*`,
              to: `${__dirname}/dist_electron`,
            },
          ],
        ]);
      },
      chainWebpackRendererProcess: (config) => {
        // Chain webpack config for electron renderer process only (won't be applied to web builds)
      },
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      // Use this to change the entrypoint of your app's main process
      // mainProcessFile: 'src/myBackgroundFile.js',
      // Use this to change the entry point of your app's render process. default src/[main|index].[js|ts]
      // rendererProcessFile: 'src/myMainRenderFile.js',
      // Provide an array of files that, when changed, will recompile the main process and restart Electron
      // Your main process file will be added by default
      // mainProcessWatch: ['src/myFile1', 'src/myFile2'],
      // Provide a list of arguments that Electron will be launched with during "electron:serve",
      // which can be accessed from the main process (src/background.js).
      // Note that it is ignored when --debug flag is used with "electron:serve", as you must launch Electron yourself
      // Command line args (excluding --debug, --dashboard, and --headless) are passed to Electron as well
      // mainProcessArgs: ['--arg-name', 'arg-value']
      mainProcessArgs: ['--disable-background-timer-throttling', ''],
      // outputDir: 'release',
      builderOptions: {
        // 产品名称
        productName: process.env.VUE_APP_PACKNAME,
        // 使用 extraMetadata 覆盖打包后的 name（决定 userData 路径），不会修改源 package.json
        extraMetadata: {
          name: process.env.VUE_APP_PACKNAME,
        },
        // 修改appId是，需要同时修改backgroud.js里面设置的appUserModelId，设置见：app.setAppUserModelId(xxx)
        appId: 'cn.otc.chat',
        compression: 'normal',
        artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
        protocols: {
          name: 'wf-deep-linking',
          schemes: ['wfc'],
        },
        directories: {
          output: './dist', //输出文件路径
        },
        mac: {
          extendInfo: {
            NSCameraUsageDescription: 'This app requires camera access to record video.',
            NSMicrophoneUsageDescription: 'This app requires microphone access to record audio.',
            // 允许应用在后台运行
            LSBackgroundOnly: false,
            NSSupportsAutomaticGraphicsSwitching: true,
          },
          hardenedRuntime: true,
          gatekeeperAssess: false,
          entitlements: 'build/mac/entitlements.mac.plist',
          entitlementsInherit: 'build/mac/entitlements.mac.plist',
          target: [
            {
              target: 'default',
              arch: ['universal'],
            },
          ],
        },
        win: {
          //win相关配置
          icon: './favicon.ico', //图标，当前图标在根目录下，注意这里有两个坑
          target: [
            {
              target: 'nsis', //利用nsis制作安装程序
              arch: [
                'x64', //64位
              ],
            },
          ],
        },
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          artifactName: '${productName}-${version}-${os}-${arch}-setup.${ext}',
          deleteAppDataOnUninstall: true,
          perMachine: false,
          createDesktopShortcut: true,
          shortcutName: 'ocs-im',
        },
      },
    },
  },
};
