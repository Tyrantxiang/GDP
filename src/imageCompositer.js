"use strict";

/**
 * Module for creating an image generator, taking image parts and layering them into a complete image
 *
 * @module imageCompositer
 */

var Canvas = require('canvas');

/**
 * Creates a new image generator with the given size
 *
 * @alias module:imageCompositer
 * @param {int} size - Size of the overall image in pixels
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
		var canvas = new Canvas(size, size),
			ctx = canvas.getContext('2d');
			
		/** 
		 * Function to provide writing an image to the canvas
		 *
		 * @param {Image} img - the image to write to the canvas
		 * @return {Function} A function that performs the write to the canvas
		 */
		function ctxDraw(img){
			return function(){
				ctx.drawImage(img, 0, 0, size, size);
			};
		}
		
		var part = parts.shift();
		while(part){
			var img = new Canvas.Image();
			img.onload = ctxDraw(img);
			img.src = part;
			part = parts.shift();
		}
		
		return canvas.toBuffer().toString('base64');
	}
	
	return generateImage;
}

module.exports = setImageSize;