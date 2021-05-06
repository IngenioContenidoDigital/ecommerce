module.exports = {
  friendlyName: 'Get tag',
  description: '',
  inputs: {
    host:{
      type:'string',
      required:true
    }
  },
  exits: {
    success: {
      outputFriendlyName: 'Tag',
    },
  },
  fn: async function (inputs,exits) {

    let host = inputs.host;
    let tag = null;
    let tagid=null;
    let seller = await Seller.findOne({domain:host});
    if(seller){
      tagid = seller.tagManager;
    }else{
      tagid = 'GTM-PRNQR66';
    }

    if(tagid){
      tag=`
        <script>dataLayer = [];</script>
        <!-- Google Tag Manager -->
        <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','`+tagid+`');</script>
        <!-- End Google Tag Manager -->`;
    }
    
    return exits.success(tag);

  }


};

