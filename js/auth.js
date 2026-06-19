window.login = async function () {

  const email =
    document.getElementById("email").value.trim();

  const password =
    document.getElementById("password").value;

  const errorBox =
    document.getElementById("loginError");

  errorBox.classList.add("hidden");

  try {

    await auth.signInWithEmailAndPassword(
      email,
      password
    );

    window.location.href = "/solar-ai-advisor/public/admin.html";

  }
  catch (error) {

    console.error("Auth error");


    errorBox.classList.remove("hidden");

  }

};
