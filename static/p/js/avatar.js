(function(){
  "user strict";

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

  var canvasRadius = 20;

  // Function to draw on the canvas
  function drawAvatar(canvas, img, col){
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.roundRect(0, 0, canvas.width, canvas.height, canvasRadius);
    ctx.fillStyle = col;
    ctx.fill();
    ctx.drawImage(img, 
      canvas.width / 2 - img.width / 2,
      canvas.height / 2 - img.width / 2);
  }




  window.hub.avatarCreationLoader = function(){
    $.get("/views/createavatar.html", function(data){
      $("#avatar-creation-overlay").html(data);
      
      // Draw white background on canvas
      var canvas = document.getElementById("avatar-create");
      ctx = canvas.getContext("2d");
      ctx.roundRect(0, 0, canvas.width, canvas.height, canvasRadius);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Cached image object
      var img;

      // Cache the menus divs
      var menus = {
        head : $('#head-menu'),
        eyes : $('#eyes-menu'),
        shirt : $('#upper-menu'),
        skin : $('#skin-menu'),
        trousers : $('#lower-menu')
      };


      hub.getUserUnlockedItemsForSlot(Object.keys(menus), function (slots) {
        window.comms.get_user_equipped_items(function(equipped) {

          // Add the slots to the menu
          var slot, menu, elements, curr;
          for (slot in slots) {

            curr = equipped[slot];

            elements = slots[slot].map(function(item){
              var imgEl = $(document.createElement("img")).attr("src", item.url).data("itemId", item.id).addClass("width-22 white-img-box");
              // Set as active if it is equipped
              if(curr.id = item.id){
                imgEl.addClass("active");
              }

              return imgEl;
            });


            menu = menus[slot];
            if(menu){
              // Append to the menu
              menu.append(elements);
            }
          }

          equipItemsOnSelect();
        });
      });
      
      $(document).on("click", '.white-img-box', function(e) {
        $('.white-img-box', e.target.parentNode).removeClass('active');
        $(this).addClass('active');
        equipItemsOnSelect();
      });


      $("#avatar-creation-close").click(function(){
        hub.closeAvatarCreation();
      });


      function setEquippedItemAsActive(itemId, item) {
        if (itemId == $(item).data("itemId")) {
          $(item).addClass('active');
        }
      }


      function equipItemsOnSelect() {
        var userObj = {
          head : menus.head.find('.active').data("itemId"),
          eyes : menus.eyes.find('.active').data("itemId"),
          skin : menus.skin.find('.active').data("itemId"),
          shirt : menus.shirt.find('.active').data("itemId")
        };
        hub.updateEquiptItems(userObj, function(image) {
          img = image;
          drawAvatar(canvas, image, "#ffffff");
        });
      }
    });
  } 
})();
