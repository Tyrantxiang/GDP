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

      if(!$("#login_username")[0].checkValidity()){
        $("#login_username")[0].setCustomValidity("WRONG!");
      }

    comms.authenticate(username, password, function(data){
      if(data.authenticated){
        console.log("authenticated");
      }else{
        console.log("not authenticated");
      }
    });
  });



  // Signup scripts!
  function signup_validUsername(username, cb){
      comms.user_management.validate_username(user, function(data){
        cb(data.valid);
      });
  }

  function signup_validatePassword(password, cb){
    cb(v.length >= 6);
  }

  function signup_comparePasswords(password1, password2, cb){
    cb(password1 === password2);
  }

  function signup_validateDob(dob, db){
    cb(dob < new Date(Date.now() - (1000 * 60 * 60 * 24 * 365 * 10)));
  }


  $(document).on('keyup', '#signup_username', function (event) {
    // Send data to the server to check if it is valid
    var v = $(event.currentTarget).val();
    signup_validUsername(v, function(valid){
      if(valid){
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
    signup_validatePassword(v, function(valid){
      if(valid){
          $(".signup_password-error").addClass("hidden");
          $(".signup_password-ok").removeClass("hidden");
        }else{
          $(".signup_password-ok").addClass("hidden");
          $(".signup_password-error").removeClass("hidden");
        }
      });
  });

  $(document).on('keyup', '#signup_repeatPassword', function (event){
    var v = $(event.currentTarget).val(),
      v2 = $("#signup_password").val();

    signup_comparePasswords(v, v2, function(valid){ 
      if(valid){
          $(".signup_repeatPassword-error").addClass("hidden");
          $(".signup_repeatPassword-ok").removeClass("hidden");
        }else{
          $(".signup_repeatPassword-ok").addClass("hidden");
          $(".signup_repeatPassword-error").removeClass("hidden");
        }
      });
  });

  $(document).on('change', '#signup_dob', function (event){
    var v = new Date($(event.currentTarget).val());
    
    signup_validateDob(v, function(valid){
      if(valid){
          $(".signup_dob-error").addClass("hidden");
          $(".signup_dob-ok").removeClass("hidden");
        }else{
          $(".signup_dob-ok").addClass("hidden");
          $(".signup_dob-error").removeClass("hidden");
        }
      });
  });



  $(document).on('click', '.signup-submit', function (){
    var username = $("#signup_username").val(),
      password = $("#signup_password").val(),
      repeatPassword = $("#signup_repeatPassword").val(),
      dob = new Date($("#signup_dob").val());


    signup_validUsername(username, function(valid){
      if(!valid){
        console.error("username not valid");
        return;
      }
      signup_validatePassword(password, function(valid){
        if(!valid){
          console.error("password not valid");
          return;
        }
        signup_comparePasswords(password, repeatPassword, function(valid){
          if(!valid){
            console.error("password do not match");
            return;
          }
          signup_validateDob(dob, function(valid){
            if(!valid){
              console.error("password do not match");
              return;
            }

            comms.user_management.sign_up(username, password, dob, function(data){
              console.log(data);
            });

          });
        });
      });
    });
  });


});

