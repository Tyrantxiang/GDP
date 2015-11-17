"use strict";

var Canvas = require('canvas'),
	fs = require('fs'),
	Image = Canvas.Image;

function generateImage(outputname, parts, cb){
	var canvas = new Canvas(45, 45),
		ctx = canvas.getContext('2d');

	drawParts();

	function drawParts(){
		var part = parts.shift();
		if (!part){
			saveCanvas();
		}else{
			var img = new Image;
			img.onload = function(){
				ctx.drawImage(img, 0, 0, 45, 45);
				drawParts();
			};
			img.src = __dirname + '/' + part + '.png';
		}
	}

  function saveCanvas(){
    canvas.toBuffer(function(err, buf){
      if (err){
        cb(err);
      }else{
        fs.writeFile(__dirname + '/' + outputname, buf, function(){
          cb();
        });
	  }
    });
  }
}

module.exports = generateImage;
