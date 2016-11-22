// requires
var util = require('util');
var qx = require("../../../../../opt/qooxdoo-5.0.1-sdk/tool/grunt");

// grunt
module.exports = function(grunt) {
  var config = {

    generator_config: {
      let: {
      }
    },

    common: {
      "APPLICATION" : "kisside",
      "QOOXDOO_PATH" : "../../../../../opt/qooxdoo-5.0.1-sdk",
      "LOCALES": ["en"],
      "QXTHEME": "kisside.theme.Theme"
    }

    /*
    myTask: {
      options: {},
      myTarget: {
        options: {}
      }
    }
    */
  };

  var mergedConf = qx.config.mergeConfig(config);
  // console.log(util.inspect(mergedConf, false, null));
  grunt.initConfig(mergedConf);

  qx.task.registerTasks(grunt);

  // grunt.loadNpmTasks('grunt-my-plugin');
};
