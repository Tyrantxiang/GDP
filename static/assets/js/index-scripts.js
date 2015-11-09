$(function() {
  $('#signup-btn').on('click', function () {
    loadXMLDoc("signup");
  });

  $('#login-btn').on('click', function () {
    loadXMLDoc("login");
  });
});

function loadXMLDoc(page) {
  var xmlHttp;

  if (window.XMLHttpRequest) {
    xmlHttp = new XMLHttpRequest();
  } else {
    xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
  }

  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState == XMLHttpRequest.DONE ) {
      if(xmlHttp.status == 200){
        document.getElementById("main-content-area").innerHTML = xmlHttp.responseText;
      }
      else if(xmlHttp.status == 400) {
        alert('There was an error 400')
      }
      else {
        alert('something else other than 200 was returned')
      }
    }
  }

  if (page === "signup") {
    xmlHttp.open("GET", "signup.html", true);
  } else if (page === "login") {
    xmlHttp.open("GET", "login.html", true);
  }

  xmlHttp.send();
}