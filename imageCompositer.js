"use strict";

/**
 * Module for creating an image generator, taking image parts and layering them into a complete image
 *
 * @module imageCompositer
 */

var Canvas = require('canvas'),
	fs = require('fs'),
	Image = Canvas.Image;

/**
 * Creates a new image generator with the given size
 *
 * @alias module:imageCompositer
 * @param {int} size - Size of the overall image in pixels?
 * @return {module:imageCompositer~generateImage} - The image generation function
 */
function setImageSize(size){
	/** 
	 * Function to generate an image
	 *
	 * @param {string[]} parts - Array of the locations of the parts to build the image on
	 * @return {string} The base64 string representing the composite image 
	 */
	function generateImage(parts){
		var imgSize = size;
		
		var canvas = new Canvas(imgSize, imgSize),
			ctx = canvas.getContext('2d');
		
		var part = parts.shift();
		while(part){
			var img = new Image;
			img.onload = function(){
				ctx.drawImage(img, 0, 0, imgSize, imgSize);
			};
			img.src = part;
			part = parts.shift();
		}
		
		return canvas.toBuffer().toString('base64');
	}
	
	return generateImage;
}


module.exports = setImageSize;
