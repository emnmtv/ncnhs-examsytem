const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  
  // Disable source maps in production
  productionSourceMap: false,
  
  // Set the title consistently for webpack
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].title = "NCNHS Assessment Portal";
      return args;
    });
    
    // Add code obfuscation in production
    if (process.env.NODE_ENV === 'production') {
      const JavaScriptObfuscator = require('webpack-obfuscator');
      config.plugin('obfuscator').use(JavaScriptObfuscator, [{
        rotateStringArray: true,
        stringArray: true,
        stringArrayEncoding: ['base64'],
        identifierNamesGenerator: 'hexadecimal',
        renameGlobals: false,
        selfDefending: true
      }]);
    }
  },
  
  devServer: {
    port: 4201,
  },
  pwa: {
    name: 'NCNHS Assessment Portal',
    themeColor: '#159750',
    msTileColor: '#159750',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    manifestOptions: {
      name: "NCNHS Assessment Portal",
      short_name: "NCNHS Portal",
      theme_color: "#159750",
      background_color: "#ffffff",
      display: "standalone",
      orientation: "portrait",
      scope: "/",
      start_url: "/",
      id: "/",
      icons: [
        {
          src: "/img/icons/logo-192x192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any"
        },
        {
          src: "/img/icons/logo-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any"
        },
        {
          src: '/img/icons/android-chrome-maskable-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'maskable'
        },
        {
          src: '/img/icons/android-chrome-maskable-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ],
      screenshots: [
        {
          src: "/img/screenshots/desktop.png",
          sizes: "1280x800",
          type: "image/png",
          form_factor: "wide",
          label: "NCNHS Assessment Portal Desktop View"
        },
        {
          src: "/img/screenshots/mobile.png",
          sizes: "390x844",
          type: "image/png",
          label: "NCNHS Assessment Portal Mobile View"
        }
      ]
    },
    workboxPluginMode: 'GenerateSW',
    workboxOptions: {
      skipWaiting: true,
      clientsClaim: true,
      exclude: [/\.map$/, /_redirects/],
      runtimeCaching: [
        {
          urlPattern: new RegExp('^https://fonts.(?:googleapis|gstatic).com/(.*)'),
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts',
            expiration: {
              maxEntries: 30,
              maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            }
          }
        }
      ]
    }
  }
})
