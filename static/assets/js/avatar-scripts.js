$(document).ready(function() {
  
  $(".img-select").hover(
      function() { $(this).addClass("Hover"); },
      function() { $(this).removeClass("Hover"); }
  );

  var canvasWidth = 350;
  var canvasHeight = 450;
  var canvasRadius = 20;

  $('#canvas-div').html('<canvas id="avatar-create" width="'+canvasWidth+'" height="'+canvasHeight+'"></canvas>');
  
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
  ctx.roundRect(0, 0, canvasWidth, canvasHeight, canvasRadius);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  window.comms.get_user_unlocked_items(function (items) {
    var latch = (function(num, complete){
      return function(){
        num--;
        if(num === 0){
            complete();
        }
      }
    })(Object.keys(items).length, function(){
      $('#head-menu').find('img:first').addClass('active');
      $('#eyes-menu').find('img:first').addClass('active');
      $('#upper-menu').find('img:first').addClass('active');
      $('#skin-menu').find('img:first').addClass('active');

    });

    for (var i in items) {       
      window.comms.get_single_item_info(items[i], function (item) {        
        switch(item.slot){
          case "head":
            $('#head-menu').append('<img src="'+item.url+'" id="'+ item.id +'" class="col-md-3 white-img-box">');
            break;
          case "eyes":
            $('#eyes-menu').append('<img src="'+item.url+'" id="'+ item.id +'" class="col-md-3 white-img-box">');
            break;
          case "shirt":
            $('#upper-menu').append('<img src="'+item.url+'" id="'+ item.id +'" class="col-md-3 white-img-box">');
            break;
          case "skin":
            $('#skin-menu').append('<img src="'+item.url+'" id="'+ item.id +'" class="col-md-3 white-img-box">');
            break;
          }
          latch();
      });
    }
  });
  
  $(document).on("click", '.white-img-box', function(e) {
    $('.white-img-box', e.target.parentNode).removeClass('active');
    $(this).addClass('active');
    equipItemsOnSelect();
  });

  $('#favcolor').on("input", function(e) {
    equipItemsOnSelect();
  });


  function equipItemsOnSelect() {
    var bgColor = $('#favcolor').val() ? $('#favcolor').val() : "#ffffff";
    var userObj = {
      head : $('#head-menu .active').attr("id"),
      eyes : $('#eyes-menu .active').attr("id"),
      skin : $('#skin-menu .active').attr("id"),
      shirt : $('#upper-menu .active').attr("id")
    };
    window.comms.update_equipped_items(userObj, function(data) {
      console.log(data);
      var image = new Image();
      image.onload = function() {
        var c = $("#avatar-create")[0];
        var ctx = c.getContext("2d");
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.roundRect(0, 0, canvasWidth, canvasHeight, canvasRadius);
        ctx.fillStyle = bgColor;
        ctx.fill();
        ctx.drawImage(image, 
          canvasWidth / 2 - image.width / 2,
          canvasHeight / 2 - image.width / 2);
      };
      image.src = "data:image/png;base64," + data.avatarImage;
    });
    
  }

});

