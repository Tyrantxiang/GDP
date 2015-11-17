"use strict";

var Canvas = require('canvas'),
	fs = require('fs'),
	Image = Canvas.Image;

function setImageSize(size){
	function generateImage(outputname, parts){
		var imgSize = size;
		
		var canvas = new Canvas(imgSize, imgSize),
			ctx = canvas.getContext('2d');
		
		var part = parts.shift();
		while(part){
			var img = new Image;
			img.onload = function(){
				ctx.drawImage(img, 0, 0, imgSize, imgSize);
			};
			img.src = __dirname + '/' + part + '.png';
			part = parts.shift();
		}

		canvas.toBuffer(function(err, buf){
		  if (err){}
		  else
			fs.writeFile(__dirname + '/output.png', buf, function(){});
		});
		
		return canvas.toBuffer().toString('base64');
	}
	
	return generateImage;
}

module.exports = setImageSize;
