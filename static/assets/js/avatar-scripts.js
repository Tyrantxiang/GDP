$(document).ready(function() {
    $(".img-select").hover(
        function() { $(this).addClass("Hover"); },
        function() { $(this).removeClass("Hover"); }
    );

  window.comms.get_user_unlocked_items(function (items) {
    console.log(items);
    var latch = (function(num, complete){
      return function(){
        num--;
        if(num === 0){
            complete();
        }
      }
    })(Object.keys(items).length, function(){
      $('#head-menu').children().first().addClass('active');
      $('#eyes-menu').find('img:first').addClass('active');
      $('#upper-menu').find('img:first').addClass('active');
      $('#skin-menu').find('img:first').addClass('active');

    // Round rectangle shape 
      CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x+r, y);
        this.arcTo(x+w, y,   x+w, y+h, r);
        this.arcTo(x+w, y+h, x,   y+h, r);
        this.arcTo(x,   y+h, x,   y,   r);
        this.arcTo(x,   y,   x+w, y,   r);
        this.closePath();
        return this;
      }
      
      // Draw white background on canvas
      var c = $("#avatar-create")[0];
      var ctx = c.getContext("2d");
      ctx.roundRect(0, 0, 350, 500, 20);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
    });

    for (var i in items) {       
      window.comms.get_single_item_info(items[i], function (item) {
        switch(item.slot){
          case "head":
            $('#head-menu').append('<img src="'+item.url+'" class="col-md-3 white-img-box">');
            break;
          case "eyes":
            // console.log(items[i]);
            $('#eyes-menu').append('<img src="'+item.url+'" class="col-md-3 white-img-box">');
            break;
          case "shirt":
            // console.log(items[i]);
            $('#upper-menu').append('<img src="'+item.url+'" class="col-md-3 white-img-box">');
            break;
          case "skin":
            // console.log(items[i]);
            $('#skin-menu').append('<img src="'+item.url+'" class="col-md-3 white-img-box">');
            break;
          }
          latch();
      });
    }
  });
  
  $(document).on("click", '.white-img-box', function(e) {
    // e.preventDefault();
    alert("clicked image");
    $('.white-img-box').removeClass('active');
    $(this).addClass('active');
    
  });

  function equipItemsOnSelect() {

  }

});

