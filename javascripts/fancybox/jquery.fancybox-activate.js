$(document).ready(function() {
                  // Set custom style, close if clicked, change title type and overlay color
                  $(".fancybox-effects-a").fancybox({
                      wrapCSS : 'fancybox-custom',
                      closeClick : true,
                      
                      openEffect : 'none',
                      
                      helpers : {
                        title : {
                          type : 'inside'
                        },
                        overlay : {
                          css : {
                          'background' : 'rgba(238,238,238,0.85)'
                          }
                        }
                      }
                    });
});
