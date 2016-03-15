System.register(['aurelia-polyfills', 'aurelia-pal-browser', 'aurelia-loader-webpack'], function (_export) {
  'use strict';

  var initialize, WebpackLoader, bootstrapQueue, sharedLoader, Aurelia;

  _export('bootstrap', bootstrap);

  function onBootstrap(callback) {
    return new Promise(function (resolve, reject) {
      if (sharedLoader) {
        resolve(callback(sharedLoader));
      } else {
        bootstrapQueue.push(function () {
          try {
            resolve(callback(sharedLoader));
          } catch (e) {
            reject(e);
          }
        });
      }
    });
  }

  function ready(global) {
    return new Promise(function (resolve, reject) {
      if (global.document.readyState === 'complete') {
        resolve(global.document);
      } else {
        global.document.addEventListener('DOMContentLoaded', completed);
        global.addEventListener('load', completed);
      }

      function completed() {
        global.document.removeEventListener('DOMContentLoaded', completed);
        global.removeEventListener('load', completed);
        resolve(global.document);
      }
    });
  }

  function handleApp(loader, appHost) {
    return config(loader, appHost, appHost.getAttribute('aurelia-app'));
  }

  function config(loader, appHost, configModuleId) {
    var aurelia = new Aurelia(loader);
    aurelia.host = appHost;

    if (configModuleId) {
      return loader.loadModule(configModuleId).then(function (customConfig) {
        return customConfig.configure(aurelia);
      });
    }

    aurelia.use.standardConfiguration().developmentLogging();

    return aurelia.start().then(function () {
      return aurelia.setRoot();
    });
  }

  function run() {
    return ready(window).then(function (doc) {
      initialize();

      var appHost = doc.querySelectorAll('[aurelia-app]');
      var loader = new WebpackLoader();
      loader.loadModule('aurelia-framework').then(function (m) {
        Aurelia = m.Aurelia;
        for (var i = 0, ii = appHost.length; i < ii; ++i) {
          handleApp(loader, appHost[i])['catch'](console.error.bind(console));
        }

        sharedLoader = loader;
        for (var i = 0, ii = bootstrapQueue.length; i < ii; ++i) {
          bootstrapQueue[i]();
        }
        bootstrapQueue = null;
      });
    });
  }

  function bootstrap(configure) {
    return onBootstrap(function (loader) {
      var aurelia = new Aurelia(loader);
      return configure(aurelia);
    });
  }

  return {
    setters: [function (_aureliaPolyfills) {}, function (_aureliaPalBrowser) {
      initialize = _aureliaPalBrowser.initialize;
    }, function (_aureliaLoaderWebpack) {
      WebpackLoader = _aureliaLoaderWebpack.WebpackLoader;
    }],
    execute: function () {
      bootstrapQueue = [];
      sharedLoader = null;
      Aurelia = null;

      run();
    }
  };
});