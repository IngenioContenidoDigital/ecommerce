module.exports = {
  friendlyName: 'File upload',
  description: 'Proceso de Carga de Archivos',
  inputs: {
    req:{type:'ref'},
    field: {type:'string'},
    size: {type:'number'},
    route:{type:'string'}
  },
  exits: {
    success: {
      description: 'All done.',
    },
    badRequest:{
      description: 'Error'
    },
    serverError:{
      description: 'Error de Proceso'
    }
  },
  fn: async function (inputs,exits) {
    let files = [];
    let images=['jpeg','png','jpg','gif'];
    inputs.req.file(inputs.field).upload({
      maxBytes: inputs.size,
      dirname: require('path').resolve(sails.config.appPath, inputs.route)
    },function whenDone(err, uploadedFiles) {
      if (err) {return exits.serverError(err);
      }else if (uploadedFiles.length === 0){
        return exits.badRequest('No file was uploaded');
      }else{
        for(let i=0; i<uploadedFiles.length; i++){
          let filename = uploadedFiles[i].fd.split('/').pop();
          let ext = filename.split('.').pop();
          if(images.includes(ext)){
            let chain = filename.replace(ext,'');
            const sharp = require('sharp');
            sharp(uploadedFiles[i].fd)
            .toFile(inputs.route+'/'+chain+'webp', (err, info) => {
              if(err){return err;}else{return info;}
            });
          }
          files.push(filename);
        }
        return exits.success(files);
      }

      //var baseUrl = sails.config.custom.baseUrl;

      // Save the "fd" and the url where the avatar for a user can be accessed
      /*User.update(req.session.userId, {

        // Generate a unique URL where the avatar can be downloaded.
        avatarUrl: require('util').format('%s/user/avatar/%s', baseUrl, req.session.userId),

        // Grab the first file and use it's `fd` (file descriptor)
        avatarFd: uploadedFiles[0].fd
      })
      .exec(function (err){
        if (err) return res.serverError(err);
        return res.ok();
      });*/
    });
  }


};

