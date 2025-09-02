const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  productionSourceMap: false,
  filenameHashing: true,
  // Set the title consistently for webpack
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].title = "NCNHS Assessment Portal";
      return args;
    });
    
    // Optimize production build to avoid stack overflow
    if (process.env.NODE_ENV === 'production') {
      // Increase optimization concatenation limit
      config.optimization.concatenateModules(true);
      config.optimization.set('concatenateModules', true);
      
      // Add terser options to prevent excessive optimization that may cause recursion
      config.optimization.minimizer('terser').tap((args) => {
        args[0].terserOptions = {
          ...args[0].terserOptions,
          compress: {
            ...args[0].terserOptions.compress,
            drop_console: true,
            pure_funcs: ['console.log'],
            passes: 2,
            keep_infinity: true
          },
          safari10: true,
          output: {
            comments: false,
            ascii_only: true
          }
        };
        return args;
      });
    }
  },
  
  devServer: {
    port: 4201,
    https: process.env.NODE_ENV === 'production',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    }
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
      navigateFallback: '/index.html',
      navigateFallbackDenylist: [/^\/api/, /^\/admin/],
      directoryIndex: 'index.html',
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
        },
        {
          urlPattern: /\.(?:js|css)$/,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'static-resources',
            expiration: {
              maxEntries: 60,
              maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
            }
          }
        },
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images',
            expiration: {
              maxEntries: 60,
              maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
            }
          }
        }
      ]
    }
  },
  configureWebpack: {
    optimization: {
      splitChunks: {
        chunks: 'all',
        minSize: 30000,
        maxSize: 250000,
        minChunks: 1,
        maxAsyncRequests: 5,
        maxInitialRequests: 3
      }
    },
    performance: {
      hints: false
    }
  }
})
