const auth = firebase.auth();

const errorBox = document.getElementById("error");

function login() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, pass)
    .then(() => {
      window.location.href = "home.html";
    })
    .catch(err => {
      errorBox.innerText = "Login Failed: " + err.message;
    });
}

function signup() {
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;

  auth.createUserWithEmailAndPassword(email, pass)
    .then(() => {
      alert("Signup successful! You are now logged in.");
      window.location.href = "home.html";
    })
    .catch(err => {
      errorBox.innerText = "Signup Failed: " + err.message;
    });
}


