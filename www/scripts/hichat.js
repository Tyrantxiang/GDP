window.onload = function(){
	var hichat = new Hichat();
	hichat.init();
};

var Hichat = function(){
	this.socket = null;
};

Hichat.prototype = {
	init: function(){
		var that = this;
		this.socket = io.connect();
		this.socket.on('connect', function(){
			document.getElementById('info').textContent = 'get yourself a nickname:)';
			document.getElementById('nickWrapper').style.display = 'block';
			document.getElementById('loginBtn').addEventListener('click', function(){
				var nickName = document.getElementById('nicknameInput').value;
				if(nickName.trim().length != 0){
					that.socket.emit('login', nickName);
				}else{
					document.getElementById('nicknameInput').focus();
				};
			}, false);

		});
		 this.socket.on('nickExisted',function(){
                        document.getElementById('info').textContent ='nickname is taken';
                });
		this.socket.on('loginSuccess',function(){
			document.title= 'hichat |'+document.getElementById('nicknameInput').value;
			document.getElementById('loginWrapper').style.display = 'none';
			document.getElementById('messageInput').focus();
		});
		this.socket.on('system',function(nickName, userCount, type){
			var msg = nickName + (type == 'login' ? 'joined' : 'left');
			var p = document.createElement('p');
			p.textContent =msg;
			document.getElementById('historyMsg').appendChild(p);
			that._displayNewMsg('system',msg,'red');
			document.getElementById('status').textContent = userCount + (userCount > 1 ? 'users' : 'user')+ 'online';
	});
		document.getElementById('sendBtn').addEventListener('click',function(){
			var messageInput = document.getElementById('messageInput');
		    	var msg = messageInput.value;
			console.log(msg);
			messageInput.value = '';
			messageInput.focus();
			if(msg.trim().length != 0){
				that.socket.emit('postMsg', msg, color);
				that._displayNewMsg('me', msg, color);
			};
		}, false);
		this.socket.on('newMsg', function(user,msg){
			that._displayNewMsg(user,msg,color);
		});
		document.getElementById('sendImage').addEventListener('change',function(){
			if(this.files.length != 0){
				var file = this.files[0],
				reader = new FileReader();
				if(!reader){
					that._displayNewMsg('system', '!your browser dose not support fileReader', 'red');
					this.value = '';
					return;
				}
				reader.onload = function(e){
					this.value = '';
					that.socket.emit('img',e.target.result);
					that._displayImage('me',e.target.result);	
				};
				reader.readAsDataURL(file);
			};
		},false);
		this.socket.on('newImg',function(user,img){
			that._displayImage(user,img);	
		});	
		this._initialEmoji();
		document.getElementById('emoji').addEventListener('click',function(e){
			var emojiwrapper= document.getElementById('emojiWrapper');
			emojiwrapper.style.display = 'block';
			e.stopPropagation();
		}, false);
		document.body.addEventListener('click',function(e){
			var emojiwrapper = document.getElementById('emojiWrapper');
			if(e.target != emojiwrapper){
				emojiwrapper.style.display = 'none';
			}
		});
		document.getElementById('emojiWrapper').addEventListener('click',function(e){
			var target = e.target;
			if(target.nodeName.toLowerCase() == 'img'){
				var messageInput = document.getElementById('messageInput');
				messageInput.focus();
				messageInput.value = messageInput.value + '[emoji:'+target.title+']';
			}
		}, false);
	},
	_displayNewMsg: function(user,msg,color){
		var container = document.getElementById('historyMsg'),
		    msgToDisplay = document.createElement('p'),
		    date = new Date().toTimeString().substr(0,8);
		    msg = this._showEmoji(msg);
		    msgToDisplay.style.color = color || '#000';
		    msgToDisplay.innerHTML = user + '<span class="timespan">('+date+'):</span>'+msg;
		    container.appendChild(msgToDisplay);
                    container.scrollTop = container.scrollHeight;
	},
	
        _displayImage: function(user, imgData, color){
		var container = document.getElementById('historyMsg'),
		    msgToDisplay = document.createElement('p'),
		    date = new Date().toTimeString().substr(0,8);
		msgToDisplay.style.color = color || '#000';
		msgToDisplay.innerHTML = user + '<span class="timespan">('+date+'): </span><br/>'+'<a href="'+imgData+'"target="_blank"><img src="'+imgData+'"/></a>';
		container.appendChild(msgToDisplay);
		container.scrollTop = container.scrollHeight;
	},
	_initialEmoji: function(){
		var emojiContainer = document.getElementById('emojiWrapper'),
		    docFragment = document.createDocumentFragment();
		for(var i=69;i>0;i--){
			var emojiItem = document.createElement('img');
			emojiItem.title = i;
			docFragment.appendChild(emojiItem);
		}
		emojiContainer.appendChild(docFragment);
	},
        _showEmoji: function(msg){
		var match, result = msg;
		var reg = /\[emoji:\d+\]/g;
		var emojiIndex;
		var totalEmojiNum = document.getElementById('emojiWrapper').children.length;
		while(match = reg.exec(msg)){
			emojiIndex = match[0].slice(7,-1);
			if(emojiIndex >totalEmojiNum){
				result = result.replace(match[0],'[X]');
			}else{
				result = result.replace(match[0],'<img class="emoji" src="../content/emoji/'+emojiIndex+'.gif"/>');
			}

		};
		return result;
	},	
};
