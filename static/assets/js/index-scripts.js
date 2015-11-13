$(function() {


  // Functions for changing the view
  $(document).on('click', '.signup-btn', function () {
    $.get("/views/signup.html", function(data){
      $("#main-content-area").html(data);
    });
  });

  $(document).on('click', '.login-btn', function () {
    $.get("/views/login.html", function(data){
      $("#main-content-area").html(data);
    });
  });


  // Login submission button
  $(document).on('click', '.login-submit', function () {
    // Get the values
    var username = $("#login_username").val(),
      password = $("#login_password").val();

    comms.authenticate(username, password, function(data){
      if(data){
        alert("an error");
      }else{
        alert("no error");
      }
    });
  });


  // Signup scripts!
  $(document).on('keyup', '#signup_username', function (event) {
    // Send data to the server to check if it is valid
    var v = $(event.currentTarget).val();
    comms.user_management.validate_username(v, function(data){
      if(data.valid){
        $(".signup_username-error").addClass("hidden");
        $(".signup_username-ok").removeClass("hidden");
      }else{
        $(".signup_username-ok").addClass("hidden");
        $(".signup_username-error").removeClass("hidden");
      }
    });
  });


});

