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
      if(data.authenticated){
        console.log("authenticated");
      }else{
        console.log("not authenticated");
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

  $(document).on('keyup', '#signup_password', function (event){
    var v = $(event.currentTarget).val();
    if(v.length >= 6){
        $(".signup_password-error").addClass("hidden");
        $(".signup_password-ok").removeClass("hidden");
      }else{
        $(".signup_password-ok").addClass("hidden");
        $(".signup_password-error").removeClass("hidden");
      }
  });

  $(document).on('keyup', '#signup_repeatPassword', function (event){
    var v = $(event.currentTarget).val();
    if(v === $("#signup_password").val()){
        $(".signup_repeatPassword-error").addClass("hidden");
        $(".signup_repeatPassword-ok").removeClass("hidden");
      }else{
        $(".signup_repeatPassword-ok").addClass("hidden");
        $(".signup_repeatPassword-error").removeClass("hidden");
      }
  });

  $(document).on('change', '#signup_dob', function (event){
    var v = new Date($(event.currentTarget).val());
    if(v < new Date(Date.now() - (1000 * 60 * 60 * 24 * 365 * 10))){
        $(".signup_dob-error").addClass("hidden");
        $(".signup_dob-ok").removeClass("hidden");
      }else{
        $(".signup_dob-ok").addClass("hidden");
        $(".signup_dob-error").removeClass("hidden");
      }
  });

  $(document).on('click', '.signup-submit', function (){
    var username = $("#signup_username").val(),
      password = $("#signup_password").val(),
      dob = $("#signup_dob").val();

    comms.user_management.sign_up(username, password, dob, function(data){
      console.log(data);
    });
  });


});

