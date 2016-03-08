(function(){
  'use strict';

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
  };

  var canvasRadius = 20;

  // Function to draw on the canvas
  function drawAvatar(canvas, img, col){
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.roundRect(0, 0, canvas.width, canvas.height, canvasRadius);
    ctx.fillStyle = col || '#ffffff';
    ctx.fill();
    ctx.drawImage(img, 
      canvas.width / 2 - img.width / 2,
      canvas.height / 2 - img.width / 2);
  }


  var avatar = {};



  avatar.launch = function(slots, equipped){
    $.get('/views/hub/createavatar.html', function(data){
      $('#avatar-creation-overlay').html(data);
      
      // Draw white background on canvas
      var canvas = document.getElementById('avatar-create');
      var ctx = canvas.getContext('2d');
      ctx.roundRect(0, 0, canvas.width, canvas.height, canvasRadius);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Cached image object
      var img;

      // Cache the menus divs
      var menus = {};
      $('.avatar-slot').each(function(){
        var j = $(this);
        menus[j.data('slot')] = j;
      });


      // Closes and commits avatar creation when finished button is clicked
      $('#avatar-creation-close').click(function(){
        var userObj = getUserObject();
        hub.updateEquiptItems(userObj, function(image) {
          hub.closeAvatarCreation();
        });
      });


      // Event listner for when an item is selected
      function avatarItemBoxClick(e){
        $('.avatar-item-box', e.target.parentNode).removeClass('active');
        $(this).addClass('active');
        equipItemsOnSelect();
      }


      // Gets the currently selected item ids
      function getUserObject(){
        var userObj = {};
        for(var i in menus){
          userObj[i] = menus[i].find('.active').data('itemId');
        }
        return userObj;
      }



      // Sets the given item as selected if it matches the given item id
      function setEquippedItemAsActive(itemId, item) {
        if (itemId == $(item).data('itemId')) {
          $(item).addClass('active');
        }
      }



      // Updates the avatar display from the given items
      function updateAvatarDisplay(userObj){
        hub.getAvatarImageFromItems(userObj, function(image){
          img = image;
          drawAvatar(canvas, image);
        });
      }

      function equipItemsOnSelect() {
        var userObj = getUserObject();
        updateAvatarDisplay(userObj);
      }



      // Add the slots to the menu
      var slot, menu, elements, curr;
      for (slot in slots) {

        curr = equipped[slot];

        elements = slots[slot].map(function(item){
          var imgEl = $(document.createElement('img')).attr('src', item.url).data('itemId', item.id).addClass('width-22 white-img-box avatar-item-box').on('click', avatarItemBoxClick);
          // Set as active if it is equipped
          if(curr.id === item.id){
            imgEl.addClass('active');
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
  };




  window.avatar = avatar;
})();
